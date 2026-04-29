import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import { knowpostService } from "@/services/knowpostService";
import AuthStatus from "@/features/auth/AuthStatus";
import type { FeedItem } from "@/types/knowpost";
import styles from "./HomePage.module.css";

const HomePage = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheLayer, setCacheLayer] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await knowpostService.homeFeed(1, 20);
        if (!cancelled) {
          setItems(response.items ?? []);
          setCacheLayer(response.cacheLayer ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载首页内容失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout
      header={(
        <MainHeader
          headline="邻知首页"
          subtitle={cacheLayer ? `首页智能 Feed 已接入，当前命中层：${cacheLayer}` : "基于 linli 真实接口拉取首页知识流"}
          rightSlot={<AuthStatus />}
        />
      )}
    >
      {error ? <div>{error}</div> : null}
      <div className={styles.masonry}>
        {items.map((item) => (
          <div key={item.id} className={styles.masonryItem}>
            <CourseCard
              id={item.id}
              title={item.title}
              summary={item.description ?? ""}
              tags={item.tags ?? []}
              teacher={{ name: item.authorNickname, avatarUrl: item.authorAvatar ?? item.authorAvator }}
              coverImage={item.coverImage}
              to={`/post/${item.id}`}
              isTop={item.isTop}
              footerExtra={(
                <LikeFavBar
                  entityId={item.id}
                  compact
                  initialCounts={{ like: item.likeCount ?? 0, fav: item.favoriteCount ?? 0 }}
                  initialState={{ liked: item.liked, faved: item.faved }}
                />
              )}
            />
          </div>
        ))}
        {loading ? (
          <div className={styles.masonryItem}>
            <div>正在加载首页内容...</div>
          </div>
        ) : null}
        {!loading && items.length === 0 ? (
          <div className={styles.masonryItem}>
            <div>暂时还没有可展示的内容</div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};

export default HomePage;
