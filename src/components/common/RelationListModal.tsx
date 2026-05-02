import { useEffect, useMemo, useState } from "react";
import styles from "./RelationListModal.module.css";
import { relationService } from "@/services/relationService";
import { useAuth } from "@/context/AuthContext";
import type { ProfileResponse } from "@/types/profile";

type Mode = "following" | "followers";

type RelationListModalProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
  mode: Mode;
};

const initialLimit = 20;

const initialChar = (name?: string, id?: string) =>
  (name?.trim().charAt(0).toUpperCase() || String(id ?? "").trim().charAt(0).toUpperCase() || "?");

const RelationListModal = ({ open, onClose, userId, mode }: RelationListModalProps) => {
  const title = useMemo(() => (mode === "following" ? "关注列表" : "粉丝列表"), [mode]);
  const { tokens } = useAuth();
  const [profiles, setProfiles] = useState<ProfileResponse[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = mode === "following"
          ? await relationService.following(userId, initialLimit, 1, undefined, tokens?.accessToken)
          : await relationService.followers(userId, initialLimit, 1, undefined, tokens?.accessToken);
        if (cancelled) return;

        const list = response.items;
        setProfiles(list);
        setPage(response.page);
        setHasMore(response.hasMore);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "加载失败");
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
  }, [initialLimit, open, userId, mode, tokens?.accessToken]);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const response = mode === "following"
        ? await relationService.following(userId, initialLimit, nextPage, undefined, tokens?.accessToken)
        : await relationService.followers(userId, initialLimit, nextPage, undefined, tokens?.accessToken);
      const list = response.items;
      setProfiles((current) => [...current, ...list]);
      setPage(response.page);
      setHasMore(response.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles._overlay_1q1ln_1} onClick={onClose}>
      <div className={styles._modal_1q1ln_12} onClick={(e) => e.stopPropagation()}>
        <div className={styles._header_1q1ln_24}>
          <span className={styles._title_1q1ln_32}>{title}</span>
          <button className={styles._close_1q1ln_38} onClick={onClose}>关闭</button>
        </div>
        <div className={styles._body_1q1ln_46}>
          {error ? <div className={styles._error_1q1ln_106}>{error}</div> : null}
          {profiles.length === 0 && !loading ? (
            <div className={styles._empty_1q1ln_101}>暂无数据</div>
          ) : (
            <div className={styles._list_1q1ln_52}>
              {profiles.map((profile) => (
                <div key={profile.id} className={styles._item_1q1ln_59}>
                  {profile.avatar ? (
                    <img className={styles._avatar_1q1ln_69} src={profile.avatar} alt={profile.nickname} />
                  ) : (
                    <div className={styles._avatar_1q1ln_69}>{initialChar(profile.nickname, profile.id)}</div>
                  )}
                  <div className={styles._name_1q1ln_80}>{profile.nickname || "邻知用户"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles._footer_1q1ln_85}>
          <button className={styles._more_1q1ln_93} onClick={loadMore} disabled={!hasMore || loading}>
            {loading ? "加载中..." : hasMore ? "加载更多" : "没有更多了"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelationListModal;
