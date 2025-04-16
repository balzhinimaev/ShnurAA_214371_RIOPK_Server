"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const tsyringe_1 = require("tsyringe");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const list_users_use_case_1 = require("../../../../application/use-cases/users/list-users.use-case");
const get_user_by_id_use_case_1 = require("../../../../application/use-cases/users/get-user-by-id.use-case");
const update_user_use_case_1 = require("../../../../application/use-cases/users/update-user.use-case");
const delete_user_use_case_1 = require("../../../../application/use-cases/users/delete-user.use-case");
const update_user_dto_1 = require("../../../../application/dtos/users/update-user.dto");
const AppError_1 = require("../../../../application/errors/AppError");
class UserController {
    // GET /users
    async getAllUsers(req, res, next) {
        try {
            // Парсинг параметров пагинации/сортировки из query string
            const options = {
                limit: req.query.limit
                    ? parseInt(req.query.limit, 10)
                    : undefined,
                offset: req.query.offset
                    ? parseInt(req.query.offset, 10)
                    : undefined,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
            };
            const listUsersUseCase = tsyringe_1.container.resolve(list_users_use_case_1.ListUsersUseCase);
            const result = await listUsersUseCase.execute(options);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    // GET /users/:id
    async getUserById(req, res, next) {
        try {
            const userId = req.params.id;
            const getUserByIdUseCase = tsyringe_1.container.resolve(get_user_by_id_use_case_1.GetUserByIdUseCase);
            const user = await getUserByIdUseCase.execute(userId);
            if (!user) {
                throw new AppError_1.AppError('Пользователь не найден', 404);
            }
            res.status(200).json(user);
        }
        catch (error) {
            next(error);
        }
    }
    // PUT /users/:id
    async updateUser(req, res, next) {
        try {
            const userId = req.params.id;
            const updateUserDto = (0, class_transformer_1.plainToInstance)(update_user_dto_1.UpdateUserDto, req.body);
            // Валидация DTO
            const errors = await (0, class_validator_1.validate)(updateUserDto);
            if (errors.length > 0) {
                // Передаем ошибки валидации в обработчик
                // TODO: Создать кастомную ошибку валидации или улучшить обработку
                throw new AppError_1.AppError(`Ошибка валидации: ${errors}`, 400);
            }
            const updateUserUseCase = tsyringe_1.container.resolve(update_user_use_case_1.UpdateUserUseCase);
            const updatedUser = await updateUserUseCase.execute(userId, updateUserDto);
            if (!updatedUser) {
                throw new AppError_1.AppError('Пользователь не найден для обновления', 404);
            }
            res.status(200).json(updatedUser);
        }
        catch (error) {
            next(error);
        }
    }
    // DELETE /users/:id
    async deleteUser(req, res, next) {
        try {
            const userId = req.params.id;
            // Дополнительная защита: не позволяем удалять самого себя
            if (req.user?.id === userId) {
                throw new AppError_1.AppError('Нельзя удалить свою учетную запись.', 400);
            }
            const deleteUserUseCase = tsyringe_1.container.resolve(delete_user_use_case_1.DeleteUserUseCase);
            const deleted = await deleteUserUseCase.execute(userId);
            if (!deleted) {
                throw new AppError_1.AppError('Пользователь не найден для удаления', 404);
            }
            // Успешное удаление - возвращаем 204 No Content
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map