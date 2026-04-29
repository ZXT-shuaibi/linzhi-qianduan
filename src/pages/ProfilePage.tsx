import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import { useAuth } from "@/context/AuthContext";
import styles from "./ProfilePage.module.css";
import feedStyles from "./HomePage.module.css";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import { knowpostService } from "@/services/knowpostService";
import RelationCounters from "@/components/common/RelationCounters";
import type { FeedItem } from "@/types/knowpost";

const ProfilePage = () => {
  const { user, tokens } = useAuth();
  const displayName = user?.nickname ?? user?.phone ?? user?.account ?? "邻知用户";
  const avatarInitial = displayName.trim().charAt(0) || "知";
  const tags = useMemo(() => user?.tags ?? user?.skills ?? [], [user?.skills, user?.tags]);

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadMine = async () => {
    if (!tokens?.accessToken) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await knowpostService.mine(1, 20, tokens.accessToken);
      setItems(response.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载我的内容失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reloadMine();
  }, [tokens?.accessToken]);

  return (
    <AppLayout
      header={(
        <MainHeader
          headline="我的主页"
          subtitle="展示你的资料、社交计数和已发布内容"
          rightSlot={<AuthStatus />}
        />
      )}
    >
      <>
        <SectionHeader
          title="个人信息"
          subtitle="资料信息直接读取 linli 的 /api/v1/profile/me"
          actions={<Link to="/profile/edit" className="ghost-button">编辑资料</Link>}
        />
        <div className={styles.profileGrid}>
          <div className={styles.avatarBox}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className={styles.avatarImg} />
            ) : (
              <span>{avatarInitial}</span>
            )}
          </div>
          <div className={styles.infoBox}>
            <div className={styles.nickname}>{displayName}</div>
            <div className={styles.tags}>
              {tags.length > 0 ? tags.map((tag) => <span key={tag}>#{tag}</span>) : <span>还没有设置标签</span>}
            </div>
            {user?.account ? <div className={styles.tags}>账号：{user.account}</div> : null}
          </div>
        </div>
        <div className={styles.bioBlock}>{user?.bio ?? "这个人很低调，还没有留下自我介绍。"}</div>

        {user?.id ? (
          <div style={{ marginTop: 8 }}>
            <RelationCounters userId={user.id} />
          </div>
        ) : null}

        <SectionHeader title="我的知识帖" subtitle="这里展示当前账号已发布的帖子" />
        {error ? <div style={{ color: "var(--color-danger)" }}>{error}</div> : null}
        {!user ? (
          <div style={{ color: "var(--color-text-muted)", padding: 12 }}>登录后可以查看你的个人主页和已发布内容</div>
        ) : (
          <div className={feedStyles.masonry}>
            {items.map((item) => (
              <div key={item.id} className={feedStyles.masonryItem}>
                <CourseCard
                  id={item.id}
                  title={item.title}
                  summary={item.description ?? ""}
                  tags={item.tags ?? []}
                  isTop={item.isTop}
                  teacher={{ name: item.authorNickname, avatarUrl: item.authorAvatar ?? item.authorAvator }}
                  coverImage={item.coverImage}
                  to={`/post/${item.id}`}
                  editable
                  onChanged={(action) => {
                    if (action === "delete") {
                      setItems((current) => current.filter((post) => post.id !== item.id));
                    } else {
                      void reloadMine();
                    }
                  }}
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
              <div className={feedStyles.masonryItem}>
                <div>正在加载内容...</div>
              </div>
            ) : null}
            {!loading && items.length === 0 ? (
              <div className={feedStyles.masonryItem}>
                <div>你还没有发布内容，去创作页试试吧。</div>
              </div>
            ) : null}
          </div>
        )}
      </>
    </AppLayout>
  );
};

export default ProfilePage;
