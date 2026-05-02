import { useEffect, useState } from "react";
import { relationService } from "@/services/relationService";
import { useAuth } from "@/context/AuthContext";
import styles from "./FollowButton.module.css";

type FollowButtonProps = {
  targetUserId?: string;
  compact?: boolean;
};

const FollowButton = ({ targetUserId, compact }: FollowButtonProps) => {
  const { tokens } = useAuth();
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [mutual, setMutual] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!targetUserId || !tokens?.accessToken) return;
      try {
        const status = await relationService.status(targetUserId, tokens.accessToken);
        setFollowing(status.following);
        setMutual(status.mutual);
      } catch {
        // 状态拉取失败时静默处理。
      }
    };
    void run();
  }, [targetUserId, tokens?.accessToken]);

  if (!targetUserId || !tokens?.accessToken) {
    return null;
  }

  const onClick = async () => {
    setLoading(true);
    try {
      if (following) {
        await relationService.unfollow(targetUserId, tokens.accessToken);
        setFollowing(false);
        setMutual(false);
      } else {
        await relationService.follow(targetUserId, tokens.accessToken);
        setFollowing(true);
        try {
          const status = await relationService.status(targetUserId, tokens.accessToken);
          setMutual(status.mutual);
        } catch {
          // 互关状态拉取失败时保持当前展示。
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const className = `${styles.btn} ${following ? styles.following : ""} ${compact ? styles.compact ?? "" : ""}`.trim();
  const label = following ? "已关注" : "关注";

  return (
    <button type="button" className={className} onClick={onClick} disabled={loading} aria-pressed={following}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {following ? <path d="M20 6L9 17l-5-5" /> : <path d="M12 5v14M5 12h14" />}
      </svg>
      {label}
      {mutual ? <span className={styles.mutualBadge}>互关</span> : null}
    </button>
  );
};

export default FollowButton;
