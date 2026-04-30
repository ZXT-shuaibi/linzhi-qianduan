import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LikeFavBar from "@/components/common/LikeFavBar";
import CommunityTopNav from "@/components/layout/CommunityTopNav";
import { discoverService } from "@/services/discoverService";
import { knowpostService } from "@/services/knowpostService";
import type { DiscoverItem } from "@/types/discover";
import type { FeedItem } from "@/types/knowpost";
import styles from "./HomePage.module.css";

const DEFAULT_LOCATION = { lat: 31.2304, lng: 121.4737 };

const formatDistance = (distance?: number | null) => {
  if (typeof distance !== "number") return "距离未知";
  if (distance < 1000) return `${Math.round(distance)}m`;
  return `${(distance / 1000).toFixed(1)}km`;
};

const formatNumber = (value: number) => {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
};

const getInitial = (name?: string | null) => name?.trim().charAt(0) || "邻";

const HomePage = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nearbyItems, setNearbyItems] = useState<DiscoverItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [cacheLayer, setCacheLayer] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState("上海社区");
  const [locationText, setLocationText] = useState("使用上海默认坐标，可点击定位刷新附近内容");

  const loadFeed = useCallback(async (coords = DEFAULT_LOCATION) => {
    setFeedLoading(true);
    setError(null);
    try {
      const response = await knowpostService.homeFeed(1, 20, {
        lat: coords.lat,
        lng: coords.lng
      });
      setItems(response.items ?? []);
      setCacheLayer(response.cacheLayer ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载首页内容失败");
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const loadNearby = useCallback(async (coords = DEFAULT_LOCATION) => {
    setNearbyLoading(true);
    setNearbyError(null);
    try {
      const response = await discoverService.nearby({
        lat: coords.lat,
        lng: coords.lng,
        radius: 3000,
        entityType: "mixed",
        size: 8
      });
      setNearbyItems(response.items ?? []);
    } catch (err) {
      setNearbyError(err instanceof Error ? err.message : "加载附近内容失败");
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed(DEFAULT_LOCATION);
    void loadNearby(DEFAULT_LOCATION);
  }, [loadFeed, loadNearby]);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationText("当前浏览器不支持定位，已继续使用上海默认坐标");
      void loadFeed(DEFAULT_LOCATION);
      void loadNearby(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocationLabel("我的附近");
        setLocationText(`已使用当前位置：${next.lat.toFixed(4)}, ${next.lng.toFixed(4)}`);
        void loadFeed(next);
        void loadNearby(next);
      },
      () => {
        setLocationLabel("上海社区");
        setLocationText("定位失败，已回退到上海默认坐标");
        void loadFeed(DEFAULT_LOCATION);
        void loadNearby(DEFAULT_LOCATION);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  };

  const topicStats = useMemo(() => {
    const topicMap = new Map<string, number>();
    items.forEach((item) => {
      item.tags.forEach((tag) => {
        const label = tag.replace(/^#/, "").trim();
        if (!label) return;
        topicMap.set(label, (topicMap.get(label) ?? 0) + 1);
      });
    });

    return Array.from(topicMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [items]);

  const communityStats = useMemo(() => {
    const likeTotal = items.reduce((sum, item) => sum + (item.likeCount ?? 0), 0);
    const favoriteTotal = items.reduce((sum, item) => sum + (item.favoriteCount ?? 0), 0);
    const interactionTotal = likeTotal + favoriteTotal;
    return [
      { label: "真实 Feed", value: formatNumber(items.length) },
      { label: "附近索引", value: formatNumber(nearbyItems.length) },
      { label: "互动热度", value: formatNumber(interactionTotal) }
    ];
  }, [items, nearbyItems.length]);

  const briefLines = useMemo(() => {
    if (!items.length) {
      return ["等待真实 Feed 返回后生成社区简报", "当前没有调用独立简报接口，避免展示虚构内容"];
    }

    const topTopic = topicStats[0]?.label;
    const hottest = [...items].sort((a, b) => {
      const aScore = (a.likeCount ?? 0) + (a.favoriteCount ?? 0);
      const bScore = (b.likeCount ?? 0) + (b.favoriteCount ?? 0);
      return bScore - aScore;
    })[0];

    return [
      `已读取 ${items.length} 条首页真实内容，缓存层：${cacheLayer ?? "未返回"}`,
      topTopic ? `高频话题集中在 #${topTopic}` : "当前标签分布较分散，暂未形成明显热点",
      hottest ? `互动最高内容：${hottest.title}` : "暂无可统计的互动内容"
    ];
  }, [cacheLayer, items, topicStats]);

  const liveFeedItems = items.slice(0, 5);
  const neighborhoodItems = items.slice(0, 4);
  const visibleNearbyItems = nearbyItems.slice(0, 4);

  return (
    <main className={styles.shell}>
      <CommunityTopNav locationLabel={locationLabel} />

      <section className={styles.bentoGrid} aria-label="邻里知光首页仪表盘">
        <section className={`${styles.bentoCard} ${styles.heroCard}`}>
          <div className={styles.heroTopline}>
            <span className={styles.eyebrow}>COMMUNITY DASHBOARD</span>
            <span className={styles.heroStatus}>实时聚合</span>
          </div>
          <h1 className={styles.heroHeadline}>
            今天附近，<span>有新鲜事。</span>
          </h1>
          <p className={styles.heroDescription}>
            聚合真实 Feed 与 LBS 附近索引，把闲置、互助和讨论整理成一张更清爽的社区首页。
          </p>
          <div className={styles.heroBriefs}>
            <div>
              <span>今日关注</span>
              <strong>{topicStats[0]?.label ? `#${topicStats[0].label}` : "等待社区动态"}</strong>
            </div>
            <div>
              <span>当前位置</span>
              <strong>{locationLabel}</strong>
            </div>
          </div>
          <div className={styles.heroActions}>
            <Link to="/create" className={styles.primaryAction}>发布一条动态</Link>
            <button type="button" className={styles.secondaryAction} onClick={locateMe}>使用我的位置</button>
          </div>
          <div className={styles.statsRow}>
            {communityStats.map((item) => (
              <div key={item.label} className={styles.statCard}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={`${styles.bentoCard} ${styles.liveFeedCard}`}>
          <div className={styles.cardHeader}>
            <span>Community Pulse</span>
            <strong>{cacheLayer ? `缓存命中：${cacheLayer}` : "实时 FEED"}</strong>
          </div>
          <div className={styles.liveFeedBody}>
            {liveFeedItems.map((item, index) => (
              <Link key={item.id} to={`/post/${item.id}`} className={`${styles.liveTile} ${index === 0 ? styles.liveTileLarge : ""}`}>
                <span>{getInitial(item.authorNickname)}</span>
                <strong>{item.title}</strong>
                <small>{item.tags.slice(0, 2).map((tag) => `#${tag.replace(/^#/, "")}`).join(" ") || "邻里动态"}</small>
              </Link>
            ))}
            {!feedLoading && !liveFeedItems.length ? (
              <div className={styles.emptyBlueprint}>Feed 返回内容后，这里会生成动态社区卡片阵列</div>
            ) : null}
            {feedLoading ? <div className={styles.emptyBlueprint}>正在加载实时 Feed...</div> : null}
          </div>
        </section>

        <section className={`${styles.bentoCard} ${styles.radarCard}`}>
          <div className={styles.cardTitleRow}>
            <h2>附近雷达</h2>
            <button type="button" onClick={locateMe}>重新定位</button>
          </div>
          <div className={styles.radar}>
            <span className={styles.radarDot} />
            <span className={styles.radarDot} />
            <span className={styles.radarDot} />
          </div>
          <p className={styles.locationText}>{locationText}</p>
          {nearbyError ? <div className={styles.inlineError}>{nearbyError}</div> : null}
          {nearbyLoading ? <div className={styles.stateLine}>正在加载附近内容...</div> : null}
        </section>

        <section className={`${styles.bentoCard} ${styles.feedCard}`}>
          {error ? <div className={styles.errorPill}>请求失败：{error}</div> : null}
          <div className={styles.feedHeader}>
            <div>
              <span>Neighborhood Feed</span>
              <h2>附近正在发生什么</h2>
            </div>
            <Link to="/discover">查看附近</Link>
          </div>
          <div className={styles.feedTiles}>
            {neighborhoodItems.map((item) => (
              <article key={item.id} className={styles.feedTile}>
                <Link to={`/post/${item.id}`} className={styles.feedTileMain}>
                  <span>{getInitial(item.authorNickname)}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description || "这条内容暂未填写摘要，进入详情可查看完整信息。"}</p>
                    <small>{formatDistance(item.distanceMeters)}</small>
                  </div>
                </Link>
                <LikeFavBar
                  entityId={item.id}
                  compact
                  initialCounts={{ like: item.likeCount ?? 0, fav: item.favoriteCount ?? 0 }}
                  initialState={{ liked: item.liked, faved: item.faved }}
                />
              </article>
            ))}
            {!feedLoading && !neighborhoodItems.length ? (
              <div className={styles.emptyFeed}>暂时还没有可展示的真实 Feed 内容</div>
            ) : null}
            {feedLoading ? <div className={styles.emptyFeed}>正在加载首页内容...</div> : null}
          </div>
          <div className={styles.topicStrip}>
            {topicStats.map((topic) => (
              <Link key={topic.label} to={`/search?q=${encodeURIComponent(topic.label)}`}>
                #{topic.label}<span>{topic.count}</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className={`${styles.bentoCard} ${styles.aiCard}`}>
          <div className={styles.aiOrb}>AI</div>
          <span>邻里 AI 简报</span>
          <h2>先基于真实 Feed 本地归纳</h2>
          <p>当前后端没有独立简报接口，因此这里不会伪造接口结果；后续可接入 RAG 流式问答增强。</p>
          <ul>
            {briefLines.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <Link to="/search">去搜索页提问</Link>
        </aside>

        <section className={`${styles.bentoCard} ${styles.nearbyStrip}`}>
          <span>Nearby Index</span>
          <div>
            {visibleNearbyItems.map((item) => (
              <Link key={`${item.entityType}-${item.id}`} to={item.entityType === "post" ? `/post/${item.id}` : "/discover"}>
                <strong>{item.title}</strong>
                <small>{formatDistance(item.distance)} · {item.address || item.authorName}</small>
              </Link>
            ))}
            {!nearbyLoading && !visibleNearbyItems.length ? <small>当前范围暂无附近内容</small> : null}
          </div>
        </section>
      </section>
    </main>
  );
};

export default HomePage;
