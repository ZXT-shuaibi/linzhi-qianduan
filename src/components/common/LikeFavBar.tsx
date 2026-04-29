import { useEffect, useState, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { knowpostService } from "@/services/knowpostService";
import { HeartIcon, BookmarkIcon } from "@/components/icons/Icon";
import styles from "./LikeFavBar.module.css";

type LikeFavBarProps = {
  entityId: string;
  entityType?: string;
  initialCounts?: { like: number; fav: number };
  initialState?: { liked?: boolean; faved?: boolean };
  fetchCounts?: boolean;
  compact?: boolean;
  className?: string;
};

const LikeFavBar = ({
  entityId,
  entityType = "post",
  initialCounts,
  initialState,
  fetchCounts = false,
  compact = false,
  className
}: LikeFavBarProps) => {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const iconSize = compact ? 18 : 20;

  const [likeCount, setLikeCount] = useState<number>(initialCounts?.like ?? 0);
  const [favCount, setFavCount] = useState<number>(initialCounts?.fav ?? 0);
  const [liked, setLiked] = useState<boolean>(initialState?.liked ?? false);
  const [faved, setFaved] = useState<boolean>(initialState?.faved ?? false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!fetchCounts || !tokens?.accessToken) return;
      try {
        const response = await knowpostService.counters(entityId, tokens.accessToken, entityType);
        if (!cancelled) {
          setLikeCount(response.counts?.like ?? 0);
          setFavCount(response.counts?.fav ?? 0);
        }
      } catch {
        // 计数拉取失败时保留初始值。
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [entityId, entityType, tokens?.accessToken, fetchCounts]);

  useEffect(() => {
    if (typeof initialState?.liked !== "undefined") {
      setLiked(Boolean(initialState.liked));
    }
    if (typeof initialState?.faved !== "undefined") {
      setFaved(Boolean(initialState.faved));
    }
  }, [initialState?.liked, initialState?.faved]);

  const mustLogin = () => {
    navigate("/login", {
      state: { from: location.pathname + location.search + location.hash }
    });
  };

  const onLikeClick = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!tokens?.accessToken) {
      mustLogin();
      return;
    }
    if (loadingLike) return;

    setLoadingLike(true);
    try {
      if (!liked) {
        const response = await knowpostService.like(entityId, tokens.accessToken, entityType);
        setLiked(response.liked);
        if (response.changed && response.liked) {
          setLikeCount((count) => count + 1);
        }
      } else {
        const response = await knowpostService.unlike(entityId, tokens.accessToken, entityType);
        setLiked(response.liked);
        if (response.changed && !response.liked) {
          setLikeCount((count) => Math.max(0, count - 1));
        }
      }
    } finally {
      setLoadingLike(false);
    }
  };

  const onFavClick = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!tokens?.accessToken) {
      mustLogin();
      return;
    }
    if (loadingFav) return;

    setLoadingFav(true);
    try {
      if (!faved) {
        const response = await knowpostService.fav(entityId, tokens.accessToken, entityType);
        setFaved(response.faved);
        if (response.changed && response.faved) {
          setFavCount((count) => count + 1);
        }
      } else {
        const response = await knowpostService.unfav(entityId, tokens.accessToken, entityType);
        setFaved(response.faved);
        if (response.changed && !response.faved) {
          setFavCount((count) => Math.max(0, count - 1));
        }
      }
    } finally {
      setLoadingFav(false);
    }
  };

  return (
    <div className={`${styles._bar} ${compact ? styles.compact : ""} ${className ?? ""}`.trim()}>
      <button
        type="button"
        className={`${styles.btn} ${liked ? styles.liked : ""} ${loadingLike ? styles.disabled : ""}`}
        onClick={onLikeClick}
        aria-pressed={liked}
        aria-label={liked ? "取消点赞" : "点赞"}
      >
        <HeartIcon width={iconSize} height={iconSize} />
        <span className={styles.count}>{likeCount}</span>
      </button>
      <button
        type="button"
        className={`${styles.btn} ${faved ? styles.faved : ""} ${loadingFav ? styles.disabled : ""}`}
        onClick={onFavClick}
        aria-pressed={faved}
        aria-label={faved ? "取消收藏" : "收藏"}
      >
        <BookmarkIcon width={iconSize} height={iconSize} />
        <span className={styles.count}>{favCount}</span>
      </button>
    </div>
  );
};

export default LikeFavBar;
