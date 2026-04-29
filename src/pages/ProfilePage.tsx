import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import RelationCounters from "@/components/common/RelationCounters";
import CommunityTopNav from "@/components/layout/CommunityTopNav";
import { useAuth } from "@/context/AuthContext";
import { knowpostService } from "@/services/knowpostService";
import type { FeedItem } from "@/types/knowpost";
import styles from "./ProfilePage.module.css";

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
    <main className={styles.shell}>
      <CommunityTopNav locationLabel="个人中心" />

      {!user ? (
        <section className={styles.loginCard}>
          <span>Profile</span>
          <h1>登录后查看你的个人主页。</h1>
          <p>个人资料、关注关系和已发布内容都来自 `linli` 真实接口。</p>
          <Link to="/login">去登录</Link>
        </section>
      ) : (
        <section className={styles.profileStage}>
          <aside className={styles.sidePanel}>
            <div className={styles.coverCard}>
              <div className={styles.coverGlow} />
              <div className={styles.avatarBox}>
                {user.avatar ? <img src={user.avatar} alt={displayName} /> : <span>{avatarInitial}</span>}
              </div>
              <h1>{displayName}</h1>
              <p>{user.bio ?? "这个人很低调，还没有留下自我介绍。"}</p>
              <Link to="/profile/edit">编辑资料</Link>
            </div>

            <nav className={styles.profileMenu} aria-label="个人中心菜单">
              <a href="#posts">我的内容</a>
              <a href="#profile-data">资料接口</a>
              <Link to="/create">发布动态</Link>
              <Link to="/learn">学习记录</Link>
            </nav>

            <div id="profile-data" className={styles.apiPanel}>
              <span>真实接口</span>
              <strong>/api/v1/profile/me</strong>
              <strong>/api/v1/social/counters/users/{user.id}</strong>
              <strong>/api/v1/posts/mine</strong>
            </div>
          </aside>

          <section className={styles.mainPanel}>
            <div className={styles.profileHero}>
              <div>
                <span>Personal Space</span>
                <h2>我的主页</h2>
                <p>资料、社交计数和已发布帖子都从后端读取；帖子卡片支持置顶、可见性和删除操作。</p>
              </div>
              <div className={styles.accountPill}>
                <span>账号</span>
                <strong>{user.account ?? user.phone ?? user.userId}</strong>
              </div>
            </div>

            <div className={styles.tagRow}>
              {tags.length > 0 ? tags.map((tag) => <span key={tag}>#{tag}</span>) : <span>还没有设置标签</span>}
            </div>

            {user.id ? <RelationCounters userId={user.id} /> : null}

            <div id="posts" className={styles.sectionHeading}>
              <div>
                <span>My Posts</span>
                <h2>我的知识帖</h2>
              </div>
              <Link to="/create">继续创作</Link>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <div className={styles.postGrid}>
              {items.map((item) => (
                <CourseCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  summary={item.description ?? ""}
                  tags={item.tags ?? []}
                  isTop={item.isTop}
                  teacher={{ name: item.authorNickname, avatarUrl: item.authorAvatar ?? item.authorAvator }}
                  coverImage={item.coverImage}
                  to={`/post/${item.id}`}
                  editable
                  className={styles.postCard}
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
              ))}
            </div>

            {loading ? <div className={styles.stateCard}>正在加载内容...</div> : null}
            {!loading && items.length === 0 ? <div className={styles.stateCard}>你还没有发布内容，去创作页试试吧。</div> : null}
          </section>
        </section>
      )}
    </main>
  );
};

export default ProfilePage;
