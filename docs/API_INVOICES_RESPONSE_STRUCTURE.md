# 📋 Структура ответа API `/api/v1/reports/invoices`

## ✅ Ответы на вопросы

### 1. УНП (unp)

#### ✅ Возвращается ли поле `customer.unp` в ответе API?

**ДА**, поле `customer.unp` возвращается в ответе API, **НО** только если:
- Клиент был успешно найден в БД
- Populate выполнен успешно (строка 1200 в `invoice.repository.ts`: `.populate('customerId', 'name unp contactInfo')`)

#### ⚠️ Может ли `customer` быть `null` или `undefined`?

**ДА**, `customer` может быть `undefined` в следующих случаях:
- Клиент был удален из БД, но счет остался
- `customerId` ссылается на несуществующий документ
- Ошибка при populate

**В коде**: `customer?: Customer` - опциональное поле (строка 30 в `invoice.entity.ts`)

#### ❓ Если `customer` отсутствует, есть ли УНП в другом месте объекта?

**НЕТ**, УНП находится только в `customer.unp`. Если `customer` отсутствует, УНП недоступен.

**Рекомендация для фронтенда**:
```javascript
// Безопасный доступ к УНП
const unp = invoice.customer?.unp || 'N/A';
```

---

### 2. Остаток (outstandingAmount)

#### ✅ Возвращается ли поле `outstandingAmount` в каждом счете?

**ДА**, поле `outstandingAmount` возвращается в каждом счете после исправления (добавлен метод `toJSON()` в `Invoice` entity).

#### ✅ Как оно рассчитывается?

**Формула**: `outstandingAmount = totalAmount - paidAmount`

**Реализация**: Геттер в `Invoice` entity (строки 115-117 в `invoice.entity.ts`):
```typescript
get outstandingAmount(): number {
    return this.totalAmount - this.paidAmount;
}
```

**В JSON**: Включается через метод `toJSON()` (строка 139 в `invoice.entity.ts`)

#### ❓ Может ли оно быть `null` или `undefined`?

**НЕТ**, `outstandingAmount` всегда число:
- Если `totalAmount = 1000` и `paidAmount = 500` → `outstandingAmount = 500`
- Если `totalAmount = 1000` и `paidAmount = 1000` → `outstandingAmount = 0`
- Если `totalAmount = 1000` и `paidAmount = 0` → `outstandingAmount = 1000`

**Минимальное значение**: `0` (не может быть отрицательным)

---

### 3. Структура ответа

#### ✅ Формат ответа: `{ invoices: [...], total: number, limit: number, offset: number }`?

**ДА**, формат ответа точно такой:

```typescript
{
  invoices: Invoice[];      // Массив счетов
  total: number;            // Общее количество (всего)
  limit: number;            // Лимит на странице
  offset: number;           // Смещение
}
```

**Реализация**: Строки 1207-1212 в `invoice.repository.ts`

#### ⚠️ Всегда ли возвращается объект `customer` внутри каждого счета?

**НЕТ**, `customer` может быть `undefined` (см. раздел 1 выше).

**Структура**:
```typescript
{
  id: string;
  invoiceNumber: string;
  customerId: string;        // ✅ Всегда есть
  customer?: {               // ⚠️ Может быть undefined
    id: string;
    name: string;
    unp?: string;            // ⚠️ Может быть undefined
    contactInfo?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  outstandingAmount: number; // ✅ Всегда есть (число)
  // ... другие поля
}
```

---

## 📊 Фактическая структура данных

### Полный пример ответа

```json
{
  "invoices": [
    {
      "id": "6916bf8cc37d74fc70084f2d",
      "invoiceNumber": "АКТ-2025-UNP-STAGE3",
      "customerId": "6916bef2c37d74fc70084f07",
      "customer": {
        "id": "6916bef2c37d74fc70084f07",
        "name": "ООО \"Универсал\"",
        "unp": "12345678",
        "contactInfo": null,
        "createdAt": "2025-11-14T05:35:08.491Z",
        "updatedAt": "2025-11-14T05:35:08.491Z"
      },
      "issueDate": "2025-09-30T00:00:00.000Z",
      "dueDate": "2025-10-13T00:00:00.000Z",
      "serviceStartDate": "2025-08-20T00:00:00.000Z",
      "serviceEndDate": "2025-09-30T00:00:00.000Z",
      "totalAmount": 5000,
      "paidAmount": 3000,
      "outstandingAmount": 2000,
      "paymentTermDays": 30,
      "actualPaymentDate": "2025-11-11T00:00:00.000Z",
      "status": "OVERDUE",
      "debtWorkStatus": "CLAIM",
      "serviceType": "OTHER",
      "manager": "Петров П.П.",
      "contractNumber": "Д-2025-UNP",
      "notes": "Этап 3: Частично погашено 3000",
      "lastContactDate": null,
      "contactResult": null,
      "createdAt": "2025-11-14T05:35:08.491Z",
      "updatedAt": "2025-11-14T05:35:08.491Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Пример без customer (если клиент не найден)

```json
{
  "invoices": [
    {
      "id": "6916bf8cc37d74fc70084f2d",
      "invoiceNumber": "АКТ-2025-UNP-STAGE3",
      "customerId": "6916bef2c37d74fc70084f07",
      "customer": undefined,  // ⚠️ Может быть undefined
      "outstandingAmount": 2000,  // ✅ Всегда есть
      // ... другие поля
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

## 🔍 Что отображается на фронтенде

### УНП: `invoice.customer?.unp`

**Код на фронтенде** (строка 466 в `pages/index.vue`):
```javascript
invoice.customer?.unp
```

**Поведение**:
- ✅ Если `customer` существует и `unp` есть → возвращает УНП (например, `"12345678"`)
- ✅ Если `customer` существует, но `unp` отсутствует → возвращает `undefined`
- ✅ Если `customer` отсутствует → возвращает `undefined`

**Рекомендация**: Использовать оператор `??` для fallback:
```javascript
const unp = invoice.customer?.unp ?? 'N/A';
// или
const unp = invoice.customer?.unp || 'Не указан';
```

### Остаток: `invoice.outstandingAmount`

**Код на фронтенде** (строка 475 в `pages/index.vue`):
```javascript
invoice.outstandingAmount
```

**Поведение**:
- ✅ Всегда возвращает число (не может быть `null` или `undefined`)
- ✅ Минимальное значение: `0`
- ✅ Формула: `totalAmount - paidAmount`

**Рекомендация**: Форматирование для отображения:
```javascript
const formattedAmount = invoice.outstandingAmount.toLocaleString('ru-RU', {
  style: 'currency',
  currency: 'RUB'
});
// Результат: "2 000,00 ₽"
```

---

## 🐛 Возможные причины проблем

### Если поля не отображаются на фронтенде:

#### 1. Поля отсутствуют в ответе API

**Проверка**: Откройте DevTools → Network → выберите запрос `/api/v1/reports/invoices` → Response

**Что искать**:
- Есть ли поле `outstandingAmount` в каждом счете?
- Есть ли поле `customer` в каждом счете?
- Есть ли поле `customer.unp`?

**Решение**: Убедитесь, что сервер пересобран после изменений:
```bash
npm run build
npm run start  # или npm run dev
```

#### 2. Поля имеют другие названия

**Проверка**: В ответе API могут быть:
- `customerInn` вместо `customer.unp` ❌ (не используется)
- `outstanding` вместо `outstandingAmount` ❌ (не используется)
- `balance` вместо `outstandingAmount` ❌ (не используется)

**Фактические названия**:
- ✅ `customer.unp` (не `customerInn`)
- ✅ `outstandingAmount` (не `outstanding` или `balance`)

#### 3. Поля имеют значение `null` или `undefined`

**Проверка**: В DevTools проверьте значения:
```javascript
// В консоли браузера после загрузки данных
console.log('Customer:', invoice.customer);
console.log('UNP:', invoice.customer?.unp);
console.log('Outstanding:', invoice.outstandingAmount);
```

**Возможные значения**:
- `customer`: `undefined` (если клиент не найден)
- `customer.unp`: `undefined` (если УНП не указан)
- `outstandingAmount`: всегда число (не может быть `null`)

---

## 🔧 Логирование для отладки

### Добавить логирование на бэкенде

**В контроллере** (`report.controller.ts`, строка 100):

```typescript
const result = await listInvoicesUseCase.execute({
    filters,
    limit,
    offset,
    sortBy,
    sortOrder,
});

// Логирование для отладки
console.log('=== INVOICES API DEBUG ===');
console.log('Total invoices:', result.invoices.length);
if (result.invoices.length > 0) {
    const firstInvoice = result.invoices[0];
    console.log('First invoice ID:', firstInvoice.id);
    console.log('Has customer:', !!firstInvoice.customer);
    console.log('Customer UNP:', firstInvoice.customer?.unp);
    console.log('OutstandingAmount:', firstInvoice.outstandingAmount);
    console.log('Full invoice:', JSON.stringify(firstInvoice, null, 2));
}
console.log('========================');

res.status(200).json(result);
```

### Добавить логирование на фронтенде

**В компоненте** (`pages/index.vue`):

```javascript
// После получения данных
const response = await fetch('/api/v1/reports/invoices', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

console.log('=== FRONTEND DEBUG ===');
console.log('Total invoices:', data.invoices.length);
if (data.invoices.length > 0) {
  const firstInvoice = data.invoices[0];
  console.log('Invoice structure:', Object.keys(firstInvoice));
  console.log('Has customer:', 'customer' in firstInvoice);
  console.log('Customer value:', firstInvoice.customer);
  console.log('Customer UNP:', firstInvoice.customer?.unp);
  console.log('OutstandingAmount:', firstInvoice.outstandingAmount);
  console.log('Full invoice:', JSON.stringify(firstInvoice, null, 2));
}
console.log('======================');
```

---

## ✅ Чеклист проверки

### На бэкенде:

- [ ] Метод `toJSON()` добавлен в `Invoice` entity
- [ ] `mapToDomain()` обрабатывает populate для `customer`
- [ ] `outstandingAmount` включен в `toJSON()`
- [ ] Проект пересобран (`npm run build`)
- [ ] Сервер перезапущен

### На фронтенде:

- [ ] Используется безопасный доступ: `invoice.customer?.unp`
- [ ] Проверяется наличие `outstandingAmount` перед использованием
- [ ] Добавлено логирование для отладки
- [ ] Проверен Network tab в DevTools

---

## 📝 Резюме

| Поле | Всегда есть? | Может быть undefined? | Тип |
|------|--------------|---------------------|-----|
| `customer` | ❌ НЕТ | ✅ ДА | `object \| undefined` |
| `customer.unp` | ❌ НЕТ | ✅ ДА (если customer отсутствует или unp не указан) | `string \| undefined` |
| `outstandingAmount` | ✅ ДА | ❌ НЕТ | `number` (всегда число) |
| `customerId` | ✅ ДА | ❌ НЕТ | `string` |

**Формулы**:
- `outstandingAmount = totalAmount - paidAmount`
- `unp = invoice.customer?.unp ?? 'N/A'`

---

## 🔗 Связанные документы

- [API_INVOICES_LIST.md](./API_INVOICES_LIST.md) - Полная документация API
- [API_DASHBOARD_SUMMARY.md](./API_DASHBOARD_SUMMARY.md) - Dashboard API

---

**Дата создания**: 2025-11-14  
**Статус**: ✅ Актуально

