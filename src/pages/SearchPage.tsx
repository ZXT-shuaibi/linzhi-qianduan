import { useRef, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import SearchBar from "@/components/common/SearchBar";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./SearchPage.module.css";
import { searchService } from "@/services/searchService";
import type { FeedItem } from "@/types/knowpost";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import feedStyles from "./HomePage.module.css";
import { useAuth } from "@/context/AuthContext";

const SearchPage = () => {
  const [q, setQ] = useState("");
  const [tags] = useState(""); // 多个标签之间使用逗号分隔。
  const [size] = useState<number>(20);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const { user } = useAuth();
  const [showLoginHint, setShowLoginHint] = useState(false);

  const executeSearch = async (keyword: string) => {
    const text = keyword.trim();
    if (!text) return;

    if (!user) {
      setShowLoginHint(true);
    }
    setQ(text);
    setLoading(true);
    try {
      const response = await searchService.query({ q: text, size, tags: tags.trim() || undefined });
      setItems(response.items ?? []);
      setAfter(response.nextAfter ?? null);
      setHasMore(Boolean(response.hasMore));
    } catch {
      setItems([]);
      setAfter(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      header={(
        <MainHeader
          headline="搜索你想学习的知识"
          subtitle="从关键词开始，探索附近社区里的真实内容"
          rightSlot={<AuthStatus />}
        >
          <SearchBar
            placeholder="搜索你想学习的知识..."
            value={q}
            suggestions={suggestions}
            suggestLoading={suggestLoading}
            onSuggestionClick={(value) => {
              void executeSearch(value);
            }}
            onChange={(value) => {
              setQ(value);
              // 前缀联想使用 300 毫秒防抖。
              if (debounceRef.current) window.clearTimeout(debounceRef.current);
              debounceRef.current = window.setTimeout(async () => {
                if (!value.trim()) {
                  setSuggestions([]);
                  return;
                }
                try {
                  setSuggestLoading(true);
                  const response = await searchService.suggest(value.trim(), 10);
                  setSuggestions(response.items ?? []);
                } catch {
                  setSuggestions([]);
                } finally {
                  setSuggestLoading(false);
                }
              }, 300);
            }}
            onSubmit={() => {
              void executeSearch(q);
            }}
          />
        </MainHeader>
      )}
    >
      <>
        {showLoginHint && !user ? (
          <div className={styles.loginHint}>
            当前为未登录状态，登录后可以获得更完整的推荐和学习记录。
          </div>
        ) : null}
        <SectionHeader
          title="搜索结果"
          subtitle={loading ? "加载中..." : items.length ? `共 ${items.length} 条结果（可能还有更多）` : "请输入关键词后开始搜索"}
        />
        <div className={feedStyles.masonry}>
          {items.map((item) => (
            <div key={item.id} className={feedStyles.masonryItem}>
              <CourseCard
                id={item.id}
                title={item.title}
                summary={item.description ?? ""}
                tags={item.tags ?? []}
                isTop={item.isTop}
                authorTags={(() => {
                  try {
                    return item.tagJson
                      ? (JSON.parse(item.tagJson) as unknown[]).filter((tag): tag is string => typeof tag === "string")
                      : [];
                  } catch {
                    return [];
                  }
                })()}
                teacher={{ name: item.authorNickname, avatarUrl: item.authorAvatar ?? item.authorAvator }}
                coverImage={item.coverImage}
                to={`/post/${item.id}`}
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
        </div>
        {hasMore ? (
          <button
            className={styles.loadMoreBtn}
            type="button"
            onClick={async () => {
              if (!q.trim() || !after) return;
              setLoading(true);
              try {
                const response = await searchService.query({ q: q.trim(), size, tags: tags.trim() || undefined, after });
                setItems((current) => [...current, ...(response.items ?? [])]);
                setAfter(response.nextAfter ?? null);
                setHasMore(Boolean(response.hasMore));
              } catch {
                // 加载更多失败时保留当前结果。
              } finally {
                setLoading(false);
              }
            }}
          >
            加载更多
          </button>
        ) : null}
      </>
    </AppLayout>
  );
};

export default SearchPage;
