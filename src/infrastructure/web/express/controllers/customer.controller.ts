// src/infrastructure/web/express/controllers/customer.controller.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListCustomersUseCase } from '../../../../application/use-cases/customers/list-customers.use-case';
import { GetCustomerByIdUseCase } from '../../../../application/use-cases/customers/get-customer-by-id.use-case'; // Импортируем новый UseCase
import { UpdateCustomerUseCase } from '../../../../application/use-cases/customers/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../../../application/use-cases/customers/delete-customer.use-case';
import { UpdateCustomerDto } from '../../../../application/dtos/customers/update-customer.dto';
import { AppError } from '../../../../application/errors/AppError';
import { FindAllCustomersOptions } from '../../../../domain/repositories/ICustomerRepository'; // Обновленный тип
import { UserRole } from '../../../../domain/entities/user.entity'; // Предполагаемый тип роли

export class CustomerController {
    // GET /customers
    async getAllCustomers(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            // --- ИЗМЕНЕНО: userId больше не нужен для фильтрации ---
            // const userId = req.user?.id;
            // if (!userId) throw new AppError('Пользователь не аутентифицирован', 401);

            const options: FindAllCustomersOptions = {
                // userId: userId, // УБРАЛИ
                limit: req.query.limit
                    ? parseInt(req.query.limit as string, 10)
                    : undefined,
                offset: req.query.offset
                    ? parseInt(req.query.offset as string, 10)
                    : undefined,
                sortBy: req.query.sortBy as string | undefined,
                sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
                // Фильтры поиска
                name: req.query.name as string | undefined,
                unp: req.query.unp as string | undefined,
                contactInfo: req.query.contactInfo as string | undefined,
            };

            // Логирование входящих параметров запроса
            console.log('[CustomerController] GET /customers - Request params:', {
                limit: options.limit,
                offset: options.offset,
                sortBy: options.sortBy,
                sortOrder: options.sortOrder,
                filters: {
                    name: options.name || null,
                    unp: options.unp || null,
                    contactInfo: options.contactInfo || null,
                },
                userId: req.user?.id,
            });

            const listCustomersUseCase =
                container.resolve(ListCustomersUseCase);
            // --- ИЗМЕНЕНО: Передаем опции без userId ---
            const result = await listCustomersUseCase.execute(options);
            
            // Логирование результата
            console.log('[CustomerController] GET /customers - Response:', {
                total: result.total,
                returned: result.customers.length,
                offset: result.offset,
                limit: result.limit,
            });

            res.status(200).json(result);
        } catch (error) {
            console.error('[CustomerController] GET /customers - Error:', error);
            next(error);
        }
    }

    // GET /customers/:id
    async getCustomerById(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const customerId = req.params.id;
            console.log('[CustomerController] GET /customers/:id - Request:', {
                customerId,
                userId: req.user?.id,
            });

            // --- ИЗМЕНЕНО: Используем GetCustomerByIdUseCase ---
            const getCustomerByIdUseCase = container.resolve(
                GetCustomerByIdUseCase,
            );
            // --- ИЗМЕНЕНО: Передаем только customerId ---
            const customer = await getCustomerByIdUseCase.execute(customerId);
            // if (!customer) { // Проверка теперь внутри UseCase
            //     throw new AppError('Клиент не найден', 404);
            // }
            
            console.log('[CustomerController] GET /customers/:id - Customer found:', {
                customerId,
                name: customer?.name,
            });

            res.status(200).json(customer);
        } catch (error) {
            console.error('[CustomerController] GET /customers/:id - Error:', {
                customerId: req.params.id,
                error,
            });
            next(error);
        }
    }

    // PUT /customers/:id
    async updateCustomer(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const customerId = req.params.id;
            // --- ИЗМЕНЕНО: Получаем роли для передачи в UseCase ---
            const actingUserRoles = req.user?.roles as UserRole[] | undefined;
            if (!actingUserRoles)
                throw new AppError('Роли пользователя не определены', 401); // Или 500, если роли всегда должны быть

            const updateDto = plainToInstance(UpdateCustomerDto, req.body);
            const errors = await validate(updateDto);
            if (errors.length > 0) {
                // TODO: Улучшить вывод ошибок валидации
                throw new AppError(`Ошибка валидации: ${errors[0]}`, 400);
            }

            console.log('[CustomerController] PUT /customers/:id - Request:', {
                customerId,
                updateData: updateDto,
                userId: req.user?.id,
                roles: actingUserRoles,
            });

            const updateCustomerUseCase = container.resolve(
                UpdateCustomerUseCase,
            );
            // --- ИЗМЕНЕНО: Передаем customerId, роли и DTO ---
            const updatedCustomer = await updateCustomerUseCase.execute(
                customerId,
                actingUserRoles,
                updateDto,
            );

            // if (!updatedCustomer) { // Проверка теперь внутри UseCase
            //     throw new AppError('Клиент не найден или у вас нет прав на его изменение', 404);
            // }
            
            console.log('[CustomerController] PUT /customers/:id - Customer updated:', {
                customerId,
                name: updatedCustomer?.name,
            });

            res.status(200).json(updatedCustomer);
        } catch (error) {
            console.error('[CustomerController] PUT /customers/:id - Error:', {
                customerId: req.params.id,
                error,
            });
            next(error);
        }
    }

    // DELETE /customers/:id
    async deleteCustomer(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const customerId = req.params.id;
            // --- ИЗМЕНЕНО: Получаем роли для передачи в UseCase ---
            const actingUserRoles = req.user?.roles as UserRole[] | undefined;
            if (!actingUserRoles)
                throw new AppError('Роли пользователя не определены', 401);

            console.log('[CustomerController] DELETE /customers/:id - Request:', {
                customerId,
                userId: req.user?.id,
                roles: actingUserRoles,
            });

            const deleteCustomerUseCase = container.resolve(
                DeleteCustomerUseCase,
            );
            // --- ИЗМЕНЕНО: Передаем customerId и роли ---
            await deleteCustomerUseCase.execute(customerId, actingUserRoles);

            // if (!deleted) { // Проверка теперь внутри UseCase
            //     throw new AppError('Клиент не найден или у вас нет прав на его удаление', 404);
            // }
            
            console.log('[CustomerController] DELETE /customers/:id - Customer deleted:', {
                customerId,
            });

            res.status(204).send();
        } catch (error) {
            console.error('[CustomerController] DELETE /customers/:id - Error:', {
                customerId: req.params.id,
                error,
            });
            next(error);
        }
    }
}
