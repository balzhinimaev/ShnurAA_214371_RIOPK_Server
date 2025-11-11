// src/application/use-cases/data-uploads/service-type.mapper.ts
import { ServiceType } from '../../../domain/entities/invoice.entity';

/**
 * Маппер для преобразования названий услуг из 1С в enum ServiceType
 */
export class ServiceTypeMapper {
    private static readonly SERVICE_TYPE_MAP: Record<string, ServiceType> = {
        'Сопровождение ПКТ': 'PKT_SUPPORT',
        'сопровождение пкт': 'PKT_SUPPORT',
        'Установка ККТ': 'KKT_INSTALLATION',
        'установка ккт': 'KKT_INSTALLATION',
        'Обслуживание ККТ': 'KKT_SERVICE',
        'обслуживание ккт': 'KKT_SERVICE',
        'Обслуживание торг. автоматов': 'VENDING_SERVICE',
        'обслуживание торг. автоматов': 'VENDING_SERVICE',
        'Обслуживание торговых автоматов': 'VENDING_SERVICE',
        'Установка торг. автомата': 'VENDING_INSTALLATION',
        'установка торг. автомата': 'VENDING_INSTALLATION',
        'Установка торгового автомата': 'VENDING_INSTALLATION',
    };

    /**
     * Преобразует название услуги из CSV в ServiceType enum
     * @param serviceTypeStr - Строка с типом услуги из CSV
     * @returns ServiceType или 'OTHER' если тип не распознан
     */
    static map(serviceTypeStr: string | undefined | null): ServiceType {
        if (!serviceTypeStr) return 'OTHER';

        const normalized = serviceTypeStr.trim();
        const mapped = this.SERVICE_TYPE_MAP[normalized];

        if (mapped) {
            return mapped;
        }

        // Попытка нечувствительного к регистру поиска
        const lowerCaseKey = Object.keys(this.SERVICE_TYPE_MAP).find(
            (key) => key.toLowerCase() === normalized.toLowerCase(),
        );

        if (lowerCaseKey) {
            return this.SERVICE_TYPE_MAP[lowerCaseKey];
        }

        console.warn(
            `Unknown service type: "${serviceTypeStr}". Mapping to OTHER.`,
        );
        return 'OTHER';
    }

    /**
     * Возвращает список всех поддерживаемых типов услуг из 1С
     */
    static getSupportedTypes(): string[] {
        return Object.keys(this.SERVICE_TYPE_MAP);
    }
}

