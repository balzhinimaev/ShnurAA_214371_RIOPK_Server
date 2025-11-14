# Исправление отображения количества просроченных счетов

## Проблема

На фронтенде (pages/index.vue, строка 336) количество просроченных счетов вычисляется неправильно:

```javascript
totalInvoices = agingStructure.reduce((sum, bucket) => sum + bucket.count, 0)
overdueInvoiceCount = totalInvoices  // ❌ НЕПРАВИЛЬНО: суммируются ВСЕ счета, включая CURRENT
```

Это приводит к тому, что непросроченные счета (bucket "Current") учитываются как просроченные.

## Правильное решение

API уже возвращает правильное значение `overdueInvoicesCount` в ответе `/reports/dashboard/summary`:

```json
{
  "totalReceivables": 5000,
  "overdueReceivables": 0,
  "overduePercentage": 0.0,
  "overdueInvoicesCount": 0,  // ✅ ПРАВИЛЬНОЕ значение - только просроченные счета
  "totalInvoicesCount": 1,
  "agingStructure": [
    {"bucket": "Current", "amount": 5000, "count": 1},
    {"bucket": "1-30", "amount": 0, "count": 0},
    ...
  ]
}
```

### Как должен работать фронтенд

**НЕПРАВИЛЬНО** (текущая реализация):
```javascript
// Строка 335-336 в pages/index.vue
totalInvoices = agingStructure.reduce((sum, bucket) => sum + bucket.count, 0)
overdueInvoiceCount = totalInvoices  // ❌ Считает ВСЕ счета
```

**ПРАВИЛЬНО** (как нужно исправить):
```javascript
// Использовать значение из API напрямую
overdueInvoiceCount = dashboardSummary.overdueInvoicesCount  // ✅ Только просроченные
totalInvoices = dashboardSummary.totalInvoicesCount  // ✅ Все счета
```

**Альтернативный вариант** (если нужно считать из agingStructure):
```javascript
// Исключить bucket "Current" из подсчета
overdueInvoiceCount = agingStructure
  .filter(bucket => bucket.bucket !== 'Current')
  .reduce((sum, bucket) => sum + bucket.count, 0)
```

## Структура ответа API

### Поля в DashboardSummary

| Поле | Тип | Описание |
|------|-----|----------|
| `totalInvoicesCount` | number | **Все** неоплаченные счета (включая Current) |
| `overdueInvoicesCount` | number | **Только просроченные** счета (исключая Current) |
| `agingStructure` | AgingBucket[] | Структура по bucket'ам (включает Current) |

### AgingBucket

| Поле | Тип | Описание |
|------|-----|----------|
| `bucket` | string | Категория: "Current", "1-30", "31-60", "61-90", "91+" |
| `amount` | number | Сумма задолженности в этой категории |
| `count` | number | Количество счетов в этой категории |

## Логика вычисления в бэкенде

```typescript
// src/infrastructure/database/mongoose/repositories/invoice.repository.ts
// Строки 531-532

overdueInvoicesCount: {
    $sum: { $cond: ['$isOverdue', 1, 0] },  // ✅ Только счета с isOverdue=true
}
```

Где `isOverdue` определяется как:
```typescript
isOverdue: {
    $cond: {
        if: { $lt: ['$dueDate', currentDate] },  // dueDate < currentDate
        then: true,
        else: false,
    },
}
```

## Пример для 1phase.csv

После корректировки дат для демо-данных:

```
Дата планируемой оплаты: 01.10.2026 (сдвинута на год вперед)
Текущая дата: 14.11.2025
```

**Результат**:
- `isOverdue = false` (так как 01.10.2026 > 14.11.2025)
- `daysOverdue = 0`
- `agingBucket = "Current"`
- `overdueInvoicesCount = 0` ✅
- `totalInvoicesCount = 1` ✅

**Ответ API**:
```json
{
  "totalReceivables": 5000,
  "overdueReceivables": 0,
  "overduePercentage": 0.0,
  "currentReceivables": 5000,
  "totalInvoicesCount": 1,
  "overdueInvoicesCount": 0,  // ✅ Правильно: 0 просроченных счетов
  "agingStructure": [
    {"bucket": "Current", "amount": 5000, "count": 1},  // ✅ Счет в категории Current
    {"bucket": "1-30", "amount": 0, "count": 0},
    {"bucket": "31-60", "amount": 0, "count": 0},
    {"bucket": "61-90", "amount": 0, "count": 0},
    {"bucket": "91+", "amount": 0, "count": 0}
  ]
}
```

## Исправление на фронтенде

### Файл: stores/report.ts (или pages/index.vue)

**Было** (строка 336):
```typescript
const overdueInvoiceCount = computed(() => {
  if (!summary.value) return 0;
  const totalInvoices = summary.value.agingStructure.reduce(
    (sum, bucket) => sum + bucket.count, 
    0
  );
  return totalInvoices;  // ❌ НЕПРАВИЛЬНО
});
```

**Должно быть**:
```typescript
const overdueInvoiceCount = computed(() => {
  if (!summary.value) return 0;
  return summary.value.overdueInvoicesCount;  // ✅ ПРАВИЛЬНО
});

const totalInvoices = computed(() => {
  if (!summary.value) return 0;
  return summary.value.totalInvoicesCount;  // ✅ Все счета
});
```

## Проверка

После исправления на фронтенде для 1phase.csv должно отображаться:

```
Процент просрочки: 0.0%
Просрочено счетов: 0 счетов  // ✅ Исправлено с 1 на 0
```

---

**Заключение**: Бэкенд работает правильно. Проблема на фронтенде — используется неправильная логика подсчета. Фронтенд должен использовать поле `overdueInvoicesCount` из API, а не суммировать все счета из `agingStructure`.

