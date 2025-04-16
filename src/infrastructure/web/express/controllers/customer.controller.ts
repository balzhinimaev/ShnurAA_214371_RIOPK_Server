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
            };

            const listCustomersUseCase =
                container.resolve(ListCustomersUseCase);
            // --- ИЗМЕНЕНО: Передаем опции без userId ---
            const result = await listCustomersUseCase.execute(options);
            res.status(200).json(result);
        } catch (error) {
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
            // --- ИЗМЕНЕНО: Используем GetCustomerByIdUseCase ---
            const getCustomerByIdUseCase = container.resolve(
                GetCustomerByIdUseCase,
            );
            // --- ИЗМЕНЕНО: Передаем только customerId ---
            const customer = await getCustomerByIdUseCase.execute(customerId);
            // if (!customer) { // Проверка теперь внутри UseCase
            //     throw new AppError('Клиент не найден', 404);
            // }
            res.status(200).json(customer);
        } catch (error) {
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
            res.status(200).json(updatedCustomer);
        } catch (error) {
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

            const deleteCustomerUseCase = container.resolve(
                DeleteCustomerUseCase,
            );
            // --- ИЗМЕНЕНО: Передаем customerId и роли ---
            await deleteCustomerUseCase.execute(customerId, actingUserRoles);

            // if (!deleted) { // Проверка теперь внутри UseCase
            //     throw new AppError('Клиент не найден или у вас нет прав на его удаление', 404);
            // }
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
