import { useEffect, useState } from "react";
import { todoApi } from "../services/todoApi";
import type { FeedPost, FollowingUser, ProfileBundle, ProfileDraft } from "../types/app";

type TabKey = "info" | "posts" | "collections" | "likes" | "following";

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: "info", label: "个人信息" },
  { id: "posts", label: "我的发布" },
  { id: "collections", label: "我的收藏" },
  { id: "likes", label: "我点过赞" },
  { id: "following", label: "我关注的人" }
];

function renderPostList(posts: FeedPost[], empty: string) {
  if (!posts.length) {
    return <div className="section-card">{empty}</div>;
  }

  return (
    <div className="list-stack">
      {posts.map((post) => (
        <article key={post.id} className="list-card">
          <div className="list-card-body">
            <span className={`tone-pill tone-${post.categoryTone}`}>{post.category}</span>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
          </div>
          <div className="list-card-meta">
            <strong>{post.likes}</strong>
            <span>点赞</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function renderFollowingList(users: FollowingUser[]) {
  return (
    <div className="list-stack">
      {users.map((user) => (
        <article key={user.id} className="list-card">
          <div className="author-row">
            <div className="avatar-badge">{user.avatar}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.bio}</span>
            </div>
          </div>
          <span className="chip chip-soft">{user.badge}</span>
        </article>
      ))}
    </div>
  );
}

function ProfilePage() {
  const [bundle, setBundle] = useState<ProfileBundle | null>(null);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [tab, setTab] = useState<TabKey>("info");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("资料保存接口已预留，当前先做前端交互。");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const result = await todoApi.getProfile();
      if (!cancelled) {
        setBundle(result);
        setDraft(result.draft);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!bundle || !draft) {
    return <div className="section-card">正在加载个人主页...</div>;
  }

  const handleSave = async () => {
    const result = await todoApi.updateProfile(draft);
    if (result.ok) {
      setBundle((current) => (current ? { ...current, draft: result.data } : current));
      setEditing(false);
      setMessage("前端已完成保存流转，后面把 updateProfile 接口替换掉即可。");
    }
  };

  return (
    <section className="profile-layout">
      <div className="profile-hero">
        <div className="profile-cover" style={{ backgroundImage: `url(${bundle.coverImage})` }} />
        <div className="profile-summary">
          <div className="profile-avatar">{bundle.avatarLabel}</div>
          <div className="profile-titles">
            <h2>{bundle.draft.name}</h2>
            <span className="chip chip-soft">{bundle.draft.badge}</span>
            <p>{bundle.draft.bio}</p>
          </div>
          <div className="profile-actions">
            {editing ? (
              <button type="button" className="primary-button" onClick={handleSave}>
                保存修改
              </button>
            ) : (
              <button type="button" className="ghost-button" onClick={() => setEditing(true)}>
                编辑主页
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <strong>{bundle.stats.posts}</strong>
          <span>发布内容</span>
        </div>
        <div className="stat-card">
          <strong>{bundle.stats.saved}</strong>
          <span>收藏夹</span>
        </div>
        <div className="stat-card">
          <strong>{bundle.stats.likesAndFavorites}</strong>
          <span>获赞与收藏</span>
        </div>
      </div>

      <div className="profile-grid">
        <aside className="profile-sidebar">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "profile-tab profile-tab-active" : "profile-tab"}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
          <div className="section-card warm-card">
            <h3>说明</h3>
            <p>{message}</p>
          </div>
        </aside>

        <div className="profile-main">
          {tab === "info" ? (
            <div className="edit-grid">
              <label className="field">
                <span>昵称</span>
                <input
                  value={draft.name}
                  disabled={!editing}
                  onChange={(event) => setDraft((current) => current ? { ...current, name: event.target.value } : current)}
                />
              </label>
              <label className="field">
                <span>身份标签</span>
                <input
                  value={draft.badge}
                  disabled={!editing}
                  onChange={(event) =>
                    setDraft((current) => current ? { ...current, badge: event.target.value } : current)
                  }
                />
              </label>
              <label className="field full-width">
                <span>个人简介</span>
                <textarea
                  rows={4}
                  value={draft.bio}
                  disabled={!editing}
                  onChange={(event) => setDraft((current) => current ? { ...current, bio: event.target.value } : current)}
                />
              </label>
              <label className="field">
                <span>所在楼栋</span>
                <input
                  value={draft.neighborhood}
                  disabled={!editing}
                  onChange={(event) =>
                    setDraft((current) => current ? { ...current, neighborhood: event.target.value } : current)
                  }
                />
              </label>
              <label className="field">
                <span>兴趣偏好</span>
                <input
                  value={draft.hobbies}
                  disabled={!editing}
                  onChange={(event) =>
                    setDraft((current) => current ? { ...current, hobbies: event.target.value } : current)
                  }
                />
              </label>
            </div>
          ) : null}

          {tab === "posts" ? renderPostList(bundle.myPosts, "你还没有发布内容。") : null}
          {tab === "collections" ? renderPostList(bundle.myCollections, "收藏夹还是空的。") : null}
          {tab === "likes" ? renderPostList(bundle.myLikes, "还没有点赞记录。") : null}
          {tab === "following" ? renderFollowingList(bundle.following) : null}
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
