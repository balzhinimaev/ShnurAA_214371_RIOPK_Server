// src/infrastructure/database/mongoose/repositories/invoice.repository.ts
import { injectable } from 'tsyringe';
// import mongoose, { Types } from 'mongoose';
import {
    IInvoiceRepository,
    AgingBucket,
    DashboardSummaryData,
} from '../../../../domain/repositories/IInvoiceRepository';
import {
    Invoice,
    InvoiceStatus,
} from '../../../../domain/entities/invoice.entity';
import { InvoiceModel, IInvoiceDocument } from '../schemas/invoice.schema';

@injectable()
export class MongoInvoiceRepository implements IInvoiceRepository {
    private mapToDomain(doc: IInvoiceDocument): Invoice {
        const obj = doc.toObject();
        return new Invoice({
            id: obj.id,
            invoiceNumber: obj.invoiceNumber,
            customerId: obj.customerId, // customerId остается строкой после toObject()
            issueDate: obj.issueDate,
            dueDate: obj.dueDate,
            totalAmount: obj.totalAmount,
            paidAmount: obj.paidAmount,
            status: obj.status as InvoiceStatus,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt,
        });
    }

    async findById(id: string): Promise<Invoice | null> {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) return null;
        const doc = await InvoiceModel.findById(id).exec();
        return doc ? this.mapToDomain(doc) : null;
    }

    /**
     * Рассчитывает сводку для дашборда с использованием MongoDB Aggregation Pipeline.
     */
    async getDashboardSummary(
        currentDate = new Date(),
    ): Promise<DashboardSummaryData> {
        const pipeline = [
            { $match: { status: { $ne: 'PAID' } } },
            {
                $addFields: {
                    outstandingAmount: {
                        $subtract: ['$totalAmount', '$paidAmount'],
                    },
                    isOverdue: {
                        $cond: {
                            if: { $lt: ['$dueDate', currentDate] },
                            then: true,
                            else: false,
                        },
                    },
                    daysDifference: {
                        $dateDiff: {
                            startDate: '$dueDate',
                            endDate: currentDate,
                            unit: 'day',
                        },
                    },
                },
            },
            { $match: { outstandingAmount: { $gt: 0 } } }, // Убедимся, что есть долг
            {
                $group: {
                    _id: null,
                    totalReceivables: { $sum: '$outstandingAmount' },
                    overdueReceivables: {
                        $sum: {
                            $cond: ['$isOverdue', '$outstandingAmount', 0],
                        },
                    },
                    agingData: {
                        $push: {
                            amount: '$outstandingAmount',
                            daysOverdue: {
                                $cond: ['$isOverdue', '$daysDifference', null],
                            },
                            isOverdue: '$isOverdue',
                        },
                    },
                },
            },
            { $unwind: '$agingData' },
            {
                $addFields: {
                    'agingData.bucket': {
                        $switch: {
                            branches: [
                                // Сначала проверяем НЕ просроченные
                                {
                                    case: {
                                        $eq: ['$agingData.isOverdue', false],
                                    },
                                    then: 'Current',
                                },
                                // Затем просроченные по интервалам
                                {
                                    case: {
                                        $lte: ['$agingData.daysOverdue', 30],
                                    },
                                    then: '1-30',
                                },
                                {
                                    case: {
                                        $lte: ['$agingData.daysOverdue', 60],
                                    },
                                    then: '31-60',
                                },
                                {
                                    case: {
                                        $lte: ['$agingData.daysOverdue', 90],
                                    },
                                    then: '61-90',
                                },
                                {
                                    case: {
                                        $gt: ['$agingData.daysOverdue', 90],
                                    },
                                    then: '91+',
                                },
                            ],
                            default: 'Error', // Сюда не должно попадать
                        },
                    },
                },
            },
            {
                $group: {
                    _id: '$agingData.bucket', // Группируем по названию корзины
                    amount: { $sum: '$agingData.amount' },
                    count: { $sum: 1 },
                    // Переносим общие суммы
                    totalReceivables: { $first: '$totalReceivables' },
                    overdueReceivables: { $first: '$overdueReceivables' },
                },
            },
            {
                $group: {
                    _id: null,
                    totalReceivables: { $first: '$totalReceivables' },
                    overdueReceivables: { $first: '$overdueReceivables' },
                    agingStructure: {
                        $push: {
                            bucket: '$_id',
                            amount: { $round: ['$amount', 2] },
                            count: '$count',
                        },
                    }, // Округляем сумму
                },
            },
            {
                $project: {
                    _id: 0,
                    totalReceivables: { $ifNull: ['$totalReceivables', 0] }, // Обработка случая, если нет счетов
                    overdueReceivables: { $ifNull: ['$overdueReceivables', 0] },
                    agingStructure: { $ifNull: ['$agingStructure', []] },
                },
            },
        ];

        const result = await InvoiceModel.aggregate(pipeline).exec();

      if (result.length > 0) {
          const summary = result[0] as DashboardSummaryData;
          const standardBucketsForCheck = [
              'Current',
              '1-30',
              '31-60',
              '61-90',
              '91+',
          ]; // Переменная для проверки
          const existingBuckets = summary.agingStructure.map((b) => b.bucket);

          standardBucketsForCheck.forEach((stdBucket) => {
              if (!existingBuckets.includes(stdBucket)) {
                  summary.agingStructure.push({
                      bucket: stdBucket,
                      amount: 0,
                      count: 0,
                  });
              }
          });

          summary.agingStructure.sort(
              (a, b) =>
                  standardBucketsForCheck.indexOf(a.bucket) -
                  standardBucketsForCheck.indexOf(b.bucket),
          );

          summary.totalReceivables = parseFloat(
              summary.totalReceivables.toFixed(2),
          );
          summary.overdueReceivables = parseFloat(
              summary.overdueReceivables.toFixed(2),
          );

          return summary;
      } else {
          // Если нет неоплаченных счетов, возвращаем структуру с нулями
          // Определяем стандартные бакеты ПРЯМО ЗДЕСЬ
          const defaultBuckets = ['Current', '1-30', '31-60', '61-90', '91+'];
          return {
              totalReceivables: 0,
              overdueReceivables: 0,
              agingStructure: defaultBuckets.map((b) => ({
                  bucket: b,
                  amount: 0,
                  count: 0,
              })), // Используем defaultBuckets
          };
      }
    }

    async getAgingReport(
        _buckets: number[],
        _asOfDate = new Date(),
    ): Promise<AgingBucket[]> {
        console.warn('getAgingReport not implemented');
        // Реализация потребует динамического построения $switch или $bucket оператора
        return [];
    }
}
