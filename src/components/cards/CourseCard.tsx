import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Link } from "react-router-dom";
import Tag from "@/components/common/Tag";
import { HeartIcon } from "@/components/icons/Icon";
import { useAuth } from "@/context/AuthContext";
import { knowpostService } from "@/services/knowpostService";
import type { KnowpostDetailResponse, VisibleScope } from "@/types/knowpost";
import styles from "./CourseCard.module.css";

const renderEmHighlightedText = (text: string): ReactNode => {
  if (!text.includes("<em")) return text;

  const parts: ReactNode[] = [];
  const re = /<em(?:\s[^>]*)?>(.*?)<\/em>/gis;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    parts.push(<em key={`em-${key++}`}>{match[1]}</em>);
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? <>{parts}</> : text;
};

export type CourseCardProps = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  authorTags?: string[];
  isFree?: boolean;
  isTop?: boolean;
  teacher: {
    name: string;
    avatarText?: string;
    avatarUrl?: string;
  };
  stats?: {
    likes: number;
    views: number;
  };
  coverImage?: string;
  layout?: "vertical" | "horizontal";
  showPlayBadge?: boolean;
  footerExtra?: ReactNode;
  to?: string;
  className?: string;
  editable?: boolean;
  onChanged?: (action: "top" | "visibility" | "delete", payload?: unknown) => void;
};

const CourseCard = ({
  id,
  title,
  summary,
  tags,
  authorTags,
  isTop,
  teacher,
  stats,
  coverImage,
  showPlayBadge,
  footerExtra,
  to,
  className,
  editable = false,
  onChanged
}: CourseCardProps) => {
  const { tokens } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [detail, setDetail] = useState<KnowpostDetailResponse | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const loadDetailIfNeeded = async (postId: string) => {
    if (detail || menuLoading) return;

    try {
      setMenuLoading(true);
      const response = await knowpostService.detail(postId, tokens?.accessToken ?? undefined);
      setDetail(response);
    } catch (error) {
      setMenuError(error instanceof Error ? error.message : "加载详情失败");
    } finally {
      setMenuLoading(false);
    }
  };

  const toggleMenu = async (postId: string) => {
    const nextOpen = !menuOpen;
    setMenuOpen(nextOpen);
    if (nextOpen) {
      await loadDetailIfNeeded(postId);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (menu && menu.contains(target)) return;
      if (button && button.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocumentClick, true);
    return () => document.removeEventListener("mousedown", onDocumentClick, true);
  }, [menuOpen]);

  const requireLogin = () => {
    setMenuError("请先登录");
  };

  const handleSetTop = async (postId: string, top: boolean) => {
    if (!tokens?.accessToken) {
      requireLogin();
      return;
    }

    try {
      setMenuLoading(true);
      await knowpostService.setTop(postId, top, tokens.accessToken);
      setDetail((current) => (current ? { ...current, isTop: top } : current));
      setMenuOpen(false);
      onChanged?.("top", { isTop: top });
    } catch (error) {
      setMenuError(error instanceof Error ? error.message : "设置置顶失败");
    } finally {
      setMenuLoading(false);
    }
  };

  const handleSetVisibility = async (postId: string, visible: VisibleScope) => {
    if (!tokens?.accessToken) {
      requireLogin();
      return;
    }

    try {
      setMenuLoading(true);
      await knowpostService.setVisibility(postId, visible, tokens.accessToken);
      setDetail((current) => (current ? { ...current, visible } : current));
      setMenuOpen(false);
      onChanged?.("visibility", { visible });
    } catch (error) {
      setMenuError(error instanceof Error ? error.message : "设置可见性失败");
    } finally {
      setMenuLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!tokens?.accessToken) {
      requireLogin();
      return;
    }

    if (!window.confirm("确认删除这篇帖子吗？删除后不可恢复。")) {
      return;
    }

    try {
      setMenuLoading(true);
      await knowpostService.remove(postId, tokens.accessToken);
      setMenuOpen(false);
      onChanged?.("delete");
    } catch (error) {
      setMenuError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setMenuLoading(false);
    }
  };

  const content = (
    <>
      {coverImage ? (
        <div className={styles.coverWrap}>
          <img className={styles.cover} src={coverImage} alt={title} loading="lazy" />
          {showPlayBadge ? (
            <div className={styles.playBadge}>
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <polygon points="6,4 12,8 6,12" fill="currentColor" />
              </svg>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {summary.trim() ? <p className={styles.description}>{renderEmHighlightedText(summary)}</p> : null}
        {tags?.length ? (
          <div className={styles.tagGroups}>
            {tags.map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.meta}>
        <div className={styles.teacher}>
          {teacher.avatarUrl ? (
            <img className={styles.teacherAvatarImg} src={teacher.avatarUrl} alt={teacher.name} />
          ) : (
            <div className={styles.teacherAvatar}>{teacher.avatarText ?? (teacher.name?.charAt(0) || "?")}</div>
          )}
          <div className={styles.teacherInfo}>
            <span className={styles.teacherName}>{teacher.name}</span>
            {authorTags?.length ? (
              <div className={styles.authorTags}>
                {authorTags.map((tag) => (
                  <span key={tag} className={styles.authorTag}>#{tag}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        {footerExtra ? null : (
          <div className={styles.stats}>
            {stats ? (
              <>
                <span className={styles.statItem}>
                  <HeartIcon width={16} height={16} strokeWidth={1.6} />
                  {stats.likes}
                </span>
                <span className={styles.statItem}>👁️ {stats.views}</span>
              </>
            ) : null}
          </div>
        )}
      </div>

      {footerExtra ? <div className={styles.footerExtra}>{footerExtra}</div> : null}
    </>
  );

  return (
    <article className={clsx(styles.card, className)}>
      {(detail?.isTop ?? isTop) ? (
        <div className={styles.topBadge}><span>置顶</span></div>
      ) : null}

      {editable ? (
        <>
          <button
            ref={buttonRef}
            type="button"
            className={styles.menuButton}
            onClick={() => void toggleMenu(id)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            title="编辑"
          >
            ⋯
          </button>
          {menuOpen ? (
            <div ref={menuRef} className={styles.menuList} role="menu">
              {menuError ? <div style={{ color: "var(--color-danger)", padding: 6 }}>{menuError}</div> : null}
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => void handleSetTop(id, !(detail?.isTop))}
                disabled={menuLoading}
              >
                {detail?.isTop ? "取消置顶" : "置顶"}
              </button>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => void handleSetVisibility(id, "public")}
                disabled={menuLoading}
              >
                设为公开
              </button>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => void handleSetVisibility(id, "private")}
                disabled={menuLoading}
              >
                设为私密
              </button>
              <button
                type="button"
                className={clsx(styles.menuItem, styles.menuDanger)}
                onClick={() => void handleDelete(id)}
                disabled={menuLoading}
              >
                删除
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {to ? <Link to={to}>{content}</Link> : content}
    </article>
  );
};

export default CourseCard;
