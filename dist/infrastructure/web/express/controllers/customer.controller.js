"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const tsyringe_1 = require("tsyringe");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const list_customers_use_case_1 = require("../../../../application/use-cases/customers/list-customers.use-case");
const get_customer_by_id_use_case_1 = require("../../../../application/use-cases/customers/get-customer-by-id.use-case"); // Импортируем новый UseCase
const update_customer_use_case_1 = require("../../../../application/use-cases/customers/update-customer.use-case");
const delete_customer_use_case_1 = require("../../../../application/use-cases/customers/delete-customer.use-case");
const update_customer_dto_1 = require("../../../../application/dtos/customers/update-customer.dto");
const AppError_1 = require("../../../../application/errors/AppError");
class CustomerController {
    // GET /customers
    async getAllCustomers(req, res, next) {
        try {
            // --- ИЗМЕНЕНО: userId больше не нужен для фильтрации ---
            // const userId = req.user?.id;
            // if (!userId) throw new AppError('Пользователь не аутентифицирован', 401);
            const options = {
                // userId: userId, // УБРАЛИ
                limit: req.query.limit
                    ? parseInt(req.query.limit, 10)
                    : undefined,
                offset: req.query.offset
                    ? parseInt(req.query.offset, 10)
                    : undefined,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
                // Фильтры поиска
                name: req.query.name,
                unp: req.query.unp,
                contactInfo: req.query.contactInfo,
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
            const listCustomersUseCase = tsyringe_1.container.resolve(list_customers_use_case_1.ListCustomersUseCase);
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
        }
        catch (error) {
            console.error('[CustomerController] GET /customers - Error:', error);
            next(error);
        }
    }
    // GET /customers/:id
    async getCustomerById(req, res, next) {
        try {
            const customerId = req.params.id;
            console.log('[CustomerController] GET /customers/:id - Request:', {
                customerId,
                userId: req.user?.id,
            });
            // --- ИЗМЕНЕНО: Используем GetCustomerByIdUseCase ---
            const getCustomerByIdUseCase = tsyringe_1.container.resolve(get_customer_by_id_use_case_1.GetCustomerByIdUseCase);
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
        }
        catch (error) {
            console.error('[CustomerController] GET /customers/:id - Error:', {
                customerId: req.params.id,
                error,
            });
            next(error);
        }
    }
    // PUT /customers/:id
    async updateCustomer(req, res, next) {
        try {
            const customerId = req.params.id;
            // --- ИЗМЕНЕНО: Получаем роли для передачи в UseCase ---
            const actingUserRoles = req.user?.roles;
            if (!actingUserRoles)
                throw new AppError_1.AppError('Роли пользователя не определены', 401); // Или 500, если роли всегда должны быть
            const updateDto = (0, class_transformer_1.plainToInstance)(update_customer_dto_1.UpdateCustomerDto, req.body);
            const errors = await (0, class_validator_1.validate)(updateDto);
            if (errors.length > 0) {
                // TODO: Улучшить вывод ошибок валидации
                throw new AppError_1.AppError(`Ошибка валидации: ${errors[0]}`, 400);
            }
            console.log('[CustomerController] PUT /customers/:id - Request:', {
                customerId,
                updateData: updateDto,
                userId: req.user?.id,
                roles: actingUserRoles,
            });
            const updateCustomerUseCase = tsyringe_1.container.resolve(update_customer_use_case_1.UpdateCustomerUseCase);
            // --- ИЗМЕНЕНО: Передаем customerId, роли и DTO ---
            const updatedCustomer = await updateCustomerUseCase.execute(customerId, actingUserRoles, updateDto);
            // if (!updatedCustomer) { // Проверка теперь внутри UseCase
            //     throw new AppError('Клиент не найден или у вас нет прав на его изменение', 404);
            // }
            console.log('[CustomerController] PUT /customers/:id - Customer updated:', {
                customerId,
                name: updatedCustomer?.name,
            });
            res.status(200).json(updatedCustomer);
        }
        catch (error) {
            console.error('[CustomerController] PUT /customers/:id - Error:', {
                customerId: req.params.id,
                error,
            });
            next(error);
        }
    }
    // DELETE /customers/:id
    async deleteCustomer(req, res, next) {
        try {
            const customerId = req.params.id;
            // --- ИЗМЕНЕНО: Получаем роли для передачи в UseCase ---
            const actingUserRoles = req.user?.roles;
            if (!actingUserRoles)
                throw new AppError_1.AppError('Роли пользователя не определены', 401);
            console.log('[CustomerController] DELETE /customers/:id - Request:', {
                customerId,
                userId: req.user?.id,
                roles: actingUserRoles,
            });
            const deleteCustomerUseCase = tsyringe_1.container.resolve(delete_customer_use_case_1.DeleteCustomerUseCase);
            // --- ИЗМЕНЕНО: Передаем customerId и роли ---
            await deleteCustomerUseCase.execute(customerId, actingUserRoles);
            // if (!deleted) { // Проверка теперь внутри UseCase
            //     throw new AppError('Клиент не найден или у вас нет прав на его удаление', 404);
            // }
            console.log('[CustomerController] DELETE /customers/:id - Customer deleted:', {
                customerId,
            });
            res.status(204).send();
        }
        catch (error) {
            console.error('[CustomerController] DELETE /customers/:id - Error:', {
                customerId: req.params.id,
                error,
            });
            next(error);
        }
    }
}
exports.CustomerController = CustomerController;
//# sourceMappingURL=customer.controller.js.map