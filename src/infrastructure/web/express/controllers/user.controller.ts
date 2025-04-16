// src/infrastructure/web/express/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListUsersUseCase } from '../../../../application/use-cases/users/list-users.use-case';
import { GetUserByIdUseCase } from '../../../../application/use-cases/users/get-user-by-id.use-case';
import { UpdateUserUseCase } from '../../../../application/use-cases/users/update-user.use-case';
import { DeleteUserUseCase } from '../../../../application/use-cases/users/delete-user.use-case';
import { UpdateUserDto } from '../../../../application/dtos/users/update-user.dto';
import { AppError } from '../../../../application/errors/AppError';
import { FindAllUsersOptions } from '../../../../domain/repositories/IUserRepository';

export class UserController {
    // GET /users
    async getAllUsers(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            // Парсинг параметров пагинации/сортировки из query string
            const options: FindAllUsersOptions = {
                limit: req.query.limit
                    ? parseInt(req.query.limit as string, 10)
                    : undefined,
                offset: req.query.offset
                    ? parseInt(req.query.offset as string, 10)
                    : undefined,
                sortBy: req.query.sortBy as string | undefined,
                sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
            };

            const listUsersUseCase = container.resolve(ListUsersUseCase);
            const result = await listUsersUseCase.execute(options);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // GET /users/:id
    async getUserById(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.params.id;
            const getUserByIdUseCase = container.resolve(GetUserByIdUseCase);
            const user = await getUserByIdUseCase.execute(userId);
            if (!user) {
                throw new AppError('Пользователь не найден', 404);
            }
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    // PUT /users/:id
    async updateUser(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.params.id;
            const updateUserDto = plainToInstance(UpdateUserDto, req.body);

            // Валидация DTO
            const errors = await validate(updateUserDto);
            if (errors.length > 0) {
                // Передаем ошибки валидации в обработчик
                // TODO: Создать кастомную ошибку валидации или улучшить обработку
                throw new AppError(`Ошибка валидации: ${errors}`, 400);
            }

            const updateUserUseCase = container.resolve(UpdateUserUseCase);
            const updatedUser = await updateUserUseCase.execute(
                userId,
                updateUserDto,
            );

            if (!updatedUser) {
                throw new AppError(
                    'Пользователь не найден для обновления',
                    404,
                );
            }
            res.status(200).json(updatedUser);
        } catch (error) {
            next(error);
        }
    }

    // DELETE /users/:id
    async deleteUser(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.params.id;

            // Дополнительная защита: не позволяем удалять самого себя
            if (req.user?.id === userId) {
                throw new AppError('Нельзя удалить свою учетную запись.', 400);
            }

            const deleteUserUseCase = container.resolve(DeleteUserUseCase);
            const deleted = await deleteUserUseCase.execute(userId);

            if (!deleted) {
                throw new AppError('Пользователь не найден для удаления', 404);
            }
            // Успешное удаление - возвращаем 204 No Content
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // POST /users (Создание админом) - Опционально
    // async createUserByAdmin(req: Request, res: Response, next: NextFunction): Promise<void> { ... }
}
