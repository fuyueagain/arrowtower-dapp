// src/lib/logger.ts

import chalk from 'chalk';

// 日志级别
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// 颜色映射
const colors: Record<LogLevel, (s: string) => string> = {
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  debug: chalk.gray,
};

// 日志函数
export const logger = {
  info: (msg: string) => log('INFO', msg, 'info'),
  warn: (msg: string) => log('WARN', msg, 'warn'),
  error: (msg: string) => log('ERROR', msg, 'error'),
  debug: (msg: string) => log('DEBUG', msg, 'debug'),
};

function log(level: string, message: string, type: LogLevel) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const color = colors[type];
  console.log(`${color(`[${level}]`)} ${timestamp} ${message}`);
}