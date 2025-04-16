// src/infrastructure/web/express/controllers/customer.controller.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListCustomersUseCase } from '../../../../application/use-cases/customers/list-customers.use-case';
// import { GetCustomerByIdUseCase } from '../../../../application/use-cases/customers/get-customer-by-id.use-case'; // <-- Создать UseCase
import { UpdateCustomerUseCase } from '../../../../application/use-cases/customers/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../../../application/use-cases/customers/delete-customer.use-case';
import { UpdateCustomerDto } from '../../../../application/dtos/customers/update-customer.dto';
import { AppError } from '../../../../application/errors/AppError';
import { FindAllCustomersOptions } from '../../../../domain/repositories/ICustomerRepository';

export class CustomerController {
    // GET /customers
    async getAllCustomers(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.user?.id; // Получаем ID текущего пользователя
            if (!userId)
                throw new AppError('Пользователь не аутентифицирован', 401);

            const options: FindAllCustomersOptions = {
                userId: userId, // Передаем ID пользователя
                limit: req.query.limit
                    ? parseInt(req.query.limit as string, 10)
                    : undefined,
                offset: req.query.offset
                    ? parseInt(req.query.offset as string, 10)
                    : undefined,
                sortBy: req.query.sortBy as string | undefined,
                sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
                // TODO: Добавить парсинг фильтров из req.query
            };

            const listCustomersUseCase =
                container.resolve(ListCustomersUseCase);
            const result = await listCustomersUseCase.execute(options);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // GET /customers/:id
    async getCustomerById(
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            // const customerId = req.params.id;
            // TODO: Реализовать GetCustomerByIdUseCase
            // const getCustomerByIdUseCase = container.resolve(GetCustomerByIdUseCase);
            // const customer = await getCustomerByIdUseCase.execute(customerId, req.user?.id); // Передаем и userId для проверки прав? Зависит от логики
            const customer = null; // ЗАГЛУШКА
            if (!customer) {
                throw new AppError('Клиент не найден', 404);
            }
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
            const userId = req.user?.id;
            if (!userId)
                throw new AppError('Пользователь не аутентифицирован', 401);

            const updateDto = plainToInstance(UpdateCustomerDto, req.body);
            const errors = await validate(updateDto);
            if (errors.length > 0) {
                throw new AppError(`Ошибка валидации: ${errors}`, 400);
            }

            const updateCustomerUseCase = container.resolve(
                UpdateCustomerUseCase,
            );
            const updatedCustomer = await updateCustomerUseCase.execute(
                customerId,
                userId,
                updateDto,
            );

            if (!updatedCustomer) {
                throw new AppError(
                    'Клиент не найден или у вас нет прав на его изменение',
                    404,
                );
            }
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
            const userId = req.user?.id;
            if (!userId)
                throw new AppError('Пользователь не аутентифицирован', 401);

            const deleteCustomerUseCase = container.resolve(
                DeleteCustomerUseCase,
            );
            const deleted = await deleteCustomerUseCase.execute(
                customerId,
                userId,
            );

            if (!deleted) {
                throw new AppError(
                    'Клиент не найден или у вас нет прав на его удаление',
                    404,
                );
            }
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
