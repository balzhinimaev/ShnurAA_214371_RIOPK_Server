// src/infrastructure/database/mongoose/repositories/MongoUserRepository.ts

import { injectable } from 'tsyringe';
import mongoose, { FilterQuery } from 'mongoose'; // Import FilterQuery
import { CreateUserProps, FindAllUsersOptions, IUserRepository, UpdateUserData } from './IUserRepository';
import { IUserDocument, UserModel } from '../../infrastructure/database/mongoose/schemas/user.schema';
import { AppError } from '../../application/errors/AppError';
import { User, UserRole } from '../entities/user.entity';


@injectable()
export class MongoUserRepository implements IUserRepository {
    // Improved mapping function
    private mapToDomain(userDoc: IUserDocument | null): User | null {
        if (!userDoc) {
            return null;
        }
        // Use lean() objects directly or ensure toObject() is called if not using lean()
        // Make sure the document/object actually has these properties before accessing
        const userObject =
            typeof userDoc.toObject === 'function'
                ? userDoc.toObject()
                : userDoc;

        // Basic check for essential properties
        if (
            !userObject?._id ||
            !userObject.name ||
            !userObject.email ||
            !userObject.passwordHash ||
            !userObject.roles ||
            !userObject.createdAt ||
            !userObject.updatedAt
        ) {
            console.error('Incomplete user data from database:', userObject);
            // Throw a standard error; let the Use Case wrap it in AppError if needed
            throw new Error('Incomplete user data received from the database.');
        }

        return new User({
            // Use _id from Mongoose doc/object
            id: userObject._id.toString(),
            name: userObject.name,
            email: userObject.email,
            passwordHash: userObject.passwordHash,
            roles: userObject.roles as UserRole[], // Assume roles are correctly stored
            createdAt: userObject.createdAt,
            updatedAt: userObject.updatedAt,
        });
    }

    async create(data: CreateUserProps): Promise<User> {
        try {
            const newUserDoc = await UserModel.create({
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
        } catch (error: any) {
            console.error('Error creating user:', error);
            if (error.code === 11000 && error.keyPattern?.email) {
                // Let Use Case handle specific operational errors
                throw new AppError(
                    'User with this email already exists',
                    409,
                    true,
                );
            }
            throw new Error('Database error during user creation.'); // General DB error
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        try {
            // Use lean for performance on read operations
            const userDoc = await UserModel.findOne({
                email: email.toLowerCase(),
            })
                .lean() // Get plain JS object
                .exec();
            return this.mapToDomain(userDoc as IUserDocument | null); // Cast needed because lean changes return type
        } catch (error: any) {
            console.error('Error finding user by email:', error);
            throw new Error('Database error while finding user by email.');
        }
    }

    async findById(id: string): Promise<User | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null; // Invalid ID format
        }
        try {
            // Use lean for performance
            const userDoc = await UserModel.findById(id)
                .lean() // Get plain JS object
                .exec();
            return this.mapToDomain(userDoc as IUserDocument | null); // Cast needed
        } catch (error: any) {
            console.error('Error finding user by id:', error);
            throw new Error('Database error while finding user by ID.');
        }
    }

    // --- IMPLEMENTED findAll ---
    async findAll(
        options: FindAllUsersOptions,
    ): Promise<{ users: User[]; total: number }> {
        const {
            limit = 10,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            filter,
        } = options;

        const filterQuery: FilterQuery<IUserDocument> = {};
        if (filter?.name) {
            // Case-insensitive search for name containing the filter string
            filterQuery.name = { $regex: filter.name, $options: 'i' };
        }
        if (filter?.role) {
            filterQuery.roles = filter.role; // Assumes roles is an array
        }

        const sortQuery: { [key: string]: 1 | -1 } = {};
        const allowedSortFields = ['name', 'email', 'createdAt', 'updatedAt']; // Define valid sort fields
        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';
        sortQuery[sortField] = sortOrder === 'asc' ? 1 : -1;

        try {
            const [userDocs, total] = await Promise.all([
                UserModel.find(filterQuery)
                    .sort(sortQuery)
                    .skip(offset)
                    .limit(limit)
                    .lean() // Use lean
                    .exec(),
                UserModel.countDocuments(filterQuery),
            ]);

            // Map lean documents
            const users = userDocs
                .map((doc) => this.mapToDomain(doc as unknown as IUserDocument)) // Cast through unknown first
                .filter((user): user is User => user !== null); // Filter out potential nulls

            return { users, total };
        } catch (dbError: any) {
            console.error(`Error in findAll users:`, dbError);
            throw new Error('Database error while finding all users.');
        }
    }

    // --- IMPLEMENTED update ---
    async update(id: string, data: UpdateUserData): Promise<User | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null; // Invalid ID format
        }

        const updateFields: Partial<IUserDocument> = {};
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
            console.warn(
                `Update called for user ${id} with no fields to update.`,
            );
            return this.findById(id); // Return current user data if nothing to update
        }

        try {
            const updatedUserDoc = await UserModel.findByIdAndUpdate(
                id,
                { $set: updateFields },
                { new: true, runValidators: true }, // Return updated doc, run schema validators
            )
                .lean() // Use lean
                .exec();

            return this.mapToDomain(updatedUserDoc as IUserDocument | null); // Cast needed
        } catch (dbError: any) {
            console.error(`Error updating user ${id}:`, dbError);
            if (dbError.name === 'ValidationError') {
                const messages = Object.values(dbError.errors)
                    .map((e: any) => e.message)
                    .join(', ');
                throw new AppError(
                    `Validation error during user update: ${messages}`,
                    400,
                );
            }
            throw new Error('Database error during user update.');
        }
    }

    // --- IMPLEMENTED delete ---
    async delete(id: string): Promise<boolean> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return false; // Invalid ID format
        }
        try {
            const result = await UserModel.deleteOne({ _id: id }).exec();
            // deletedCount > 0 indicates successful deletion
            return result.deletedCount > 0;
        } catch (dbError: any) {
            console.error(`Error deleting user ${id}:`, dbError);
            throw new Error('Database error during user deletion.');
        }
    }
}
