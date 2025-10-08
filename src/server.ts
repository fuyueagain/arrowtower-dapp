// src/server.ts 或 src/worker.ts
import { startCheckinWatcher } from './jobs/checkin-watcher.ts';


console.log('🚀 启动 ArrowTower 后台服务...');
console.log('🚀 Check-in Watcher 和 Mint Processor 正在运行...');

// ✅ 启动打卡监控
startCheckinWatcher();

