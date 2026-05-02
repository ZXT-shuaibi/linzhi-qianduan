import { useEffect, useState } from "react";
import styles from "./RelationCounters.module.css";
import { relationService } from "@/services/relationService";
import { useAuth } from "@/context/AuthContext";
import RelationListModal from "./RelationListModal";

type RelationCountersProps = {
  userId?: string;
};

const RelationCounters = ({ userId }: RelationCountersProps) => {
  const { tokens } = useAuth();
  const [counts, setCounts] = useState<{
    followings: number;
    followers: number;
    posts: number;
    likedPosts: number;
    favedPosts: number;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"following" | "followers">("following");

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
  }, [userId, tokens?.accessToken]);

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
