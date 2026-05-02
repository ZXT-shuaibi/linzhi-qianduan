import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import CommunityTopNav from "@/components/layout/CommunityTopNav";
import { useAuth } from "@/context/AuthContext";
import { discoverService } from "@/services/discoverService";
import { knowpostService } from "@/services/knowpostService";
import type { DiscoverEntityType, DiscoverItem } from "@/types/discover";
import type { CounterResponse } from "@/types/knowpost";
import styles from "./DiscoverPage.module.css";

const DEFAULT_LOCATION = { lat: 31.2304, lng: 121.4737 };

const entityFilters: Array<{ value: DiscoverEntityType; label: string; hint: string }> = [
  { value: "mixed", label: "全部", hint: "帖子与商家" },
  { value: "post", label: "帖子", hint: "社区内容" },
  { value: "merchant", label: "商家", hint: "附近地点" }
];

const radiusFilters = [1000, 3000, 5000];

const formatDistance = (distance?: number | null) => {
  if (typeof distance !== "number") return "距离未知";
  if (distance < 1000) return `${Math.round(distance)}m`;
  return `${(distance / 1000).toFixed(1)}km`;
};

const formatTime = (value?: string | null) => {
  if (!value) return "时间未知";
  const numeric = Number(value);
  const date = Number.isNaN(numeric) ? new Date(value) : new Date(numeric > 1e12 ? numeric : numeric * 1000);
  if (Number.isNaN(date.getTime())) return "时间未知";
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
};

const DiscoverPage = () => {
  const { tokens } = useAuth();
  const [entityType, setEntityType] = useState<DiscoverEntityType>("mixed");
  const [radius, setRadius] = useState(3000);
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationLabel, setLocationLabel] = useState("上海社区");
  const [locationText, setLocationText] = useState("使用上海默认坐标，展示 3km 内的真实发现数据");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const loadNearby = useCallback(async (coords = location) => {
    setLoading(true);
    setError(null);
    try {
      const response = await discoverService.nearby({
        lat: coords.lat,
        lng: coords.lng,
        radius,
        entityType,
        size: 30,
        tag: activeTag ?? undefined
      });
      let nextItems = response.items ?? [];
      if (tokens?.accessToken && nextItems.length) {
        const postIds = nextItems.filter((item) => item.entityType === "post").map((item) => item.id);
        const merchantIds = nextItems.filter((item) => item.entityType === "merchant").map((item) => item.id);
        const [postCounters, merchantCounters] = await Promise.all([
          postIds.length
            ? knowpostService.countersBatch("post", postIds, tokens.accessToken)
            : Promise.resolve({} as Record<string, CounterResponse>),
          merchantIds.length
            ? knowpostService.countersBatch("merchant", merchantIds, tokens.accessToken)
            : Promise.resolve({} as Record<string, CounterResponse>)
        ]);
        nextItems = nextItems.map((item) => {
          const counters = item.entityType === "post" ? postCounters[item.id] : merchantCounters[item.id];
          return counters
            ? {
                ...item,
                likeCount: counters.counts.like,
                favoriteCount: counters.counts.fav,
                liked: counters.liked,
                faved: counters.faved
              }
            : item;
        });
      }
      setItems(nextItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载附近内容失败");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTag, entityType, location, radius, tokens?.accessToken]);

  useEffect(() => {
    void loadNearby(location);
  }, [loadNearby, location]);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationLabel("上海社区");
      setLocationText("当前浏览器不支持定位，已继续使用上海默认坐标");
      void loadNearby(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(next);
        setLocationLabel("我的附近");
        setLocationText(`已使用当前位置：${next.lat.toFixed(4)}, ${next.lng.toFixed(4)}`);
      },
      () => {
        setLocation(DEFAULT_LOCATION);
        setLocationLabel("上海社区");
        setLocationText("定位失败，已回退到上海默认坐标");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  };

  const postItems = useMemo(() => items.filter((item) => item.entityType === "post"), [items]);
  const merchantItems = useMemo(() => items.filter((item) => item.entityType === "merchant"), [items]);
  const topTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    items.forEach((item) => {
      item.tags.forEach((tag) => {
        const label = tag.replace(/^#/, "").trim();
        if (!label) return;
        tagMap.set(label, (tagMap.get(label) ?? 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [items]);

  return (
    <main className={styles.shell}>
      <CommunityTopNav locationLabel={locationLabel} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}><span aria-hidden="true">📍</span> LOCATION BASED DISCOVERY</span>
          <h1 className={styles.discoveryTitle}>
            重新<span>发现</span><br />
            让有趣的灵魂与宝藏小店<br />
            在地图上<em>相遇</em>
          </h1>
          <p className={styles.discoveryIntro}>
            基于 LBS 实时索引附近内容，把帖子、互助与小店整理成一张更有温度的社区地图。
          </p>
          <div className={styles.heroActions}>
            <button type="button" onClick={locateMe}><span aria-hidden="true">📍</span>使用我的位置</button>
            <Link to="/create"><span aria-hidden="true">🔔</span>发布附近动态</Link>
          </div>
        </div>

        <div className={styles.mapCard}>
          <div className={styles.mapHeader}>
            <span>附近索引</span>
            <strong>{items.length} 条结果</strong>
          </div>
          <div className={styles.mapRadar}>
            {items.slice(0, 8).map((item, index) => (
              <Link
                key={`${item.entityType}-${item.id}`}
                to={item.entityType === "post" ? `/post/${item.id}` : "/discover"}
                className={styles.mapPin}
                style={{
                  left: `${18 + ((index * 29) % 64)}%`,
                  top: `${20 + ((index * 37) % 58)}%`
                }}
                title={item.title}
              >
                {item.entityType === "post" ? "帖" : "店"}
              </Link>
            ))}
            <div className={styles.mapCenter}>你</div>
          </div>
          <p>{locationText}</p>
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.filterGroup}>
          {entityFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.filterButton} ${entityType === item.value ? styles.filterButtonActive : ""}`}
              onClick={() => setEntityType(item.value)}
            >
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          {radiusFilters.map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.radiusButton} ${radius === value ? styles.radiusButtonActive : ""}`}
              onClick={() => setRadius(value)}
            >
              {value / 1000}km
            </button>
          ))}
        </div>
      </section>

      <section className={styles.summaryStrip}>
        <div>
          <span>坐标</span>
          <strong>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</strong>
        </div>
        <div>
          <span>范围</span>
          <strong>{radius / 1000}km</strong>
        </div>
        <div>
          <span>帖子</span>
          <strong>{postItems.length}</strong>
        </div>
        <div>
          <span>商家</span>
          <strong>{merchantItems.length}</strong>
        </div>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? <div className={styles.loading}>正在读取附近真实数据...</div> : null}

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.sectionHeading}>
            <div>
              <span>Nearby Posts</span>
              <h2>附近帖子</h2>
            </div>
            <small>{postItems.length} 条</small>
          </div>

          <div className={styles.postGrid}>
            {postItems.map((item) => (
              <CourseCard
                key={item.id}
                id={item.id}
                title={item.title}
                summary={item.summary}
                tags={item.tags}
                teacher={{ name: item.authorName, avatarUrl: item.authorAvatar ?? undefined }}
                coverImage={item.coverUrl ?? undefined}
                to={`/post/${item.id}`}
                className={styles.postCard}
                footerExtra={(
                  <div className={styles.cardFooter}>
                    <span>{formatDistance(item.distance)} · {formatTime(item.publishTime)}</span>
                    <LikeFavBar
                      entityId={item.id}
                      entityType="post"
                      compact
                      initialCounts={{ like: item.likeCount, fav: item.favoriteCount }}
                      initialState={{ liked: item.liked, faved: item.faved }}
                    />
                  </div>
                )}
              />
            ))}
          </div>

          {!loading && !postItems.length ? (
            <div className={styles.empty}>当前筛选范围内暂无附近帖子，可以扩大半径或发布第一条动态。</div>
          ) : null}
        </div>

        <aside className={styles.sideColumn}>
          <div className={styles.topicPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <span>Local Tags</span>
                <h2>附近标签</h2>
              </div>
            </div>
            <div className={styles.tagCloud}>
              <button
                type="button"
                className={!activeTag ? styles.tagButtonActive : ""}
                onClick={() => setActiveTag(null)}
              >
                全部标签
              </button>
              {topTags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  className={activeTag === tag.label ? styles.tagButtonActive : ""}
                  onClick={() => setActiveTag((current) => (current === tag.label ? null : tag.label))}
                >
                  #{tag.label}
                  <span>{tag.count}</span>
                </button>
              ))}
              {!topTags.length ? <p>附近结果暂未返回标签。</p> : null}
            </div>
          </div>

          <div className={styles.merchantPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <span>Nearby Shops</span>
                <h2>附近商家</h2>
              </div>
              <small>{merchantItems.length} 家</small>
            </div>

            <div className={styles.merchantList}>
              {merchantItems.map((item) => (
                <article key={item.id} className={styles.merchantCard}>
                  {item.coverUrl ? <img src={item.coverUrl} alt={item.title} /> : <div className={styles.merchantFallback}>店</div>}
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.summary || item.address || "商家暂未提供简介"}</p>
                    <small>{formatDistance(item.distance)} · {item.address || "地址未提供"}</small>
                    <div className={styles.merchantFooter}>
                      <span>{item.tags.slice(0, 2).map((tag) => `#${tag.replace(/^#/, "")}`).join(" ") || "附近商家"}</span>
                      <LikeFavBar
                        entityId={item.id}
                        entityType="merchant"
                        compact
                        initialCounts={{ like: item.likeCount, fav: item.favoriteCount }}
                        initialState={{ liked: item.liked, faved: item.faved }}
                      />
                    </div>
                  </div>
                </article>
              ))}
              {!loading && !merchantItems.length ? <div className={styles.emptySmall}>当前范围暂无商家数据。</div> : null}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default DiscoverPage;
