# 📋 Структура данных API `/api/v1/customers` - Поле УНП

## ✅ Ответы на вопросы

### 1. Название поля УНП

#### ✅ Возвращается ли поле `inn` в ответе API?

**НЕТ**, поле `inn` **НЕ возвращается** в ответе API.

#### ✅ Какое поле используется для УНП?

**Поле называется `unp`** (не `inn`, не `taxId`, не `unpNumber`).

#### ✅ Может ли поле отсутствовать?

**ДА**, поле `unp` является **опциональным** (`unp?: string`):
- Может быть `undefined`
- Может быть `null` (в JSON может быть `null` или поле может отсутствовать)
- Может быть пустой строкой `""`

---

## 📊 Структура ответа API `/api/v1/customers`

### Формат ответа

```json
{
  "customers": [
    {
      "id": "6151f5a0a9a7b1001b1a77a5",
      "name": "ООО Ромашка",
      "unp": "7712345678",           // ← Поле называется `unp`, не `inn`
      "contactInfo": "contact@romashka.ru",
      "createdAt": "2023-10-01T10:00:00.000Z",
      "updatedAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "total": 53,
  "offset": 0,
  "limit": 10
}
```

### Структура объекта Customer

```typescript
{
  id: string;                    // ✅ Обязательное поле
  name: string;                  // ✅ Обязательное поле
  unp?: string;                  // ⚠️ Опциональное поле (может быть undefined/null)
  contactInfo?: string | null;  // ⚠️ Опциональное поле
  createdAt: string | Date;      // ✅ Обязательное поле
  updatedAt: string | Date;      // ✅ Обязательное поле
}
```

---

## 🔍 Детали реализации в бэкенде

### 1. Domain Entity (`src/domain/entities/customer.entity.ts`)

```typescript
export class Customer {
    public readonly id: string;
    public name: string;
    public unp?: string;              // ← Поле называется `unp`
    public contactInfo?: string;
    // ...
}
```

### 2. Database Schema (`src/infrastructure/database/mongoose/schemas/customer.schema.ts`)

```typescript
const CustomerSchema = new Schema({
    name: { type: String, required: true },
    unp: { type: String, sparse: true, unique: true },  // ← Поле называется `unp`
    contactInfo: { type: String },
    // ...
});
```

### 3. Response DTO (`src/application/dtos/customers/customer-response.dto.ts`)

```typescript
export class CustomerResponseDto {
    @Expose()
    id!: string;

    @Expose()
    name!: string;

    @Expose()
    unp?: string;                    // ← Поле называется `unp`, опциональное

    @Expose()
    contactInfo?: string;
    // ...
}
```

### 4. API Endpoint (`src/infrastructure/web/express/routes/customer.routes.ts`)

```typescript
// GET /api/v1/customers
router.get('/', customerController.getAllCustomers);
```

---

## ⚠️ Несоответствие на фронтенде

### Проблема

На фронтенде обнаружено несоответствие в названиях полей:

1. **В `stores/report.ts`** (строка 58):
   ```typescript
   customer.unp  // ✅ Правильно
   ```

2. **В `stores/customer.ts`** (строка 10):
   ```typescript
   customer.inn  // ❌ Неправильно - должно быть `customer.unp`
   ```

3. **В `pages/customers.vue`** (строка 155):
   ```typescript
   customer.inn  // ❌ Неправильно - должно быть `customer.unp`
   ```

### Решение

**Заменить все использования `customer.inn` на `customer.unp`**:

```typescript
// ❌ Неправильно
const unp = customer.inn || '—';

// ✅ Правильно
const unp = customer.unp || '—';
```

---

## 🔧 Рекомендации для фронтенда

### 1. Безопасный доступ к полю УНП

```typescript
// Вариант 1: С fallback на '—'
const unp = customer.unp || '—';

// Вариант 2: С проверкой на null/undefined
const unp = customer.unp ?? '—';

// Вариант 3: С явной проверкой
const unp = customer.unp ? customer.unp : 'Не указан';
```

### 2. TypeScript типы

```typescript
interface Customer {
  id: string;
  name: string;
  unp?: string;        // ← Используйте `unp`, не `inn`
  contactInfo?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
```

### 3. Проверка в консоли браузера

Для отладки можно добавить временное логирование:

```typescript
// В компоненте или store
console.log('Customer data:', customer);
console.log('UNP field:', customer.unp);
console.log('Has UNP?', !!customer.unp);
```

---

## 📝 Сводка

| Вопрос | Ответ |
|--------|-------|
| **Название поля УНП** | `unp` (не `inn`) |
| **Возвращается ли `inn`?** | ❌ НЕТ |
| **Возвращается ли `unp`?** | ✅ ДА |
| **Обязательное поле?** | ❌ НЕТ (опциональное) |
| **Может быть `undefined`?** | ✅ ДА |
| **Может быть `null`?** | ✅ ДА |
| **Может быть пустой строкой?** | ✅ ДА |
| **Формат ответа** | `{ customers: [...], total: number, offset: number, limit: number }` |

---

## ✅ Действия для исправления

1. ✅ **Заменить `customer.inn` на `customer.unp`** в:
   - `stores/customer.ts` (строка 10)
   - `pages/customers.vue` (строка 155)
   - Всех других местах, где используется `customer.inn`

2. ✅ **Обновить TypeScript типы** на фронтенде:
   ```typescript
   interface Customer {
     unp?: string;  // вместо inn?: string;
   }
   ```

3. ✅ **Проверить работу** после изменений:
   - Убедиться, что УНП отображается корректно
   - Проверить обработку случаев, когда `unp` отсутствует

---

## 🔗 Связанные файлы в бэкенде

- `src/domain/entities/customer.entity.ts` - Entity с полем `unp`
- `src/infrastructure/database/mongoose/schemas/customer.schema.ts` - Schema с полем `unp`
- `src/application/dtos/customers/customer-response.dto.ts` - DTO с полем `unp`
- `src/infrastructure/web/express/controllers/customer.controller.ts` - Контроллер API
- `src/infrastructure/web/express/routes/customer.routes.ts` - Роуты API

---

**Дата создания:** 2025-01-27  
**Статус:** ✅ Подтверждено - поле называется `unp`, не `inn`

