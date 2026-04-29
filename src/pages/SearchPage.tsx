import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import CommunityTopNav from "@/components/layout/CommunityTopNav";
import { SearchIcon, SparkIcon } from "@/components/icons/Icon";
import { useAuth } from "@/context/AuthContext";
import { searchService } from "@/services/searchService";
import type { FeedItem } from "@/types/knowpost";
import styles from "./SearchPage.module.css";

const SearchPage = () => {
  const [q, setQ] = useState("");
  const [tags] = useState("");
  const [size] = useState<number>(20);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const initialQueryRef = useRef<string | null>(null);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

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

  const handleQueryChange = (value: string) => {
    setQ(value);
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
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void executeSearch(q);
  };

  const loadMore = async () => {
    if (!q.trim() || !after) return;
    setLoading(true);
    try {
      const response = await searchService.query({ q: q.trim(), size, tags: tags.trim() || undefined, after });
      setItems((current) => [...current, ...(response.items ?? [])]);
      setAfter(response.nextAfter ?? null);
      setHasMore(Boolean(response.hasMore));
    } catch {
      // 加载更多失败时保留当前结果，避免清空用户已经看到的内容。
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const keyword = searchParams.get("q")?.trim();
    if (!keyword || initialQueryRef.current === keyword) return;
    initialQueryRef.current = keyword;
    void executeSearch(keyword);
  }, [searchParams]);

  return (
    <main className={styles.shell}>
      <CommunityTopNav locationLabel="AI 问答" />

      <section className={styles.askHero}>
        <div className={styles.askCopy}>
          <span>Neighborhood QA</span>
          <h1>把问题交给真实内容，而不是凭空回答。</h1>
          <p>
            这里接入 `linli` 搜索接口，从社区帖子里寻找答案线索。没有结果时会保持真实空态，不伪造 AI 回复。
          </p>
          <div className={styles.promptChips}>
            {["周末手作活动", "附近市集", "亲子体验", "旧物转让"].map((item) => (
              <button key={item} type="button" onClick={() => void executeSearch(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <form className={styles.askBox} onSubmit={handleSubmit}>
          <div className={styles.askBadge}>
            <SparkIcon width={18} height={18} stroke="none" fill="currentColor" />
            真实内容问答
          </div>
          <label htmlFor="ai-query">想问社区什么？</label>
          <div className={styles.inputRow}>
            <SearchIcon width={20} height={20} strokeWidth={1.8} />
            <input
              id="ai-query"
              value={q}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="例如：附近有没有适合周末参加的手作课？"
            />
            <button type="submit" disabled={!q.trim() || loading}>
              {loading ? "查找中..." : "开始查找"}
            </button>
          </div>
          {(suggestLoading || suggestions.length > 0) ? (
            <div className={styles.suggestionStrip}>
              {suggestLoading ? <span>正在生成联想...</span> : null}
              {suggestions.map((item) => (
                <button key={item} type="button" onClick={() => void executeSearch(item)}>
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </form>
      </section>

      {showLoginHint && !user ? (
        <div className={styles.loginHint}>
          当前为未登录状态，登录后可以获得更完整的推荐和学习记录。
          <Link to="/login">去登录</Link>
        </div>
      ) : null}

      <section className={styles.resultsPanel}>
        <div className={styles.resultHeader}>
          <span>Real Content Answers</span>
          <h2>{q.trim() ? `关于「${q.trim()}」的内容线索` : "从一个问题开始"}</h2>
          <p>{items.length ? `已找到 ${items.length} 条真实内容。` : "输入问题或点击上方提示词后，这里会展示来自真实接口的结果。"}</p>
        </div>

        {loading && !items.length ? <div className={styles.stateCard}>正在读取社区内容...</div> : null}
        {!loading && q.trim() && !items.length ? <div className={styles.stateCard}>暂无匹配内容，可以换一个更生活化的问题试试。</div> : null}

        <div className={styles.resultGrid}>
          {items.map((item) => (
            <CourseCard
              key={item.id}
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
          ))}
        </div>

        {hasMore ? (
          <button className={styles.loadMoreBtn} type="button" disabled={loading} onClick={() => void loadMore()}>
            {loading ? "加载中..." : "加载更多"}
          </button>
        ) : null}
      </section>
    </main>
  );
};

export default SearchPage;
