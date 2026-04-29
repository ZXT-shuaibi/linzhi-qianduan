import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import AuthStatus from "@/features/auth/AuthStatus";
import { discoverService } from "@/services/discoverService";
import type { DiscoverEntityType, DiscoverItem } from "@/types/discover";
import styles from "./DiscoverPage.module.css";
import feedStyles from "./HomePage.module.css";

const DEFAULT_LOCATION = { lat: 31.2304, lng: 121.4737 };

const formatDistance = (distance?: number | null) => {
  if (typeof distance !== "number") return "距离未知";
  if (distance < 1000) return `${Math.round(distance)}m`;
  return `${(distance / 1000).toFixed(1)}km`;
};

const DiscoverPage = () => {
  const [entityType, setEntityType] = useState<DiscoverEntityType>("mixed");
  const [radius, setRadius] = useState(3000);
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationText, setLocationText] = useState("使用默认坐标（上海）");

  const postItems = useMemo(() => items.filter((item) => item.entityType === "post"), [items]);
  const merchantItems = useMemo(() => items.filter((item) => item.entityType === "merchant"), [items]);

  const loadNearby = async (coords = location) => {
    setLoading(true);
    setError(null);
    try {
      const response = await discoverService.nearby({
        lat: coords.lat,
        lng: coords.lng,
        radius,
        entityType
      });
      setItems(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载附近内容失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNearby(location);
  }, [entityType, radius]);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationText("当前浏览器不支持定位，已回退到默认坐标");
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
        setLocationText(`当前位置：${next.lat.toFixed(4)}, ${next.lng.toFixed(4)}`);
        void loadNearby(next);
      },
      () => {
        setLocationText("定位失败，已回退到默认坐标");
        void loadNearby(DEFAULT_LOCATION);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  };

  return (
    <AppLayout
      header={(
        <MainHeader
          headline="附近发现"
          subtitle="接入 linli 的 LBS 发现接口，支持帖子与商家混合探索"
          rightSlot={<AuthStatus />}
        />
      )}
    >
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {[
            { value: "mixed", label: "混合" },
            { value: "post", label: "帖子" },
            { value: "merchant", label: "商家" }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.filterButton} ${entityType === item.value ? styles.filterButtonActive : ""}`}
              onClick={() => setEntityType(item.value as DiscoverEntityType)}
            >
              {item.label}
            </button>
          ))}
          {[1000, 3000, 5000].map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterButton} ${radius === value ? styles.filterButtonActive : ""}`}
              onClick={() => setRadius(value)}
            >
              {value / 1000}km
            </button>
          ))}
        </div>
        <button type="button" className="ghost-button" onClick={locateMe}>使用我的位置</button>
      </div>

      <div className={styles.locationCard}>
        <strong>定位状态</strong>
        <span>{locationText}</span>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? <div className={styles.loading}>正在加载附近内容...</div> : null}

      {postItems.length > 0 ? (
        <>
          <SectionHeader title="附近帖子" subtitle="帖子卡片直接复用现有知识内容组件" />
          <div className={feedStyles.masonry}>
            {postItems.map((item) => (
              <div key={item.id} className={feedStyles.masonryItem}>
                <CourseCard
                  id={item.id}
                  title={item.title}
                  summary={item.summary}
                  tags={item.tags}
                  teacher={{ name: item.authorName, avatarUrl: item.authorAvatar ?? undefined }}
                  coverImage={item.coverUrl ?? undefined}
                  to={`/post/${item.id}`}
                  footerExtra={(
                    <div className={styles.cardFooter}>
                      <span>{formatDistance(item.distance)}</span>
                      <LikeFavBar
                        entityId={item.id}
                        entityType="post"
                        compact
                        initialCounts={{ like: item.likeCount, fav: item.favoriteCount }}
                      />
                    </div>
                  )}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {merchantItems.length > 0 ? (
        <>
          <SectionHeader title="附近商家" subtitle="商家条目使用 linli Discover 接口中的 merchant 数据" />
          <div className={styles.merchantGrid}>
            {merchantItems.map((item) => (
              <article key={item.id} className={styles.merchantCard}>
                {item.coverUrl ? <img src={item.coverUrl} alt={item.title} className={styles.merchantCover} /> : null}
                <div className={styles.merchantBody}>
                  <div className={styles.merchantMeta}>
                    <h3>{item.title}</h3>
                    <span>{formatDistance(item.distance)}</span>
                  </div>
                  <p>{item.summary || item.address || "暂无商家简介"}</p>
                  <div className={styles.address}>{item.address ?? "未提供地址"}</div>
                  <div className={styles.tagRow}>
                    {item.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                  </div>
                  <div className={styles.cardFooter}>
                    <span>{item.authorName}</span>
                    <LikeFavBar
                      entityId={item.id}
                      entityType="merchant"
                      compact
                      initialCounts={{ like: item.likeCount, fav: item.favoriteCount }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className={styles.empty}>当前范围内还没有发现内容，可以切换半径或重新定位。</div>
      ) : null}
    </AppLayout>
  );
};

export default DiscoverPage;
