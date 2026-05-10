import { apiFetch } from "./apiClient";
import type {
  CacheEvictRequest,
  CacheMetrics,
  CacheRegion,
  HotKey,
  HotKeyResetRequest,
  OpsSnapshot,
  RuntimeData,
  ThreadPool,
} from "@/types/admin";

const PLATFORM = "/api/v1/platform";
const RAG = "/api/v1/rag";

export const adminService = {
  /** 运行总览 */
  getRuntime: () => apiFetch<RuntimeData>(`${PLATFORM}/runtime`, { authMode: "required" }),

  /** 全景快照 */
  getSnapshot: (hotKeyLimit?: number) => {
    const query = hotKeyLimit ? `?hotKeyLimit=${hotKeyLimit}` : "";
    return apiFetch<OpsSnapshot>(`${PLATFORM}/snapshot${query}`, { authMode: "required" });
  },

  /** 缓存区域列表 */
  getCacheRegions: () => apiFetch<CacheRegion[]>(`${PLATFORM}/cache/regions`, { authMode: "required" }),

  /** 缓存整体指标 */
  getCacheMetrics: () => apiFetch<CacheMetrics>(`${PLATFORM}/cache/metrics`, { authMode: "required" }),

  /** 热点 Key 列表 */
  getHotKeys: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : "";
    return apiFetch<HotKey[]>(`${PLATFORM}/cache/hotkeys${query}`, { authMode: "required" });
  },

  /** 重置热点 Key 统计 */
  resetHotKey: (payload: HotKeyResetRequest) =>
    apiFetch<string>(`${PLATFORM}/cache/hotkeys/reset`, {
      method: "POST",
      authMode: "required",
      body: payload,
    }),

  /** 清除缓存 */
  evictCache: (payload: CacheEvictRequest) =>
    apiFetch<string>(`${PLATFORM}/cache/evict`, {
      method: "POST",
      authMode: "required",
      body: payload,
    }),

  /** Redis Key 预览 */
  getRedisKeys: (pattern: string, limit?: number) => {
    const safeLimit = limit ?? 50;
    return apiFetch<string[]>(
      `${PLATFORM}/cache/redis-keys?pattern=${encodeURIComponent(pattern)}&limit=${safeLimit}`,
      { authMode: "required" }
    );
  },

  /** 线程池状态 */
  getThreadPools: () => apiFetch<ThreadPool[]>(`${PLATFORM}/threadpools`, { authMode: "required" }),

  /** 全量重建公开内容 RAG 索引 */
  reindexPublic: () =>
    apiFetch<number>(`${RAG}/reindex/public`, { method: "POST", authMode: "required" }),

  /** 重建单篇帖子 RAG 索引 */
  reindexPost: (postId: string) =>
    apiFetch<number>(`${RAG}/posts/${postId}/reindex`, { method: "POST", authMode: "required" }),
};
