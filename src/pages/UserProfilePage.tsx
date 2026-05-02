import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CourseCard from "@/components/cards/CourseCard";
import FollowButton from "@/components/common/FollowButton";
import LikeFavBar from "@/components/common/LikeFavBar";
import RelationCounters from "@/components/common/RelationCounters";
import CommunityTopNav from "@/components/layout/CommunityTopNav";
import { useAuth } from "@/context/AuthContext";
import { knowpostService } from "@/services/knowpostService";
import { profileService } from "@/services/profileService";
import type { FeedItem } from "@/types/knowpost";
import type { ProfileResponse } from "@/types/profile";
import styles from "./ProfilePage.module.css";

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { tokens } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relationRefreshKey, setRelationRefreshKey] = useState(0);

  const displayName = profile?.nickname ?? profile?.phone ?? profile?.account ?? "邻知用户";
  const avatarInitial = displayName.trim().charAt(0) || "知";
  const tags = useMemo(() => profile?.tags ?? profile?.skills ?? [], [profile?.skills, profile?.tags]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!id) {
        setError("用户 ID 缺失");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const accessToken = tokens?.accessToken ?? null;
        const [nextProfile, posts] = await Promise.all([
          profileService.user(id, accessToken),
          knowpostService.userPosts(id, 1, 20, accessToken)
        ]);
        if (cancelled) return;
        setProfile(nextProfile);
        setItems(posts.items ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载用户主页失败");
          setProfile(null);
          setItems([]);
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
  }, [id, tokens?.accessToken]);

  return (
    <main className={styles.shell}>
      <CommunityTopNav locationLabel={displayName} />

      {error ? <div className={styles.error}>{error}</div> : null}
      {loading && !profile ? <div className={styles.stateCard}>正在加载用户主页...</div> : null}

      {profile ? (
        <section className={styles.profileStage}>
          <aside className={styles.sidePanel}>
            <div className={styles.coverCard}>
              <div className={styles.coverGlow} />
              <div className={styles.avatarBox}>
                {profile.avatar ? <img src={profile.avatar} alt={displayName} /> : <span>{avatarInitial}</span>}
              </div>
              <h1>{displayName}</h1>
              <p>{profile.bio ?? "这个人很低调，还没有留下自我介绍。"}</p>
              {profile.self ? <Link to="/profile/edit">编辑资料</Link> : (
                <FollowButton
                  targetUserId={profile.userId}
                  initialStatus={profile.relationStatus}
                  onChanged={(result) => {
                    setProfile((current) => {
                      if (!current) return current;
                      const followedBy = current.relationStatus?.followedBy ?? false;
                      return {
                        ...current,
                        relationStatus: {
                          following: result.following,
                          followedBy,
                          mutual: result.following && followedBy
                        },
                        socialCounters: current.socialCounters
                          ? {
                              ...current.socialCounters,
                              followers: result.followerCount ?? current.socialCounters.followers
                            }
                          : current.socialCounters
                      };
                    });
                    setRelationRefreshKey((value) => value + 1);
                  }}
                />
              )}
            </div>

            <nav className={styles.profileMenu} aria-label="用户主页菜单">
              <a href="#posts">TA 的内容</a>
              <a href="#profile-data">资料接口</a>
              {profile.self ? <Link to="/create">发布动态</Link> : null}
            </nav>

            <div id="profile-data" className={styles.apiPanel}>
              <span>真实接口</span>
              <strong>/api/v1/profile/users/{profile.userId}</strong>
              <strong>/api/v1/profile/users/{profile.userId}/posts</strong>
              <strong>/api/v1/social/counters/users/{profile.userId}</strong>
            </div>
          </aside>

          <section className={styles.mainPanel}>
            <div className={styles.profileHero}>
              <div>
                <span>User Space</span>
                <h2>{profile.self ? "我的主页" : "TA 的主页"}</h2>
                <p>资料、社交计数、关系状态和已发布内容均来自 linli 后端真实接口。</p>
              </div>
              <div className={styles.accountPill}>
                <span>用户 ID</span>
                <strong>{profile.userId}</strong>
              </div>
            </div>

            <div className={styles.tagRow}>
              {tags.length > 0 ? tags.map((tag) => <span key={tag}>#{tag}</span>) : <span>还没有设置标签</span>}
            </div>

            <RelationCounters
              userId={profile.userId}
              initialCounts={profile.socialCounters}
              refreshKey={relationRefreshKey}
            />

            <div id="posts" className={styles.sectionHeading}>
              <div>
                <span>Posts</span>
                <h2>{profile.self ? "我的内容" : "TA 的内容"}</h2>
              </div>
              {profile.self ? <Link to="/create">继续创作</Link> : null}
            </div>

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
                  className={styles.postCard}
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
            {!loading && items.length === 0 ? <div className={styles.stateCard}>暂时还没有可展示的内容。</div> : null}
          </section>
        </section>
      ) : null}
    </main>
  );
};

export default UserProfilePage;
