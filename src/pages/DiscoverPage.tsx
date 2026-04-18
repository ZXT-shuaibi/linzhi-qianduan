import { useEffect, useState } from "react";
import PostDetailDialog from "../components/PostDetailDialog";
import { communityMetrics, trendingTopics } from "../data/mockData";
import { todoApi } from "../services/todoApi";
import type { FeedPost } from "../types/app";

const apiSuggestions = [
  { endpoint: "GET /feed", description: "社区动态列表" },
  { endpoint: "POST /post/:id/like", description: "点赞" },
  { endpoint: "POST /post/:id/favorite", description: "收藏" },
  { endpoint: "GET /post/:id", description: "帖子详情" }
];

function DiscoverPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const result = await todoApi.getFeed();
      if (!cancelled) {
        setPosts(result);
        setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePost = (postId: string, updater: (post: FeedPost) => FeedPost) => {
    setPosts((current) => current.map((post) => (post.id === postId ? updater(post) : post)));
    setSelectedPost((current) => (current && current.id === postId ? updater(current) : current));
  };

  const toggleLike = (postId: string) => {
    updatePost(postId, (post) => ({
      ...post,
      liked: !post.liked,
      likes: post.likes + (post.liked ? -1 : 1)
    }));
  };

  const toggleFavorite = (postId: string) => {
    updatePost(postId, (post) => ({
      ...post,
      favorited: !post.favorited,
      favorites: post.favorites + (post.favorited ? -1 : 1)
    }));
  };

  return (
    <>
      <section className="hero-grid">
        <article className="hero-panel">
          <span className="hero-tag">Prototype to Frontend</span>
          <h2>发现页先用三列结构还原“社区正在发生什么”的氛围。</h2>
          <p>
            左边讲氛围，中间给动态流，右边放社区指标和趋势话题。等你给接口文档后，
            这里只需要替换数据来源，不用再改页面骨架。
          </p>
          <div className="metric-row">
            {communityMetrics.map((metric) => (
              <div key={metric.label} className="metric-card">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className="side-stack">
          <div className="section-card">
            <h3>今日趋势</h3>
            <div className="chip-list">
              {trendingTopics.map((topic) => (
                <span key={topic} className="chip">
                  #{topic}
                </span>
              ))}
            </div>
          </div>
          <div className="section-card">
            <h3>接口占位说明</h3>
            <p className="muted">
              当前动态列表、点赞收藏、帖子详情都由 `todoApi` 提供 mock 数据，后续可直接替换成真实
              HTTP 请求。
            </p>
          </div>
        </aside>
      </section>

      <section className="feed-layout">
        <div className="feed-column">
          {loading ? <div className="section-card">正在装载社区动态...</div> : null}
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              <div className="post-card-image" style={{ backgroundImage: `url(${post.image ?? ""})` }} />
              <div className="post-card-body">
                <div className="post-card-head">
                  <span className={`tone-pill tone-${post.categoryTone}`}>{post.category}</span>
                  <span className="muted">{post.time}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.summary}</p>
                <div className="author-row">
                  <div className="avatar-badge">{post.avatar}</div>
                  <div>
                    <strong>{post.author}</strong>
                    <span>{post.authorBadge} · {post.location}</span>
                  </div>
                </div>
                <div className="action-row">
                  <button type="button" className="soft-button" onClick={() => toggleLike(post.id)}>
                    {post.liked ? "已点赞" : "点赞"} {post.likes}
                  </button>
                  <button type="button" className="soft-button" onClick={() => toggleFavorite(post.id)}>
                    {post.favorited ? "已收藏" : "收藏"} {post.favorites}
                  </button>
                  <button type="button" className="primary-link" onClick={() => setSelectedPost(post)}>
                    查看详情
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="feed-side">
          <div className="section-card warm-card">
            <h3>今日社区情报</h3>
            <ul className="bullet-list">
              <li>南门烘焙店今天第二件半价，适合组织拼单。</li>
              <li>羽毛球场 19:00 后相对空闲，活动帖热度较高。</li>
              <li>闲置交易类内容收藏率显著高于普通动态。</li>
            </ul>
          </div>
          <div className="section-card">
            <h3>后续接口建议</h3>
            <ul className="bullet-list">
              {apiSuggestions.map((item) => (
                <li key={item.endpoint}>
                  <code>{item.endpoint}</code> {item.description}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <PostDetailDialog
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onToggleLike={toggleLike}
        onToggleFavorite={toggleFavorite}
      />
    </>
  );
}

export default DiscoverPage;
