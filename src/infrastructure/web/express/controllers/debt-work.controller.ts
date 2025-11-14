// src/infrastructure/web/express/controllers/debt-work.controller.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDebtWorkRecordUseCase } from '../../../../application/use-cases/customers/create-debt-work-record.use-case';
import { GetDebtWorkHistoryUseCase } from '../../../../application/use-cases/customers/get-debt-work-history.use-case';
import { CreateDebtWorkRecordDto } from '../../../../application/dtos/customers/debt-work-record.dto';
import { FindDebtWorkRecordsOptions } from '../../../../domain/repositories/IDebtWorkRecordRepository';
import { AppError } from '../../../../application/errors/AppError';

export class DebtWorkController {
    // GET /customers/:customerId/debt-work
    async getDebtWorkHistory(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const customerId = req.params.customerId;
            const userId = req.user?.id;

            if (!userId) {
                throw new AppError('Пользователь не аутентифицирован', 401);
            }

            const options: FindDebtWorkRecordsOptions = {
                customerId,
                invoiceId: req.query.invoiceId as string | undefined,
                limit: req.query.limit
                    ? parseInt(req.query.limit as string, 10)
                    : undefined,
                offset: req.query.offset
                    ? parseInt(req.query.offset as string, 10)
                    : undefined,
                sortBy: (req.query.sortBy as 'actionDate' | 'createdAt') || 'actionDate',
                sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
            };

            console.log('[DebtWorkController] GET /customers/:customerId/debt-work - Request:', {
                customerId,
                options,
                userId,
            });

            const getDebtWorkHistoryUseCase = container.resolve(GetDebtWorkHistoryUseCase);
            const result = await getDebtWorkHistoryUseCase.execute(customerId, options);

            console.log('[DebtWorkController] GET /customers/:customerId/debt-work - Response:', {
                customerId,
                totalRecords: result.total,
                riskScore: result.stats.riskScore,
                riskLevel: result.stats.riskLevel,
            });

            res.status(200).json(result);
        } catch (error) {
            console.error('[DebtWorkController] GET /customers/:customerId/debt-work - Error:', {
                customerId: req.params.customerId,
                error,
            });
            next(error);
        }
    }

    // POST /customers/:customerId/debt-work
    async createDebtWorkRecord(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const customerId = req.params.customerId;
            const userId = req.user?.id;

            if (!userId) {
                throw new AppError('Пользователь не аутентифицирован', 401);
            }

            const createDto = plainToInstance(CreateDebtWorkRecordDto, req.body);
            const errors = await validate(createDto);
            
            if (errors.length > 0) {
                const errorMessages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
                throw new AppError(`Ошибка валидации: ${errorMessages}`, 400);
            }

            // Преобразуем строковые даты в Date объекты для передачи в use case
            const createData = {
                ...createDto,
                actionDate: new Date(createDto.actionDate),
                nextActionDate: createDto.nextActionDate ? new Date(createDto.nextActionDate) : undefined,
            };

            console.log('[DebtWorkController] POST /customers/:customerId/debt-work - Request:', {
                customerId,
                userId,
                data: createData,
            });

            const createDebtWorkRecordUseCase = container.resolve(CreateDebtWorkRecordUseCase);
            const result = await createDebtWorkRecordUseCase.execute(
                customerId,
                userId,
                createData as any,
            );

            console.log('[DebtWorkController] POST /customers/:customerId/debt-work - Created:', {
                customerId,
                recordId: result.id,
                actionType: result.actionType,
            });

            res.status(201).json(result);
        } catch (error) {
            console.error('[DebtWorkController] POST /customers/:customerId/debt-work - Error:', {
                customerId: req.params.customerId,
                error,
            });
            next(error);
        }
    }
}

