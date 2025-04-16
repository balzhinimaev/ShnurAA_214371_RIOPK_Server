// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    coverageDirectory: 'coverage',

    // Add specific coverage collection settings
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.interface.ts',
        '!src/types/**/*.ts',
        '!**/node_modules/**',
        '!**/dist/**',
        '!src/**/index.ts', // Exclude barrel files if you want
    ],

    // Add coverage reporters
    coverageReporters: ['text', 'lcov', 'html', 'json'],

    // Specify coverage thresholds if you want to enforce minimum coverage
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 60,
            functions: 70,
            lines: 70,
        },
    },

    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    transformIgnorePatterns: ['/node_modules/', '\\.pnp\\.[^\\/]+$'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                // Enable source maps for better coverage mapping
                isolatedModules: false,
                diagnostics: {
                    ignoreCodes: ['TS151001'],
                },
                tsconfig: 'tsconfig.json',
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
    },
    setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts', 'reflect-metadata'],
};

export default config;
