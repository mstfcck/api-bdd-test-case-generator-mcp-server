/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: {
                    module: 'ES2022',
                    target: 'ES2022',
                    moduleResolution: 'node',
                    isolatedModules: true,
                    esModuleInterop: true,
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true
                },
                diagnostics: {
                    ignoreCodes: [151002]
                }
            },
        ],
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@modelcontextprotocol)/)',
    ],
    testMatch: ['**/__tests__/**/*.test.ts', '**/tests/**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!**/*.test.ts',
        '!**/node_modules/**',
        '!**/dist/**',
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
};
