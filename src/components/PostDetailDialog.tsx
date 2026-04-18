import type { FeedPost } from "../types/app";

type PostDetailDialogProps = {
  post: FeedPost | null;
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  onToggleFavorite: (postId: string) => void;
};

function PostDetailDialog({ post, onClose, onToggleLike, onToggleFavorite }: PostDetailDialogProps) {
  if (!post) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-card dialog-wide" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-media" style={{ backgroundImage: `url(${post.image ?? ""})` }} />
        <div className="dialog-main">
          <div className="dialog-header">
            <div>
              <span className={`tone-pill tone-${post.categoryTone}`}>{post.category}</span>
              <h3>{post.title}</h3>
              <p className="muted">{post.author} · {post.time} · {post.location}</p>
            </div>
            <button type="button" className="icon-button" onClick={onClose}>
              关闭
            </button>
          </div>

          <p className="dialog-copy">{post.content}</p>

          <div className="dialog-actions">
            <button type="button" className="soft-button" onClick={() => onToggleLike(post.id)}>
              {post.liked ? "已点赞" : "点赞"} · {post.likes}
            </button>
            <button type="button" className="soft-button" onClick={() => onToggleFavorite(post.id)}>
              {post.favorited ? "已收藏" : "收藏"} · {post.favorites}
            </button>
          </div>

          <div className="comment-list">
            <h4>邻里评论</h4>
            {post.comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">{comment.avatar}</div>
                <div>
                  <div className="comment-meta">
                    <strong>{comment.author}</strong>
                    <span>{comment.time}</span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostDetailDialog;
