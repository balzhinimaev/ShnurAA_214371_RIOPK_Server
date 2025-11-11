# Руководство по API фильтрации клиентов по срокам просрочки (Aging Buckets)

## Обзор

Реализована функциональность фильтрации клиентов и счетов по категориям старения задолженности (aging buckets). Это позволяет анализировать дебиторскую задолженность по срокам просрочки.

## Категории старения (Aging Buckets)

| Категория | Значение | Описание |
|-----------|----------|----------|
| CURRENT | `CURRENT` | Без просрочки (0 дней) |
| 1-30 дней | `1_30` | Просрочка от 1 до 30 дней |
| 31-60 дней | `31_60` | Просрочка от 31 до 60 дней |
| 61-90 дней | `61_90` | Просрочка от 61 до 90 дней |
| 91+ дней | `91_PLUS` | Просрочка 91 и более дней |

---

## 1. Получение клиентов с просрочкой

### Endpoint
```
GET /api/v1/reports/customers-overdue
Authorization: Bearer <token>
```

### Параметры запроса

| Параметр | Тип | Описание |
|----------|-----|----------|
| `agingBucket` | string | Фильтр по категории (CURRENT, 1_30, 31_60, 61_90, 91_PLUS) |
| `minDaysOverdue` | integer | Минимальное количество дней просрочки (имеет приоритет над agingBucket) |
| `maxDaysOverdue` | integer | Максимальное количество дней просрочки (имеет приоритет над agingBucket) |
| `minOverdueAmount` | number | Минимальная сумма просроченной задолженности |
| `includeCurrent` | boolean | Включать ли клиентов без просрочки (по умолчанию false) |
| `limit` | integer | Количество записей (по умолчанию 50) |
| `offset` | integer | Смещение для пагинации (по умолчанию 0) |
| `sortBy` | string | Поле сортировки: overdueAmount, oldestDebtDays, totalDebt, customerName |
| `sortOrder` | string | Порядок: asc или desc (по умолчанию desc) |

### Примеры запросов

#### Пример 1: Клиенты с просрочкой 1-30 дней
```bash
GET /api/v1/reports/customers-overdue?agingBucket=1_30
```

#### Пример 2: Клиенты с просрочкой 31-60 дней и долгом от 10000
```bash
GET /api/v1/reports/customers-overdue?agingBucket=31_60&minOverdueAmount=10000
```

#### Пример 3: Клиенты с просрочкой 61-90 дней, сортировка по сумме долга
```bash
GET /api/v1/reports/customers-overdue?agingBucket=61_90&sortBy=overdueAmount&sortOrder=desc
```

#### Пример 4: Клиенты с просрочкой 91+ дней
```bash
GET /api/v1/reports/customers-overdue?agingBucket=91_PLUS
```

#### Пример 5: Клиенты с просрочкой от 45 до 120 дней (гибкий фильтр)
```bash
GET /api/v1/reports/customers-overdue?minDaysOverdue=45&maxDaysOverdue=120
```

#### Пример 6: Клиенты с просрочкой более 90 дней
```bash
GET /api/v1/reports/customers-overdue?minDaysOverdue=90
```

### Пример ответа

```json
{
  "customers": [
    {
      "customerId": "507f1f77bcf86cd799439011",
      "customerName": "ООО \"МетПром\"",
      "customerUnp": "246813579",
      "totalDebt": 58000.00,
      "overdueDebt": 58000.00,
      "currentDebt": 0.00,
      "invoiceCount": 2,
      "overdueInvoiceCount": 2,
      "oldestDebtDays": 45,
      "agingBucket": "31_60",
      "agingBreakdown": {
        "current": 0.00,
        "days_1_30": 0.00,
        "days_31_60": 58000.00,
        "days_61_90": 0.00,
        "days_91_plus": 0.00
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0,
  "summary": {
    "totalOverdueAmount": 58000.00,
    "totalCustomers": 1,
    "averageDaysOverdue": 45.00
  }
}
```

### Описание полей ответа

| Поле | Описание |
|------|----------|
| `customerId` | ID клиента |
| `customerName` | Название клиента |
| `customerUnp` | УНП клиента |
| `totalDebt` | Общая задолженность (просроченная + текущая) |
| `overdueDebt` | Просроченная задолженность |
| `currentDebt` | Задолженность в срок (не просроченная) |
| `invoiceCount` | Общее количество счетов |
| `overdueInvoiceCount` | Количество просроченных счетов |
| `oldestDebtDays` | Количество дней самой старой просрочки |
| `agingBucket` | Категория по самой старой просрочке |
| `agingBreakdown` | Разбивка задолженности по aging buckets |

---

## 2. Фильтрация счетов по дням просрочки

### Endpoint
```
GET /api/v1/reports/invoices
Authorization: Bearer <token>
```

### Новые параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `minDaysOverdue` | integer | Минимальное количество дней просрочки |
| `maxDaysOverdue` | integer | Максимальное количество дней просрочки |

### Примеры запросов

#### Пример 1: Счета с просрочкой 1-30 дней
```bash
GET /api/v1/reports/invoices?minDaysOverdue=1&maxDaysOverdue=30
```

#### Пример 2: Счета с просрочкой 31-60 дней
```bash
GET /api/v1/reports/invoices?minDaysOverdue=31&maxDaysOverdue=60
```

#### Пример 3: Счета с просрочкой 61-90 дней
```bash
GET /api/v1/reports/invoices?minDaysOverdue=61&maxDaysOverdue=90
```

#### Пример 4: Счета с просрочкой более 90 дней
```bash
GET /api/v1/reports/invoices?minDaysOverdue=91
```

#### Пример 5: Комбинирование с другими фильтрами
```bash
GET /api/v1/reports/invoices?minDaysOverdue=30&minAmount=5000&sortBy=dueDate
```

---

## Типичные сценарии использования

### Сценарий 1: Анализ структуры просроченной задолженности

**Шаг 1:** Получить клиентов в каждой категории

```bash
# Категория 1-30 дней
GET /api/v1/reports/customers-overdue?agingBucket=1_30

# Категория 31-60 дней
GET /api/v1/reports/customers-overdue?agingBucket=31_60

# Категория 61-90 дней
GET /api/v1/reports/customers-overdue?agingBucket=61_90

# Категория 91+ дней
GET /api/v1/reports/customers-overdue?agingBucket=91_PLUS
```

**Результат:** Детальная картина распределения задолженности по срокам

### Сценарий 2: Фокус на критических должниках

Получить клиентов с большой просрочкой (91+ дней) и значительной суммой долга:

```bash
GET /api/v1/reports/customers-overdue?agingBucket=91_PLUS&minOverdueAmount=50000&sortBy=overdueAmount&sortOrder=desc
```

### Сценарий 3: Мониторинг ранней просрочки

Отследить клиентов, которые только начали просрочку (1-30 дней) для раннего взаимодействия:

```bash
GET /api/v1/reports/customers-overdue?agingBucket=1_30&sortBy=oldestDebtDays&sortOrder=desc
```

### Сценарий 4: Детализация по конкретному клиенту

Получить все счета конкретного клиента с просрочкой более 30 дней:

```bash
GET /api/v1/reports/invoices?customerId=507f1f77bcf86cd799439011&minDaysOverdue=30
```

---

## Важные замечания

1. **Приоритет фильтров:** Если указаны `minDaysOverdue` или `maxDaysOverdue`, они имеют приоритет над параметром `agingBucket`.

2. **По умолчанию исключается CURRENT:** Параметр `includeCurrent=false` по умолчанию исключает клиентов без просрочки. Чтобы включить их, установите `includeCurrent=true`.

3. **Расчет aging bucket клиента:** Категория клиента определяется по **самой старой просрочке** среди всех его счетов.

4. **Разбивка agingBreakdown:** Показывает детальное распределение задолженности клиента по всем категориям, не только по основной категории.

5. **Производительность:** Фильтрация по дням просрочки использует MongoDB aggregation для точных расчетов, что может быть медленнее для больших объемов данных.

---

## Ошибки и устранение

### Ошибка 401 - Unauthorized
**Причина:** Отсутствует или невалиден токен авторизации.
**Решение:** Убедитесь, что вы передаете валидный Bearer token в заголовке Authorization.

### Ошибка 500 - Internal Server Error
**Причина:** Ошибка на сервере при выполнении aggregation.
**Решение:** Проверьте логи сервера, убедитесь, что MongoDB работает корректно.

---

## Обновление от существующих эндпоинтов

Если вы использовали `/reports/top-debtors`, новый эндпоинт `/reports/customers-overdue` предоставляет:

✅ Фильтрацию по aging buckets
✅ Детальную разбивку по категориям (agingBreakdown)
✅ Фильтрацию по диапазонам дней
✅ Сводную статистику (summary)

Старый эндпоинт остается доступным для обратной совместимости.

