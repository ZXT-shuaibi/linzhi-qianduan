import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent as ReactMouseEvent
} from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FollowButton from "@/components/common/FollowButton";
import LikeFavBar from "@/components/common/LikeFavBar";
import Tag from "@/components/common/Tag";
import { ArrowRightIcon } from "@/components/icons/Icon";
import CommunityTopNav from "@/components/layout/CommunityTopNav";
import { useAuth } from "@/context/AuthContext";
import { knowpostService } from "@/services/knowpostService";
import { streamRagAnswer } from "@/services/ragService";
import type { KnowpostDetailResponse } from "@/types/knowpost";
import styles from "./CourseDetailPage.module.css";

const MarkdownLink = ({ node: _node, ...props }: ComponentPropsWithoutRef<"a"> & { node?: unknown }) => (
  <a {...props} target="_blank" rel="noreferrer" />
);

const MarkdownImage = ({ node: _node, ...props }: ComponentPropsWithoutRef<"img"> & { node?: unknown }) => (
  <img {...props} />
);

const getInitial = (name?: string | null) => name?.trim().charAt(0) || "邻";

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { tokens, user } = useAuth();
  const [detail, setDetail] = useState<KnowpostDetailResponse | null>(null);
  const [contentText, setContentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showNavLeft, setShowNavLeft] = useState(false);
  const [showNavRight, setShowNavRight] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const previewBoxRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [ragQuestion, setRagQuestion] = useState("");
  const [ragAnswer, setRagAnswer] = useState("");
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const [ragTopK] = useState(5);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      setContentError(null);
      setContentText("");
      try {
        const response = await knowpostService.detail(id, tokens?.accessToken ?? undefined);
        if (cancelled) return;
        setDetail(response);
        setPreviewIndex(0);

        if (!response.contentUrl) {
          return;
        }

        try {
          const content = await fetch(response.contentUrl, { credentials: "omit" }).then(async (result) => {
            if (!result.ok) {
              throw new Error(`HTTP ${result.status}`);
            }
            return result.text();
          });
          if (!cancelled) {
            setContentText(content);
          }
        } catch {
          if (!cancelled) {
            setContentError("正文文件暂时无法直接读取，你仍然可以查看摘要和图片。");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载详情失败");
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

  useEffect(() => {
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouch(touch);
    if (touch) {
      setShowNavLeft(true);
      setShowNavRight(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const images = detail?.images ?? [];
  const activeImage = images[previewIndex] ?? images[0] ?? null;
  const canFollow = Boolean(detail?.authorId && detail.authorId !== user?.userId);
  const publishTime = useMemo(() => {
    if (!detail?.publishedAt) return "发布时间未知";
    const date = new Date(detail.publishedAt);
    return Number.isNaN(date.getTime()) ? "发布时间未知" : date.toLocaleString("zh-CN");
  }, [detail?.publishedAt]);

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const prevImage = () => {
    if (!images.length) return;
    setPreviewIndex((current) => (current - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    if (!images.length) return;
    setPreviewIndex((current) => (current + 1) % images.length);
  };

  const handlePreviewMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (isTouch) return;
    const box = previewBoxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const threshold = Math.max(60, Math.min(120, rect.width * 0.08));
    setShowNavLeft(x < threshold);
    setShowNavRight(x > rect.width - threshold);
  };

  const startRag = async () => {
    if (!detail || !ragQuestion.trim()) return;
    if (!tokens?.accessToken) {
      setRagError("请登录后使用问答");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRagLoading(true);
    setRagError(null);
    setRagAnswer("");
    try {
      await streamRagAnswer(
        {
          question: ragQuestion.trim(),
          postId: detail.id,
          topK: ragTopK
        },
        {
          signal: controller.signal,
          onChunk: (chunk) => {
            setRagAnswer((current) => current + (chunk.delta ?? ""));
          },
          onDone: (chunk) => {
            if (chunk.delta) {
              setRagAnswer((current) => current + chunk.delta);
            }
            setRagLoading(false);
          },
          onError: (chunk, streamError) => {
            setRagLoading(false);
            setRagError(chunk?.errorCode ?? streamError?.message ?? "问答失败");
          }
        }
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setRagError(err instanceof Error ? err.message : "问答失败");
      }
      setRagLoading(false);
    }
  };

  const stopRag = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRagLoading(false);
  };

  return (
    <main className={styles.shell}>
      <CommunityTopNav locationLabel="帖子详情" />

      <section className={styles.detailStage}>
        <aside className={styles.galleryPanel}>
          {activeImage ? (
            <button type="button" className={styles.heroImageButton} onClick={() => openPreview(previewIndex)}>
              <img src={activeImage} alt={detail?.title ?? "帖子图片"} />
            </button>
          ) : (
            <div className={styles.imageFallback}>
              <span>{getInitial(detail?.authorNickname)}</span>
              <strong>{loading ? "正在加载帖子" : "邻里知光"}</strong>
            </div>
          )}

          {images.length > 1 ? (
            <div className={styles.thumbRail}>
              {images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  className={`${styles.thumbButton} ${previewIndex === index ? styles.thumbButtonActive : ""}`}
                  onClick={() => setPreviewIndex(index)}
                >
                  <img src={src} alt={`${detail?.title ?? "帖子图片"} ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}

          <div className={styles.galleryGlass}>
            <span>真实详情接口</span>
            <strong>/api/v1/posts/{id}</strong>
            <p>正文从对象存储 `contentUrl` 读取，图片来自 `imageUrls`。</p>
          </div>
        </aside>

        <article className={styles.storyPanel}>
          {error ? <div className={styles.error}>{error}</div> : null}
          {loading && !detail ? <div className={styles.loading}>正在加载帖子详情...</div> : null}

          {detail ? (
            <>
              <div className={styles.storyHeader}>
                <div>
                  <span className={styles.eyebrow}>Neighbor Story</span>
                  <h1>{detail.title}</h1>
                  <p>{detail.description || "这条内容暂未填写摘要，正文会展示作者上传的 Markdown 内容。"}</p>
                </div>
                <LikeFavBar
                  entityId={detail.id}
                  initialCounts={{ like: detail.likeCount ?? 0, fav: detail.favoriteCount ?? 0 }}
                  initialState={{ liked: detail.liked, faved: detail.faved }}
                />
              </div>

              <div className={styles.authorCard}>
                {detail.authorAvatar ? (
                  <img src={detail.authorAvatar} alt={detail.authorNickname} />
                ) : (
                  <span>{getInitial(detail.authorNickname)}</span>
                )}
                <div>
                  <strong>{detail.authorNickname}</strong>
                  <small>{publishTime}</small>
                </div>
                {canFollow && detail.authorId ? <FollowButton targetUserId={detail.authorId} /> : null}
              </div>

              <div className={styles.tagList}>
                {detail.tags.map((tag) => <Tag key={tag}>#{tag}</Tag>)}
                {!detail.tags.length ? <span className={styles.muted}>暂无标签</span> : null}
              </div>

              <section className={styles.contentCard}>
                <div className={styles.sectionTitle}>
                  <span>Markdown Content</span>
                  <strong>正文内容</strong>
                </div>
                <div className={`${styles.body} ${styles.markdown}`}>
                  {contentText ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: MarkdownLink,
                        img: MarkdownImage
                      }}
                    >
                      {contentText}
                    </ReactMarkdown>
                  ) : (
                    detail.description || "暂无正文内容"
                  )}
                </div>
                {contentError ? <div className={styles.error}>{contentError}</div> : null}
              </section>

              <section className={styles.ragPanel}>
                <div className={styles.sectionTitle}>
                  <span>RAG Stream</span>
                  <strong>围绕当前帖子提问</strong>
                </div>
                <textarea
                  className={styles.ragTextarea}
                  placeholder="例如：这篇内容的核心观点是什么？适合谁参考？"
                  value={ragQuestion}
                  onChange={(event) => setRagQuestion(event.target.value)}
                />
                <div className={styles.ragControls}>
                  <button
                    type="button"
                    className={styles.ragBtnPrimary}
                    onClick={() => void startRag()}
                    disabled={ragLoading || !ragQuestion.trim()}
                  >
                    {ragLoading ? "生成中..." : "发起问答"}
                  </button>
                  <button type="button" className={styles.ragBtnGhost} onClick={stopRag} disabled={!ragLoading}>
                    停止
                  </button>
                </div>
                <div className={styles.ragHint}>已接入 `/api/v1/rag/queries/stream`，答案会以流式结果写入。</div>
                {ragError ? <div className={styles.error}>{ragError}</div> : null}
                <div className={styles.ragAnswer}>
                  {ragAnswer ? (
                    <div className={styles.markdown}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: MarkdownLink,
                          img: MarkdownImage
                        }}
                      >
                        {ragAnswer}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className={styles.ragPlaceholder}>
                      {ragLoading ? "正在流式生成答案..." : "这里会显示问答结果"}
                    </div>
                  )}
                </div>
              </section>

              <section className={styles.commentEmpty}>
                <span>评论区</span>
                <strong>linli 暂未暴露评论列表/发布接口</strong>
                <p>这里先保留真实空态，等后端评论接口就绪后再接入，不展示伪评论。</p>
              </section>
            </>
          ) : null}
        </article>
      </section>

      {previewOpen && images.length ? (
        <div className={styles.previewOverlay} onClick={() => setPreviewOpen(false)}>
          <div
            className={styles.previewBox}
            ref={previewBoxRef}
            onMouseMove={handlePreviewMouseMove}
            onMouseLeave={() => {
              if (!isTouch) {
                setShowNavLeft(false);
                setShowNavRight(false);
              }
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <img className={styles.previewImage} src={images[previewIndex]} alt={detail?.title ?? "帖子图片"} />
            <button
              type="button"
              className={`${styles.navButton} ${styles.navButtonLeft} ${showNavLeft ? styles.navButtonVisible : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                prevImage();
              }}
              aria-label="上一张"
            >
              <ArrowRightIcon width={24} height={24} style={{ transform: "rotate(180deg)" }} />
            </button>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navButtonRight} ${showNavRight ? styles.navButtonVisible : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
              aria-label="下一张"
            >
              <ArrowRightIcon width={24} height={24} />
            </button>
            <button
              type="button"
              className={styles.closeButton}
              onClick={(event) => {
                event.stopPropagation();
                setPreviewOpen(false);
              }}
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default CourseDetailPage;
