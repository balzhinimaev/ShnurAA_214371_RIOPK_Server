// src/infrastructure/database/mongoose/repositories/debt-work-record.repository.ts
import { injectable } from 'tsyringe';
import mongoose from 'mongoose';
import { DebtWorkRecord, CustomerDebtWorkStats } from '../../../../domain/entities/debt-work-record.entity';
import { DebtWorkActionType } from '../../../../domain/enums/debt-work-action-type.enum';
import { DebtWorkResult } from '../../../../domain/enums/debt-work-result.enum';
import { RiskLevel } from '../../../../domain/enums/risk-level.enum';
import { DebtWorkRecordModel } from '../schemas/debt-work-record.schema';
import { IDebtWorkRecordRepository, CreateDebtWorkRecordData, FindDebtWorkRecordsOptions } from '../../../../domain/repositories/IDebtWorkRecordRepository';
import { AppError } from '../../../../application/errors/AppError';
import { InvoiceModel } from '../schemas/invoice.schema';

@injectable()
export class MongoDebtWorkRecordRepository implements IDebtWorkRecordRepository {

    private mapToDomain(doc: any | null): DebtWorkRecord | null {
        if (!doc) return null;

        let id: string;
        if (doc.id) {
            id = typeof doc.id === 'string' ? doc.id : doc.id.toString();
        } else if (doc._id) {
            id = typeof doc._id === 'string' ? doc._id : doc._id.toString();
        } else {
            console.error('DebtWorkRecord document missing both id and _id:', doc);
            throw new Error('Не удалось определить ID записи');
        }

        return new DebtWorkRecord({
            id,
            customerId: typeof doc.customerId === 'string' ? doc.customerId : doc.customerId.toString(),
            invoiceId: doc.invoiceId ? (typeof doc.invoiceId === 'string' ? doc.invoiceId : doc.invoiceId.toString()) : undefined,
            actionType: doc.actionType as DebtWorkActionType,
            actionDate: doc.actionDate,
            performedBy: typeof doc.performedBy === 'string' ? doc.performedBy : doc.performedBy.toString(),
            result: doc.result as DebtWorkResult,
            description: doc.description,
            nextActionDate: doc.nextActionDate,
            amount: doc.amount,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    async create(data: CreateDebtWorkRecordData): Promise<DebtWorkRecord> {
        try {
            // Валидация ObjectId для invoiceId (если предоставлен)
            if (data.invoiceId && !mongoose.Types.ObjectId.isValid(data.invoiceId)) {
                throw new AppError(`Невалидный формат invoiceId: ${data.invoiceId}. Ожидается 24-символьная hex-строка ObjectId.`, 400);
            }

            const newRecordDoc = new DebtWorkRecordModel({
                customerId: new mongoose.Types.ObjectId(data.customerId),
                invoiceId: data.invoiceId ? new mongoose.Types.ObjectId(data.invoiceId) : undefined,
                actionType: data.actionType,
                actionDate: data.actionDate,
                performedBy: new mongoose.Types.ObjectId(data.performedBy),
                result: data.result,
                description: data.description,
                nextActionDate: data.nextActionDate,
                amount: data.amount,
            });

            const savedDoc = await newRecordDoc.save();
            const mappedRecord = this.mapToDomain(savedDoc.toObject());
            
            if (!mappedRecord) {
                throw new AppError('Не удалось смаппить запись после создания', 500);
            }

            console.log('[MongoDebtWorkRecordRepository] Created debt work record:', {
                id: mappedRecord.id,
                customerId: mappedRecord.customerId,
                actionType: mappedRecord.actionType,
            });

            return mappedRecord;
        } catch (error: any) {
            console.error('[MongoDebtWorkRecordRepository] Error creating debt work record:', error);
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors)
                    .map((e: any) => e.message)
                    .join(', ');
                throw new AppError(`Ошибка валидации: ${messages}`, 400);
            }
            throw new AppError('Ошибка при создании записи о работе с задолженностью', 500);
        }
    }

    async findById(id: string): Promise<DebtWorkRecord | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }
        try {
            const doc = await DebtWorkRecordModel.findById(id).lean().exec();
            return this.mapToDomain(doc);
        } catch (error) {
            console.error(`[MongoDebtWorkRecordRepository] Error finding record by ID ${id}:`, error);
            throw new Error('Ошибка при поиске записи по ID');
        }
    }

    async findByCustomerId(
        customerId: string,
        options: FindDebtWorkRecordsOptions = { customerId },
    ): Promise<{ records: DebtWorkRecord[]; total: number }> {
        const {
            limit = 50,
            offset = 0,
            sortBy = 'actionDate',
            sortOrder = 'desc',
            invoiceId,
        } = options;

        const filterQuery: any = {
            customerId: new mongoose.Types.ObjectId(customerId),
        };

        if (invoiceId) {
            filterQuery.invoiceId = new mongoose.Types.ObjectId(invoiceId);
        }

        const sortQuery: { [key: string]: 1 | -1 } = {};
        const sortField = sortBy === 'actionDate' ? 'actionDate' : 'createdAt';
        sortQuery[sortField] = sortOrder === 'asc' ? 1 : -1;

        try {
            const [recordDocs, total] = await Promise.all([
                DebtWorkRecordModel.find(filterQuery)
                    .sort(sortQuery)
                    .skip(offset)
                    .limit(limit)
                    .lean()
                    .exec(),
                DebtWorkRecordModel.countDocuments(filterQuery),
            ]);

            const records = recordDocs
                .map((doc) => this.mapToDomain(doc))
                .filter((record): record is DebtWorkRecord => record !== null);

            console.log('[MongoDebtWorkRecordRepository] findByCustomerId - Result:', {
                customerId,
                total,
                returned: records.length,
            });

            return { records, total };
        } catch (error: any) {
            console.error('[MongoDebtWorkRecordRepository] Error finding records by customerId:', error);
            throw new AppError('Ошибка базы данных при получении записей', 500);
        }
    }

    async getCustomerStats(customerId: string): Promise<CustomerDebtWorkStats> {
        try {
            // Получаем все записи для клиента
            const allRecords = await DebtWorkRecordModel.find({
                customerId: new mongoose.Types.ObjectId(customerId),
            }).lean().exec();

            const records = allRecords.map(doc => this.mapToDomain(doc)).filter((r): r is DebtWorkRecord => r !== null);

            // Базовая статистика
            const totalDebtWorkRecords = records.length;
            const totalCalls = records.filter(r => r.actionType === DebtWorkActionType.CALL).length;
            const totalLegalActions = records.filter(r => 
                r.actionType === DebtWorkActionType.CLAIM ||
                r.actionType === DebtWorkActionType.COURT_CLAIM ||
                r.actionType === DebtWorkActionType.COURT_DECISION ||
                r.actionType === DebtWorkActionType.EXECUTION
            ).length;

            const lastContactRecord = records
                .filter(r => r.actionType === DebtWorkActionType.CALL || r.actionType === DebtWorkActionType.EMAIL || r.actionType === DebtWorkActionType.LETTER)
                .sort((a, b) => b.actionDate.getTime() - a.actionDate.getTime())[0];
            const lastContactDate = lastContactRecord?.actionDate;

            // Получаем все счета клиента для расчета эпизодов задолженности
            const customerInvoices = await InvoiceModel.find({
                customerId: new mongoose.Types.ObjectId(customerId),
            }).lean().exec();

            // Рассчитываем эпизоды задолженности
            // Эпизод = период от просрочки до оплаты или до текущего момента
            const debtEpisodes: Array<{ startDate: Date; endDate?: Date; days: number }> = [];
            const now = new Date();

            for (const invoice of customerInvoices) {
                const dueDate = new Date(invoice.dueDate);
                const actualPaymentDate = invoice.actualPaymentDate ? new Date(invoice.actualPaymentDate) : null;
                const status = invoice.status;

                // Если счет просрочен или был просрочен
                if (status !== 'PAID' && dueDate < now) {
                    const endDate = actualPaymentDate || now;
                    const days = Math.floor((endDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                    debtEpisodes.push({
                        startDate: dueDate,
                        endDate: actualPaymentDate || undefined,
                        days,
                    });
                } else if (status === 'PAID' && actualPaymentDate && dueDate < actualPaymentDate) {
                    // Счет был оплачен с просрочкой
                    const days = Math.floor((actualPaymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                    debtEpisodes.push({
                        startDate: dueDate,
                        endDate: actualPaymentDate,
                        days,
                    });
                }
            }

            const totalDebtEpisodes = debtEpisodes.length;
            const averageDebtResolutionDays = totalDebtEpisodes > 0
                ? Math.round(debtEpisodes.reduce((sum, ep) => sum + ep.days, 0) / totalDebtEpisodes)
                : 0;
            const longestDebtDays = debtEpisodes.length > 0
                ? Math.max(...debtEpisodes.map(ep => ep.days))
                : 0;

            // Расчет рисковости (0-100 баллов)
            const riskScore = this.calculateRiskScore({
                totalDebtEpisodes,
                averageDebtResolutionDays,
                longestDebtDays,
                totalLegalActions,
                totalCalls,
                records,
            });

            const riskLevel = this.getRiskLevel(riskScore);

            console.log('[MongoDebtWorkRecordRepository] getCustomerStats - Calculated:', {
                customerId,
                riskScore,
                riskLevel,
                totalDebtEpisodes,
            });

            return new CustomerDebtWorkStats({
                totalDebtWorkRecords,
                totalCalls,
                totalLegalActions,
                lastContactDate,
                totalDebtEpisodes,
                averageDebtResolutionDays,
                longestDebtDays,
                riskScore,
                riskLevel,
            });
        } catch (error: any) {
            console.error('[MongoDebtWorkRecordRepository] Error calculating customer stats:', error);
            throw new AppError('Ошибка при расчете статистики клиента', 500);
        }
    }

    private calculateRiskScore(params: {
        totalDebtEpisodes: number;
        averageDebtResolutionDays: number;
        longestDebtDays: number;
        totalLegalActions: number;
        totalCalls: number;
        records: DebtWorkRecord[];
    }): number {
        const {
            totalDebtEpisodes,
            averageDebtResolutionDays,
            longestDebtDays,
            totalLegalActions,
            totalCalls,
            records,
        } = params;

        let score = 0;

        // 1. Количество эпизодов задолженности (0-25 баллов)
        if (totalDebtEpisodes === 0) {
            score += 0;
        } else if (totalDebtEpisodes === 1) {
            score += 5;
        } else if (totalDebtEpisodes <= 3) {
            score += 10;
        } else if (totalDebtEpisodes <= 5) {
            score += 15;
        } else {
            score += 25;
        }

        // 2. Среднее время погашения (0-20 баллов)
        if (averageDebtResolutionDays === 0) {
            score += 0;
        } else if (averageDebtResolutionDays <= 15) {
            score += 5;
        } else if (averageDebtResolutionDays <= 30) {
            score += 10;
        } else if (averageDebtResolutionDays <= 60) {
            score += 15;
        } else {
            score += 20;
        }

        // 3. Максимальная длительность задолженности (0-20 баллов)
        if (longestDebtDays === 0) {
            score += 0;
        } else if (longestDebtDays <= 30) {
            score += 5;
        } else if (longestDebtDays <= 60) {
            score += 10;
        } else if (longestDebtDays <= 90) {
            score += 15;
        } else {
            score += 20;
        }

        // 4. Юридические действия (0-20 баллов)
        if (totalLegalActions === 0) {
            score += 0;
        } else if (totalLegalActions === 1) {
            score += 10;
        } else if (totalLegalActions <= 3) {
            score += 15;
        } else {
            score += 20;
        }

        // 5. Реакция на контакты (0-15 баллов)
        const successfulContacts = records.filter(r =>
            r.result === DebtWorkResult.CONTACTED ||
            r.result === DebtWorkResult.PROMISED_PAY ||
            r.result === DebtWorkResult.PARTIAL_PAY ||
            r.result === DebtWorkResult.FULL_PAY
        ).length;
        const contactSuccessRate = totalCalls > 0 ? successfulContacts / totalCalls : 1;
        
        if (contactSuccessRate >= 0.8) {
            score += 0;
        } else if (contactSuccessRate >= 0.5) {
            score += 5;
        } else if (contactSuccessRate >= 0.3) {
            score += 10;
        } else {
            score += 15;
        }

        // Ограничиваем максимальный балл 100
        return Math.min(score, 100);
    }

    private getRiskLevel(riskScore: number): RiskLevel {
        if (riskScore <= 30) return RiskLevel.LOW;
        if (riskScore <= 60) return RiskLevel.MEDIUM;
        if (riskScore <= 80) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    async update(id: string, data: Partial<CreateDebtWorkRecordData>): Promise<DebtWorkRecord | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        const updateFields: any = {};
        if (data.actionType !== undefined) updateFields.actionType = data.actionType;
        if (data.actionDate !== undefined) updateFields.actionDate = data.actionDate;
        if (data.result !== undefined) updateFields.result = data.result;
        if (data.description !== undefined) updateFields.description = data.description;
        if (data.nextActionDate !== undefined) updateFields.nextActionDate = data.nextActionDate;
        if (data.amount !== undefined) updateFields.amount = data.amount;

        try {
            const updatedDoc = await DebtWorkRecordModel.findByIdAndUpdate(
                id,
                { $set: updateFields },
                { new: true, runValidators: true },
            ).lean().exec();

            return this.mapToDomain(updatedDoc);
        } catch (error: any) {
            console.error(`[MongoDebtWorkRecordRepository] Error updating record ${id}:`, error);
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors)
                    .map((e: any) => e.message)
                    .join(', ');
                throw new AppError(`Ошибка валидации: ${messages}`, 400);
            }
            throw new AppError('Ошибка базы данных при обновлении записи', 500);
        }
    }

    async delete(id: string): Promise<boolean> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return false;
        }
        try {
            const result = await DebtWorkRecordModel.deleteOne({ _id: id }).exec();
            return result.deletedCount > 0;
        } catch (error: any) {
            console.error(`[MongoDebtWorkRecordRepository] Error deleting record ${id}:`, error);
            throw new AppError('Ошибка базы данных при удалении записи', 500);
        }
    }
}

