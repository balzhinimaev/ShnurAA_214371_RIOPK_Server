"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(props) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Используем string для ID (MongoDB ObjectId будет строкой)
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "email", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "passwordHash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Храним хеш, а не пароль
        Object.defineProperty(this, "roles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.id = props.id;
        this.name = props.name;
        this.email = props.email;
        this.passwordHash = props.passwordHash;
        this.roles = props.roles;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map