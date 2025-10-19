// jest.config.js
import type { Config } from 'jest';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: Config = {
  // 使用 ts-jest 预设，自动处理 TypeScript
  preset: 'ts-jest',

  // 测试环境：Node.js（适合后端逻辑）
  testEnvironment: 'node',

  // 指定测试文件匹配规则
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
    '<rootDir>/**/__tests__/**/*.ts',
  ],

  // 在每个测试文件运行前，先运行 setup.ts（用于 mock prisma 等）
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 自动清除 mock 状态
  clearMocks: true,

  // 收集覆盖率
  collectCoverage: true,

  // 覆盖率输出目录
  coverageDirectory: 'coverage',

  // 覆盖率收集工具（推荐 v8，无需额外安装）
  coverageProvider: 'v8',

  // ✅ 添加这一项：告诉 Jest @/ 指向 src/
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // 忽略 node_modules 和类型文件
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '.d.ts',
    'jest.config.ts',
  ],

  // 根目录（可选）
  rootDir: resolve(__dirname, '.'),

  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // 允许使用 import.meta.url
  // 注意：Jest 默认不支持 ES Modules 的 import.meta，但 ts-jest 可以处理
};

export default config;