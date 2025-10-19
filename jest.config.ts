// jest.config.ts
import type { Config } from 'jest';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',

  // 识别为 ESM 的 ts 文件
  extensionsToTreatAsEsm: ['.ts'],

  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: './tsconfig.json', // 可选：指定 tsconfig
    },
  },

  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
    '<rootDir>/**/__tests__/**/*.ts',
  ],

  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '.d.ts',
    'jest.config.ts',
  ],

  rootDir: resolve(__dirname, '.'),
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default config;
