import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ApiError } from "@/services/apiClient";
import { adminService } from "@/services/adminService";
import { useAuth } from "@/context/AuthContext";
import type {
  CacheMetrics,
  CacheRegion,
  HotKey,
  OpsSnapshot,
  RuntimeData,
  ThreadPool,
} from "@/types/admin";
import styles from "./AdminPage.module.css";

/* ---------- helpers ---------- */
const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
  return `${(b / 1073741824).toFixed(2)} GB`;
};

const fmtMs = (ms: number) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const hitRate = (m: CacheMetrics) => {
  const total = m.localHitCount + m.localMissCount;
  if (total === 0) return 0;
  return Math.round((m.localHitCount / total) * 100);
};

const formatAdminError = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "登录已过期，请重新登录后再访问运维中心。";
    }
    if (error.status === 403) {
      return "当前账号没有管理员权限，不能访问运维中心。";
    }
    return error.message || `运维接口请求失败 (${error.status})`;
  }
  return error instanceof Error ? error.message : "运维数据加载失败";
};

/* ---------- types ---------- */
type Drawer =
  | { type: "runtime"; data: RuntimeData }
  | { type: "cacheRegions"; data: CacheRegion[] }
  | { type: "cacheMetrics"; data: CacheMetrics }
  | { type: "hotKeys"; data: HotKey[] }
  | { type: "threadPools"; data: ThreadPool[] }
  | { type: "redisKeys" }
  | { type: "cacheEvict" }
  | { type: "rag" };

/* ================================================================ */
const AdminPage = () => {
  const { user, tokens, isLoading: authLoading } = useAuth();
  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  const fetchAll = useCallback(async () => {
    if (authLoading || !tokens || !isAdmin) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await adminService.getSnapshot(20);
      setSnapshot(snap);
    } catch (err) {
      setSnapshot(null);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAdmin, tokens]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ---- danger detection ---- */
  const cacheHit = snapshot ? hitRate(snapshot.observability.cacheMetrics) : 100;
  const heapPct = snapshot
    ? Math.round((snapshot.observability.jvm.heapUsedBytes / snapshot.observability.jvm.heapMaxBytes) * 100)
    : 0;
  const hotKeysDanger = snapshot ? snapshot.hotKeys.filter((k) => k.level === "high").length : 0;

  /* ================ LAYOUT ================ */
  if (authLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.spin} />
        正在确认登录状态...
      </div>
    );
  }

  if (!tokens) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <AccessDenied
        title="无权访问运维中心"
        message="当前账号不是管理员。为了避免误操作，运维面板只对 ADMIN 角色开放。"
      />
    );
  }
  if (loading) {
    return (
      <div className={styles.loading}>
        <span className={styles.spin} />
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <AccessDenied
        title="运维数据加载失败"
        message={error}
        actionLabel="重试"
        onAction={() => void fetchAll()}
      />
    );
  }

  const rt = snapshot?.runtime;
  const obs = snapshot?.observability;
  const jvm = obs?.jvm;

  return (
    <>
      <div className={`${styles.wrapper} ${drawer ? styles.wrapperScaled : ""}`}>
        {/* ---- Header ---- */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>运维中心</h1>
            <p className={styles.subtitle}>
              {rt?.applicationName ?? "-"} &nbsp;|&nbsp;
              {rt?.activeProfiles?.join(", ") ?? "-"} &nbsp;|&nbsp;
              生成时间：{rt?.generatedAt ? new Date(rt.generatedAt).toLocaleTimeString() : "-"}
            </p>
          </div>
          <button className={styles.refreshBtn} onClick={fetchAll}>
            刷新
          </button>
        </div>

        {/* ---- Bento Grid ---- */}
        <div className={styles.grid}>
          {/* JVM */}
          <div className={`${styles.card} ${styles.span2} ${styles.cardClickable} ${heapPct > 85 ? styles.cardDanger : ""}`}>
            <button className={styles.detailLink} onClick={() => setDrawer({ type: "runtime", data: rt! })}>
              详情 →
            </button>
            <p className={styles.cardTitle}>JVM 内存</p>
            <p className={styles.cardValue}>{heapPct}%</p>
            <p className={styles.cardSub}>
              已用 {jvm ? fmtBytes(jvm.heapUsedBytes) : "-"} / 最大 {jvm ? fmtBytes(jvm.heapMaxBytes) : "-"}
            </p>
            <div className={styles.miniMetrics}>
              <div className={styles.miniMetric}>
                <div className={styles.miniMetricLabel}>线程</div>
                <div className={styles.miniMetricValue}>{jvm?.liveThreadCount ?? "-"}</div>
              </div>
              <div className={styles.miniMetric}>
                <div className={styles.miniMetricLabel}>CPU 核</div>
                <div className={styles.miniMetricValue}>{jvm?.availableProcessors ?? "-"}</div>
              </div>
              <div className={styles.miniMetric}>
                <div className={styles.miniMetricLabel}>运行</div>
                <div className={styles.miniMetricValue}>{jvm ? fmtMs(jvm.uptimeMillis) : "-"}</div>
              </div>
            </div>
          </div>

          {/* Cache Hit */}
          <div className={`${styles.card} ${styles.span2} ${styles.cardClickable} ${cacheHit < 50 ? styles.cardDanger : ""}`}>
            <button className={styles.detailLink} onClick={() => setDrawer({ type: "cacheMetrics", data: obs!.cacheMetrics })}>
              详情 →
            </button>
            <p className={styles.cardTitle}>缓存命中率</p>
            <p className={styles.cardValue}>{cacheHit}%</p>
            <p className={styles.cardSub}>
              命中 {obs?.cacheMetrics.localHitCount ?? 0} / 未命中 {obs?.cacheMetrics.localMissCount ?? 0}
            </p>
          </div>

          {/* Hot Keys */}
          <div className={`${styles.card} ${styles.span2} ${styles.cardClickable} ${hotKeysDanger > 0 ? styles.cardDanger : ""}`}>
            <button className={styles.detailLink} onClick={() => setDrawer({ type: "hotKeys", data: snapshot?.hotKeys ?? [] })}>
              详情 →
            </button>
            <p className={styles.cardTitle}>热点 Key</p>
            <p className={styles.cardValue}>{snapshot?.hotKeys.length ?? 0}</p>
            <p className={styles.cardSub}>
              高危 {hotKeysDanger} 个
            </p>
          </div>

          {/* Module Status */}
          <div className={`${styles.card} ${styles.span3}`}>
            <p className={styles.cardTitle}>模块状态</p>
            <div className={styles.badgeRow}>
              {rt?.modules?.map((m) => (
                <span
                  key={m.module}
                  className={`${styles.badge} ${m.status === "up" ? styles.badgeGreen : m.status === "degraded" ? styles.badgeRed : styles.badgeGray}`}
                >
                  {m.module} · {m.status}
                </span>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className={`${styles.card} ${styles.span3}`}>
            <p className={styles.cardTitle}>服务开关</p>
            <div className={styles.badgeRow}>
              {rt?.cacheHotkeyEnabled && <span className={`${styles.badge} ${styles.badgeGreen}`}>热点检测</span>}
              {rt?.loginBlacklistEnabled && <span className={`${styles.badge} ${styles.badgeGreen}`}>登录黑名单</span>}
              {rt?.socialKafkaEnabled && <span className={`${styles.badge} ${styles.badgeGreen}`}>社交 Kafka</span>}
              {rt?.tradeKafkaEnabled && <span className={`${styles.badge} ${styles.badgeGreen}`}>交易 Kafka</span>}
              {rt?.discoverFailOpenEnabled && <span className={`${styles.badge} ${styles.badgeRed}`}>发现熔断</span>}
              <span className={`${styles.badge} ${styles.badgeGray}`}>搜索: {rt?.searchProvider ?? "-"}</span>
              <span className={`${styles.badge} ${styles.badgeGray}`}>LLM: {rt?.llmModel ?? "-"}</span>
            </div>
          </div>

          {/* Cache Regions */}
          <div className={`${styles.card} ${styles.span3} ${styles.cardClickable}`}>
            <button className={styles.detailLink} onClick={() => setDrawer({ type: "cacheRegions", data: snapshot?.cacheRegions ?? [] })}>
              详情 →
            </button>
            <p className={styles.cardTitle}>缓存区域</p>
            <p className={styles.cardValue}>{snapshot?.cacheRegions.length ?? 0}</p>
            <p className={styles.cardSub}>最大每区 {rt?.localCacheMaxEntriesPerRegion ?? "-"} 条</p>
          </div>

          {/* Thread Pools */}
          <div className={`${styles.card} ${styles.span3} ${styles.cardClickable}`}>
            <button className={styles.detailLink} onClick={() => setDrawer({ type: "threadPools", data: snapshot?.observability.threadPools ?? [] })}>
              详情 →
            </button>
            <p className={styles.cardTitle}>线程池</p>
            <p className={styles.cardValue}>{snapshot?.observability.threadPools.length ?? 0}</p>
            <p className={styles.cardSub}>活跃线程 {snapshot?.observability.threadPools.reduce((s, p) => s + p.activeCount, 0) ?? 0}</p>
          </div>

          {/* Ops Actions */}
          <div className={`${styles.card} ${styles.span6}`}>
            <p className={styles.cardTitle}>运维操作</p>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button className={`${styles.formBtn} ${styles.formBtnPrimary}`} onClick={() => setDrawer({ type: "redisKeys" })}>
                Redis Key 预览
              </button>
              <button className={`${styles.formBtn} ${styles.formBtnPrimary}`} onClick={() => setDrawer({ type: "cacheEvict" })}>
                清除缓存
              </button>
              <button className={`${styles.formBtn} ${styles.formBtnDanger}`} onClick={() => setDrawer({ type: "rag" })}>
                RAG 索引重建
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================ DRAWER ================ */}
      {drawer && (
        <>
          <div className={styles.overlay} onClick={() => setDrawer(null)} />
          <aside className={styles.drawer}>
            <DrawerContent drawer={drawer} onClose={() => setDrawer(null)} />
          </aside>
        </>
      )}
    </>
  );
};

export default AdminPage;

function AccessDenied({
  title,
  message,
  actionLabel,
  onAction
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className={styles.guardPage}>
      <div className={styles.guardCard}>
        <p className={styles.guardEyebrow}>Admin Guard</p>
        <h1 className={styles.guardTitle}>{title}</h1>
        <p className={styles.guardText}>{message}</p>
        <div className={styles.guardActions}>
          {onAction ? (
            <button className={`${styles.formBtn} ${styles.formBtnPrimary}`} onClick={onAction}>
              {actionLabel ?? "重试"}
            </button>
          ) : null}
          <Link className={styles.guardLink} to="/">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ================================================================ */
/* Drawer Content */
/* ================================================================ */

function DrawerContent({ drawer, onClose }: { drawer: Drawer; onClose: () => void }) {
  switch (drawer.type) {
    case "runtime":
      return <RuntimeDrawer data={drawer.data} onClose={onClose} />;
    case "cacheRegions":
      return <CacheRegionsDrawer data={drawer.data} onClose={onClose} />;
    case "cacheMetrics":
      return <CacheMetricsDrawer data={drawer.data} onClose={onClose} />;
    case "hotKeys":
      return <HotKeysDrawer data={drawer.data} onClose={onClose} />;
    case "threadPools":
      return <ThreadPoolsDrawer data={drawer.data} onClose={onClose} />;
    case "redisKeys":
      return <RedisKeysDrawer onClose={onClose} />;
    case "cacheEvict":
      return <CacheEvictDrawer onClose={onClose} />;
    case "rag":
      return <RagDrawer onClose={onClose} />;
    default:
      return null;
  }
}

/* ---- Drawer Shell ---- */
function DrawerShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className={styles.drawerHeader}>
        <h2 className={styles.drawerTitle}>{title}</h2>
        <button className={styles.drawerClose} onClick={onClose}>✕</button>
      </div>
      <div className={styles.drawerBody}>{children}</div>
    </>
  );
}

/* ---- Runtime ---- */
function RuntimeDrawer({ data, onClose }: { data: RuntimeData; onClose: () => void }) {
  return (
    <DrawerShell title="运行总览" onClose={onClose}>
      <div className={styles.drawerSection}>
        <p className={styles.drawerSectionTitle}>基本信息</p>
        <table className={styles.drawerTable}>
          <tbody>
            <tr><td>应用名</td><td>{data.applicationName}</td></tr>
            <tr><td>环境</td><td>{data.activeProfiles.join(", ")}</td></tr>
            <tr><td>LLM</td><td>{data.llmProvider} / {data.llmModel}</td></tr>
            <tr><td>搜索</td><td>{data.searchProvider}</td></tr>
            <tr><td>RAG TopK</td><td>{data.ragDefaultTopK}</td></tr>
          </tbody>
        </table>
      </div>
      <div className={styles.drawerSection}>
        <p className={styles.drawerSectionTitle}>服务开关</p>
        <table className={styles.drawerTable}>
          <tbody>
            <tr><td>热点检测</td><td>{data.cacheHotkeyEnabled ? "✔" : "✘"}</td></tr>
            <tr><td>登录黑名单</td><td>{data.loginBlacklistEnabled ? "✔" : "✘"}</td></tr>
            <tr><td>社交 Kafka</td><td>{data.socialKafkaEnabled ? "✔" : "✘"}</td></tr>
            <tr><td>社交重建</td><td>{data.socialRebuildEnabled ? "✔" : "✘"}</td></tr>
            <tr><td>交易 Kafka</td><td>{data.tradeKafkaEnabled ? "✔" : "✘"}</td></tr>
            <tr><td>发现熔断</td><td>{data.discoverFailOpenEnabled ? "✔" : "✘"}</td></tr>
          </tbody>
        </table>
      </div>
    </DrawerShell>
  );
}

/* ---- Cache Regions ---- */
function CacheRegionsDrawer({ data, onClose }: { data: CacheRegion[]; onClose: () => void }) {
  return (
    <DrawerShell title="缓存区域" onClose={onClose}>
      <table className={styles.drawerTable}>
        <thead>
          <tr>
            <th>区域</th><th>条数</th><th>上限</th><th>命中</th><th>未命中</th><th>淘汰</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.region}>
              <td>{r.region}</td>
              <td>{r.size} / {r.maxEntries}</td>
              <td>{r.hitCount}</td>
              <td>{r.missCount}</td>
              <td>{r.expiredCount}</td>
              <td>{r.capacityEvictionCount + r.manualEvictionCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DrawerShell>
  );
}

/* ---- Cache Metrics ---- */
function CacheMetricsDrawer({ data, onClose }: { data: CacheMetrics; onClose: () => void }) {
  return (
    <DrawerShell title="缓存指标" onClose={onClose}>
      <div className={styles.drawerSection}>
        <p className={styles.drawerSectionTitle}>本地缓存</p>
        <table className={styles.drawerTable}>
          <tbody>
            <tr><td>命中次数</td><td>{data.localHitCount.toLocaleString()}</td></tr>
            <tr><td>未命中次数</td><td>{data.localMissCount.toLocaleString()}</td></tr>
            <tr><td>命中率</td><td>{hitRate(data)}%</td></tr>
            <tr><td>过期淘汰</td><td>{data.localExpiredCount.toLocaleString()}</td></tr>
            <tr><td>容量淘汰</td><td>{data.localCapacityEvictionCount.toLocaleString()}</td></tr>
            <tr><td>手动清除</td><td>{data.localManualEvictionCount.toLocaleString()}</td></tr>
          </tbody>
        </table>
      </div>
      <div className={styles.drawerSection}>
        <p className={styles.drawerSectionTitle}>Redis 异常统计</p>
        <table className={styles.drawerTable}>
          <tbody>
            <tr><td>读失败</td><td>{data.redisReadFailureCount}</td></tr>
            <tr><td>写失败</td><td>{data.redisWriteFailureCount}</td></tr>
            <tr><td>删除失败</td><td>{data.redisDeleteFailureCount}</td></tr>
            <tr><td>通配删除失败</td><td>{data.redisPatternDeleteFailureCount}</td></tr>
            <tr><td>通配删除 Key 数</td><td>{data.redisPatternDeletedKeyCount}</td></tr>
          </tbody>
        </table>
      </div>
    </DrawerShell>
  );
}

/* ---- Hot Keys ---- */
function HotKeysDrawer({ data, onClose }: { data: HotKey[]; onClose: () => void }) {
  const [result, setResult] = useState<string | null>(null);
  const handleReset = async (key: string) => {
    try {
      const msg = await adminService.resetHotKey({ key });
      setResult(msg);
    } catch {
      setResult("重置失败");
    }
  };

  const levelColor = (lvl: string) => (lvl === "high" ? styles.badgeRed : lvl === "mid" ? styles.badgeGray : styles.badgeGreen);

  return (
    <DrawerShell title="热点 Key" onClose={onClose}>
      {result && <div className={`${styles.formResult} ${styles.formResultSuccess}`}>{result}</div>}
      <table className={styles.drawerTable}>
        <thead><tr><th>Key</th><th>热度</th><th>等级</th><th>操作</th></tr></thead>
        <tbody>
          {data.map((k) => (
            <tr key={k.key}>
              <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.key}</td>
              <td>{k.heat}</td>
              <td><span className={`${styles.badge} ${levelColor(k.level)}`}>{k.level}</span></td>
              <td><button className={`${styles.formBtn} ${styles.formBtnDanger}`} onClick={() => handleReset(k.key)}>重置</button></td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "#9ca3af" }}>暂无热点 Key</td></tr>}
        </tbody>
      </table>
    </DrawerShell>
  );
}

/* ---- Thread Pools ---- */
function ThreadPoolsDrawer({ data, onClose }: { data: ThreadPool[]; onClose: () => void }) {
  return (
    <DrawerShell title="线程池" onClose={onClose}>
      <table className={styles.drawerTable}>
        <thead>
          <tr><th>名称</th><th>核心</th><th>最大</th><th>活跃</th><th>队列</th><th>CPU%</th></tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td>{p.corePoolSize}</td>
              <td>{p.maximumPoolSize}</td>
              <td>{p.activeCount}</td>
              <td>{p.queuedTaskCount}/{p.queueCapacity}</td>
              <td>{(p.cpuLoad * 100).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DrawerShell>
  );
}

/* ---- Redis Keys ---- */
function RedisKeysDrawer({ onClose }: { onClose: () => void }) {
  const [pattern, setPattern] = useState("*");
  const [keys, setKeys] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminService.getRedisKeys(pattern);
      setKeys(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "查询失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerShell title="Redis Key 预览" onClose={onClose}>
      <div className={styles.formRow}>
        <input className={styles.formInput} value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Key pattern, e.g. auth:*" />
        <button className={`${styles.formBtn} ${styles.formBtnPrimary}`} onClick={handleFetch} disabled={loading}>
          {loading ? "查询中..." : "查询"}
        </button>
      </div>
      {error && <div className={`${styles.formResult} ${styles.formResultError}`}>{error}</div>}
      {keys && (
        <div className={styles.drawerSection} style={{ marginTop: 16 }}>
          <p className={styles.drawerSectionTitle}>结果 ({keys.length})</p>
          <div style={{ maxHeight: 400, overflow: "auto", background: "#fff", borderRadius: 8, padding: 12 }}>
            {keys.slice(0, 100).map((k) => (
              <div key={k} style={{ fontFamily: "monospace", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #f3f4f6" }}>{k}</div>
            ))}
            {keys.length > 100 && <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 6 }}>... 仅显示前 100 条</div>}
          </div>
        </div>
      )}
    </DrawerShell>
  );
}

/* ---- Cache Evict ---- */
function CacheEvictDrawer({ onClose }: { onClose: () => void }) {
  const [region, setRegion] = useState("");
  const [redisPattern, setRedisPattern] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEvict = async () => {
    if (!region && !redisPattern) return;
    setLoading(true);
    try {
      const msg = await adminService.evictCache({ region: region || undefined, redisPattern: redisPattern || undefined });
      setResult(msg);
    } catch (e) {
      setResult(`失败: ${e instanceof Error ? e.message : "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerShell title="清除缓存" onClose={onClose}>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>缓存区域</label>
        <input className={styles.formInput} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="例如: feed" />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Redis Pattern</label>
        <input className={styles.formInput} value={redisPattern} onChange={(e) => setRedisPattern(e.target.value)} placeholder="例如: feed:*" />
      </div>
      <button className={`${styles.formBtn} ${styles.formBtnDanger}`} onClick={handleEvict} disabled={loading}>
        {loading ? "执行中..." : "执行清除"}
      </button>
      {result && (
        <div className={`${styles.formResult} ${result.includes("失败") ? styles.formResultError : styles.formResultSuccess}`}>
          {result}
        </div>
      )}
    </DrawerShell>
  );
}

/* ---- RAG ---- */
function RagDrawer({ onClose }: { onClose: () => void }) {
  const [postId, setPostId] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReindexPublic = async () => {
    setLoading(true);
    try {
      const count = await adminService.reindexPublic();
      setResult(`已重建 ${count} 条公开内容索引`);
    } catch (e) {
      setResult(`失败: ${e instanceof Error ? e.message : "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReindexPost = async () => {
    if (!postId.trim()) return;
    setLoading(true);
    try {
      const count = await adminService.reindexPost(postId.trim());
      setResult(`已重建帖子 ${postId} 索引 (${count} 条)`);
    } catch (e) {
      setResult(`失败: ${e instanceof Error ? e.message : "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerShell title="RAG 索引重建" onClose={onClose}>
      <div className={styles.drawerSection}>
        <p className={styles.drawerSectionTitle}>全量重建</p>
        <button className={`${styles.formBtn} ${styles.formBtnDanger}`} onClick={handleReindexPublic} disabled={loading}>
          {loading ? "执行中..." : "重建全部公开内容索引"}
        </button>
      </div>
      <div className={styles.drawerSection}>
        <p className={styles.drawerSectionTitle}>单篇重建</p>
        <div className={styles.formRow}>
          <input className={styles.formInput} value={postId} onChange={(e) => setPostId(e.target.value)} placeholder="帖子 ID" />
          <button className={`${styles.formBtn} ${styles.formBtnPrimary}`} onClick={handleReindexPost} disabled={loading}>
            重建
          </button>
        </div>
      </div>
      {result && (
        <div className={`${styles.formResult} ${result.includes("失败") ? styles.formResultError : styles.formResultSuccess}`}>
          {result}
        </div>
      )}
    </DrawerShell>
  );
}
