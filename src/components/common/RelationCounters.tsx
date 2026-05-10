import { useEffect, useState } from "react";
import styles from "./RelationCounters.module.css";
import { relationService } from "@/services/relationService";
import { useAuth } from "@/context/AuthContext";
import RelationListModal from "./RelationListModal";
import type { SocialCounters } from "@/types/profile";

type RelationCountersProps = {
  userId?: string;
  initialCounts?: SocialCounters | null;
  refreshKey?: number;
};

type CounterState = {
  followings: number;
  followers: number;
  posts: number;
  likedPosts: number;
  favedPosts: number;
};

const normalizeCounts = (counts?: Partial<CounterState> | null): CounterState | null => {
  if (!counts) return null;
  return {
    followings: counts.followings ?? 0,
    followers: counts.followers ?? 0,
    posts: counts.posts ?? 0,
    likedPosts: counts.likedPosts ?? 0,
    favedPosts: counts.favedPosts ?? 0
  };
};

const RelationCounters = ({ userId, initialCounts, refreshKey = 0 }: RelationCountersProps) => {
  const { tokens } = useAuth();
  const [counts, setCounts] = useState<CounterState | null>(() => normalizeCounts(initialCounts));
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"following" | "followers">("following");

  useEffect(() => {
    const nextCounts = normalizeCounts(initialCounts);
    if (nextCounts) {
      setCounts(nextCounts);
    }
  }, [
    initialCounts?.followings,
    initialCounts?.followers,
    initialCounts?.posts,
    initialCounts?.likedPosts,
    initialCounts?.favedPosts
  ]);

  useEffect(() => {
    const run = async () => {
      if (!userId) return;
      try {
        const next = await relationService.counters(userId, tokens?.accessToken);
        setCounts(next);
      } catch {
        // 计数拉取失败时不打断页面展示。
      }
    };
    void run();
  }, [userId, tokens?.accessToken, refreshKey]);

  if (!userId) return null;

  return (
    <>
      {counts ? (
        <div className={styles.wrapper}>
          <div className={`${styles.item} ${styles.clickable}`} onClick={() => { setMode("following"); setOpen(true); }}>
            <span className={styles.number}>{counts.followings}</span>
            <span className={styles.label}>关注</span>
          </div>
          <div className={`${styles.item} ${styles.clickable}`} onClick={() => { setMode("followers"); setOpen(true); }}>
            <span className={styles.number}>{counts.followers}</span>
            <span className={styles.label}>粉丝</span>
          </div>
          <div className={styles.item}>
            <span className={styles.number}>{counts.posts}</span>
            <span className={styles.label}>帖子</span>
          </div>
          <div className={styles.item}>
            <span className={styles.number}>{counts.likedPosts}</span>
            <span className={styles.label}>获赞</span>
          </div>
          <div className={styles.item}>
            <span className={styles.number}>{counts.favedPosts}</span>
            <span className={styles.label}>获收藏</span>
          </div>
        </div>
      ) : null}
      <RelationListModal open={open} onClose={() => setOpen(false)} userId={userId} mode={mode} />
    </>
  );
};

export default RelationCounters;
