// jest.config.cjs
const { resolve } = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

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

  // CommonJS 下 __dirname 可直接用，所以不用额外处理
  rootDir: resolve(__dirname, '.'),
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
