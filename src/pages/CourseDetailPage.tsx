import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent as ReactMouseEvent
} from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import Tag from "@/components/common/Tag";
import SectionHeader from "@/components/common/SectionHeader";
import { ArrowRightIcon } from "@/components/icons/Icon";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./CourseDetailPage.module.css";
import { knowpostService } from "@/services/knowpostService";
import { streamRagAnswer } from "@/services/ragService";
import { useAuth } from "@/context/AuthContext";
import type { KnowpostDetailResponse } from "@/types/knowpost";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LikeFavBar from "@/components/common/LikeFavBar";
import FollowButton from "@/components/common/FollowButton";

const MarkdownLink = ({ node: _node, ...props }: ComponentPropsWithoutRef<"a"> & { node?: unknown }) => (
  <a {...props} target="_blank" rel="noreferrer" />
);

const MarkdownImage = ({ node: _node, ...props }: ComponentPropsWithoutRef<"img"> & { node?: unknown }) => (
  <img {...props} style={{ maxWidth: "100%", borderRadius: 12 }} />
);

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { tokens, user } = useAuth();
  const [detail, setDetail] = useState<KnowpostDetailResponse | null>(null);
  const [contentText, setContentText] = useState("");
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
      setError(null);
      setContentError(null);
      setContentText("");
      try {
        const response = await knowpostService.detail(id, tokens?.accessToken ?? undefined);
        if (cancelled) return;
        setDetail(response);

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

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const prevImage = () => {
    if (!detail?.images?.length) return;
    setPreviewIndex((current) => (current - 1 + detail.images.length) % detail.images.length);
  };

  const nextImage = () => {
    if (!detail?.images?.length) return;
    setPreviewIndex((current) => (current + 1) % detail.images.length);
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
          postId: Number(detail.id),
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

  const canFollow = detail?.authorId && detail.authorId !== user?.id;

  return (
    <AppLayout
      header={(
        <MainHeader
          headline={detail?.title ?? "帖子详情"}
          subtitle={detail?.description ?? ""}
          rightSlot={<AuthStatus />}
        />
      )}
      variant="cardless"
    >
      <article className={styles.detailCard}>
        {error ? <div style={{ color: "var(--color-danger)" }}>{error}</div> : null}

        {detail?.images?.length ? (
          <div className={styles.imageRow}>
            {detail.images.map((src, index) => (
              <div key={`${src}-${index}`} className={styles.imageItem} onClick={() => openPreview(index)}>
                <img className={styles.image} src={src} alt={detail.title} />
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.titleBlock}>
          <div className={styles.meta}>
            {detail?.authorAvatar ? (
              <img className={styles.authorAvatar} src={detail.authorAvatar} alt={detail.authorNickname} />
            ) : null}
            <span className={styles.authorName}>{detail?.authorNickname ?? "社区用户"}</span>
            {canFollow ? <FollowButton targetUserId={detail.authorId} /> : null}
            {detail?.publishTime ? <span>{new Date(detail.publishTime).toLocaleString("zh-CN")}</span> : null}
          </div>
          <div className={styles.tagList}>
            {(detail?.tags ?? []).map((tag) => <Tag key={tag}>#{tag}</Tag>)}
          </div>
          <div className={styles.bottomBar}>
            {detail ? (
              <LikeFavBar
                entityId={detail.id}
                initialCounts={{ like: detail.likeCount ?? 0, fav: detail.favoriteCount ?? 0 }}
                initialState={{ liked: detail.liked, faved: detail.faved }}
              />
            ) : null}
          </div>
        </div>

        <SectionHeader title="正文内容" subtitle="Markdown 内容直接读取对象存储中的正文文件" />
        <div className={styles.contentRow}>
          <div className={styles.contentMain}>
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
                detail?.description || "暂无正文内容"
              )}
            </div>
            {contentError ? <div style={{ color: "var(--color-danger)" }}>{contentError}</div> : null}
          </div>

          <aside className={styles.ragPanel}>
            <div className={styles.ragBody}>
              <textarea
                className={styles.ragTextarea}
                placeholder="围绕当前帖子提问，例如：这篇内容的核心观点是什么？"
                value={ragQuestion}
                onChange={(event) => setRagQuestion(event.target.value)}
              />
              <div className={styles.ragControls}>
                <button
                  type="button"
                  className={`${styles.ragBtn} ${styles.ragBtnPrimary}`}
                  onClick={() => void startRag()}
                  disabled={ragLoading || !ragQuestion.trim()}
                >
                  {ragLoading ? "生成中..." : "发起问答"}
                </button>
                <button
                  type="button"
                  className={`${styles.ragBtn} ${styles.ragBtnGhost}`}
                  onClick={stopRag}
                  disabled={!ragLoading}
                >
                  停止
                </button>
              </div>
              <div className={styles.ragHint}>问答流已改为调用 linli 的 `/api/v1/rag/queries/stream`。</div>
              {ragError ? <div style={{ color: "var(--color-danger)" }}>{ragError}</div> : null}
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
                  <div className={styles.ragPlaceholder}>{ragLoading ? "正在流式生成答案..." : "这里会显示问答结果"}</div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {previewOpen && detail?.images?.length ? (
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
              <img className={styles.previewImage} src={detail.images[previewIndex]} alt={detail.title} />
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
      </article>
    </AppLayout>
  );
};

export default CourseDetailPage;
