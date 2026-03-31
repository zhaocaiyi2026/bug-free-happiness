/**
 * 数据源服务 - 入口文件
 * 
 * 导出所有数据源相关功能
 */

// 类型定义
export * from './types';

// 配置
export { 
  DATA_SOURCE_CONFIGS, 
  SYNC_SCHEDULES, 
  SYNC_BATCH_CONFIG,
  getEnabledSources, 
  getSourceConfig 
} from './config';

// 数据源服务
export { ApiSpaceService, apiSpaceService } from './apispace-service';
export { CCGPService, ccgpService } from './ccgp-service';
export { StoneDTService, stoneDTService } from './stonedt-service';
export { GGZYService, ggzyService, PROVINCIAL_PLATFORMS } from './ggzy-service';
export { CEBPubService, cebpubService } from './cebpub-service';
export { JilinCCGPCrawler, jilinCCGPCrawler } from './jilin-ccgp-crawler';
export { AIParserService, aiParserService } from './ai-parser';

// 同步调度器
export {
  startDataSyncScheduler,
  stopDataSyncScheduler,
  runIncrementalSync,
  runFullSync,
  syncFromSource,
  manualSync,
  getSyncStatus,
  getSyncLogs,
  getActiveSyncTasks,
  startSyncScheduler,
  stopSyncScheduler,
} from './sync-scheduler';
