"use strict";
// src/infrastructure/database/mongoose/repositories/MongoUserRepository.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoUserRepository = void 0;
const tsyringe_1 = require("tsyringe");
const mongoose_1 = __importDefault(require("mongoose")); // Import FilterQuery
const user_schema_1 = require("../../infrastructure/database/mongoose/schemas/user.schema");
const AppError_1 = require("../../application/errors/AppError");
const user_entity_1 = require("../entities/user.entity");
let MongoUserRepository = class MongoUserRepository {
    // Improved mapping function
    mapToDomain(userDoc) {
        if (!userDoc) {
            return null;
        }
        // Use lean() objects directly or ensure toObject() is called if not using lean()
        // Make sure the document/object actually has these properties before accessing
        const userObject = typeof userDoc.toObject === 'function'
            ? userDoc.toObject()
            : userDoc;
        // Basic check for essential properties
        if (!userObject?._id ||
            !userObject.name ||
            !userObject.email ||
            !userObject.passwordHash ||
            !userObject.roles ||
            !userObject.createdAt ||
            !userObject.updatedAt) {
            console.error('Incomplete user data from database:', userObject);
            // Throw a standard error; let the Use Case wrap it in AppError if needed
            throw new Error('Incomplete user data received from the database.');
        }
        return new user_entity_1.User({
            // Use _id from Mongoose doc/object
            id: userObject._id.toString(),
            name: userObject.name,
            email: userObject.email,
            passwordHash: userObject.passwordHash,
            roles: userObject.roles, // Assume roles are correctly stored
            createdAt: userObject.createdAt,
            updatedAt: userObject.updatedAt,
        });
    }
    async create(data) {
        try {
            const newUserDoc = await user_schema_1.UserModel.create({
                name: data.name,
                email: data.email,
                passwordHash: data.passwordHash,
                roles: data.roles,
            });
            const mappedUser = this.mapToDomain(newUserDoc);
            if (!mappedUser) {
                // This should ideally not happen if create succeeded
                throw new Error('Failed to map user after creation.');
            }
            return mappedUser;
        }
        catch (error) {
            console.error('Error creating user:', error);
            if (error.code === 11000 && error.keyPattern?.email) {
                // Let Use Case handle specific operational errors
                throw new AppError_1.AppError('User with this email already exists', 409, true);
            }
            throw new Error('Database error during user creation.'); // General DB error
        }
    }
    async findByEmail(email) {
        try {
            // Use lean for performance on read operations
            const userDoc = await user_schema_1.UserModel.findOne({
                email: email.toLowerCase(),
            })
                .lean() // Get plain JS object
                .exec();
            return this.mapToDomain(userDoc); // Cast needed because lean changes return type
        }
        catch (error) {
            console.error('Error finding user by email:', error);
            throw new Error('Database error while finding user by email.');
        }
    }
    async findById(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return null; // Invalid ID format
        }
        try {
            // Use lean for performance
            const userDoc = await user_schema_1.UserModel.findById(id)
                .lean() // Get plain JS object
                .exec();
            return this.mapToDomain(userDoc); // Cast needed
        }
        catch (error) {
            console.error('Error finding user by id:', error);
            throw new Error('Database error while finding user by ID.');
        }
    }
    // --- IMPLEMENTED findAll ---
    async findAll(options) {
        const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc', filter, } = options;
        const filterQuery = {};
        if (filter?.name) {
            // Case-insensitive search for name containing the filter string
            filterQuery.name = { $regex: filter.name, $options: 'i' };
        }
        if (filter?.role) {
            filterQuery.roles = filter.role; // Assumes roles is an array
        }
        const sortQuery = {};
        const allowedSortFields = ['name', 'email', 'createdAt', 'updatedAt']; // Define valid sort fields
        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';
        sortQuery[sortField] = sortOrder === 'asc' ? 1 : -1;
        try {
            const [userDocs, total] = await Promise.all([
                user_schema_1.UserModel.find(filterQuery)
                    .sort(sortQuery)
                    .skip(offset)
                    .limit(limit)
                    .lean() // Use lean
                    .exec(),
                user_schema_1.UserModel.countDocuments(filterQuery),
            ]);
            // Map lean documents
            const users = userDocs
                .map((doc) => this.mapToDomain(doc)) // Cast needed
                .filter((user) => user !== null); // Filter out potential nulls
            return { users, total };
        }
        catch (dbError) {
            console.error(`Error in findAll users:`, dbError);
            throw new Error('Database error while finding all users.');
        }
    }
    // --- IMPLEMENTED update ---
    async update(id, data) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return null; // Invalid ID format
        }
        const updateFields = {};
        if (data.name !== undefined) {
            updateFields.name = data.name;
        }
        if (data.roles !== undefined) {
            updateFields.roles = data.roles;
        }
        // Add other updatable fields here (e.g., passwordHash if allowed)
        // if (data.passwordHash !== undefined) {
        //     updateFields.passwordHash = data.passwordHash;
        // }
        if (Object.keys(updateFields).length === 0) {
            console.warn(`Update called for user ${id} with no fields to update.`);
            return this.findById(id); // Return current user data if nothing to update
        }
        try {
            const updatedUserDoc = await user_schema_1.UserModel.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true })
                .lean() // Use lean
                .exec();
            return this.mapToDomain(updatedUserDoc); // Cast needed
        }
        catch (dbError) {
            console.error(`Error updating user ${id}:`, dbError);
            if (dbError.name === 'ValidationError') {
                const messages = Object.values(dbError.errors)
                    .map((e) => e.message)
                    .join(', ');
                throw new AppError_1.AppError(`Validation error during user update: ${messages}`, 400);
            }
            throw new Error('Database error during user update.');
        }
    }
    // --- IMPLEMENTED delete ---
    async delete(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return false; // Invalid ID format
        }
        try {
            const result = await user_schema_1.UserModel.deleteOne({ _id: id }).exec();
            // deletedCount > 0 indicates successful deletion
            return result.deletedCount > 0;
        }
        catch (dbError) {
            console.error(`Error deleting user ${id}:`, dbError);
            throw new Error('Database error during user deletion.');
        }
    }
};
exports.MongoUserRepository = MongoUserRepository;
exports.MongoUserRepository = MongoUserRepository = __decorate([
    (0, tsyringe_1.injectable)()
], MongoUserRepository);
//# sourceMappingURL=MongoUserRepository.js.map