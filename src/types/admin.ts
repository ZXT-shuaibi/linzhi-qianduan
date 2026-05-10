/** 模块状态 */
export type ModuleStatus = {
  module: string;
  status: string;
  note: string;
};

/** 运行总览 */
export type RuntimeData = {
  applicationName: string;
  activeProfiles: string[];
  generatedAt: string;
  llmProvider: string;
  llmModel: string;
  searchProvider: string;
  ragDefaultTopK: number;
  socialKafkaEnabled: boolean;
  socialRebuildEnabled: boolean;
  tradeKafkaEnabled: boolean;
  discoverFailOpenEnabled: boolean;
  loginBlacklistEnabled: boolean;
  cacheHotkeyEnabled: boolean;
  localCacheMaxEntriesPerRegion: number;
  localCacheRegionCount: number;
  modules: ModuleStatus[];
};

/** JVM 指标 */
export type JvmMetrics = {
  uptimeMillis: number;
  heapUsedBytes: number;
  heapCommittedBytes: number;
  heapMaxBytes: number;
  nonHeapUsedBytes: number;
  liveThreadCount: number;
  daemonThreadCount: number;
  peakThreadCount: number;
  availableProcessors: number;
  systemLoadAverage: number;
};

/** 缓存指标 */
export type CacheMetrics = {
  localHitCount: number;
  localMissCount: number;
  localExpiredCount: number;
  localManualEvictionCount: number;
  localCapacityEvictionCount: number;
  redisReadFailureCount: number;
  redisWriteFailureCount: number;
  redisDeleteFailureCount: number;
  redisPatternDeleteFailureCount: number;
  redisPatternDeletedKeyCount: number;
};

/** 缓存区域 */
export type CacheRegion = {
  region: string;
  size: number;
  maxEntries: number;
  hitCount: number;
  missCount: number;
  expiredCount: number;
  manualEvictionCount: number;
  capacityEvictionCount: number;
};

/** 热点 Key */
export type HotKey = {
  key: string;
  heat: number;
  level: string;
};

/** 线程池 */
export type ThreadPool = {
  name: string;
  threadNamePrefix: string;
  corePoolSize: number;
  maximumPoolSize: number;
  queueCapacity: number;
  preventRejection: boolean;
  poolSize: number;
  activeCount: number;
  queuedTaskCount: number;
  taskCount: number;
  completedTaskCount: number;
  largestPoolSize: number;
  rejectedCount: number;
  cpuLoad: number;
};

/** 可观测性 */
export type ObservabilityData = {
  generatedAt: string;
  actuatorExposedEndpoints: string[];
  jvm: JvmMetrics;
  cacheMetrics: CacheMetrics;
  threadPools: ThreadPool[];
};

/** 全景快照 */
export type OpsSnapshot = {
  runtime: RuntimeData;
  observability: ObservabilityData;
  cacheRegions: CacheRegion[];
  hotKeys: HotKey[];
};

/** 缓存清除请求 */
export type CacheEvictRequest = {
  region?: string;
  localKey?: string;
  redisKey?: string;
  redisPattern?: string;
};

/** 热点重置请求 */
export type HotKeyResetRequest = {
  key: string;
};
