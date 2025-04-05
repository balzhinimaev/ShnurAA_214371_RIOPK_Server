// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    coverageDirectory: 'coverage',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    transformIgnorePatterns: ['/node_modules/', '\\.pnp\\.[^\\/]+$'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                // tsconfig: 'tsconfig.json'
            },
        ],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        // Алиас для абсолютных путей
        '^src/(.*)$': '<rootDir>/src/$1',

        // Маппинг для моков (относительно импортов в коде)
        '../../../utils/logger': '<rootDir>/src/utils/__mocks__/logger.ts',
        '../../../models/Vocabulary/AcceptedWordBuryat':
            '<rootDir>/src/models/Vocabulary/__mocks__/AcceptedWordBuryat.ts',
        '../../../models/Vocabulary/AcceptedWordRussian':
            '<rootDir>/src/models/Vocabulary/__mocks__/AcceptedWordRussian.ts',

        // Альтернативный маппинг через абсолютные пути
        // '^src/utils/logger$': '<rootDir>/src/utils/__mocks__/logger.ts',
        // ... и т.д.
    },
    // Если ваш setup файл тоже на TS, используйте .ts расширение
    // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Оставляем .js, если файл не переименован
};

export default config; // Используем export default
