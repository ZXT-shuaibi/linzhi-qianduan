import { FormEvent, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CommunityTopNav from "@/components/layout/CommunityTopNav";
import { SearchIcon, SparkIcon } from "@/components/icons/Icon";
import { useAuth } from "@/context/AuthContext";
import { searchService } from "@/services/searchService";
import type { FeedItem } from "@/types/knowpost";
import styles from "./SearchPage.module.css";

const promptChips = [
  { label: "周末手作活动", icon: "✿" },
  { label: "附近市集", icon: "▣" },
  { label: "亲子体验", icon: "♧" },
  { label: "旧物转让", icon: "↻" }
];

type AnswerRow = {
  id: string;
  title: string;
  summary: string;
  tag: string;
  meta: string;
  distance: string;
  updated: string;
  likes: number;
  visual: "studio" | "market" | "family" | "post";
  coverImage?: string;
  to?: string;
};

const answerExamples: AnswerRow[] = [
  {
    id: "example-studio",
    title: "周末有没有适合新手的手作课推荐？",
    summary: "上周参加了社区手作空间的陶艺体验课，新手也能轻松上手，材料都包含在内，成品可以带回家。",
    tag: "来自邻里帖子",
    meta: "12条相关内容",
    distance: "2km内",
    updated: "今天",
    likes: 28,
    visual: "studio"
  },
  {
    id: "example-market",
    title: "明天附近有什么市集可以逛？",
    summary: "北外滩菜福士有小森林市集，有很多原创手作和植物摊位，现场还有咖啡和音乐表演。",
    tag: "社区经验",
    meta: "18条相关内容",
    distance: "1.5km内",
    updated: "今天",
    likes: 36,
    visual: "market"
  },
  {
    id: "example-family",
    title: "有没有适合3-6岁孩子的亲子体验活动？",
    summary: "社区图书馆本周有绘本工作坊，老师会引导孩子互动创作，活动结束还有绘本分享。",
    tag: "来自邻里帖子",
    meta: "9条相关内容",
    distance: "1.2km内",
    updated: "昨天",
    likes: 22,
    visual: "family"
  }
];

const visualClassMap: Record<AnswerRow["visual"], string> = {
  studio: styles.visualStudio,
  market: styles.visualMarket,
  family: styles.visualFamily,
  post: styles.visualPost
};

const trustReasons = [
  { icon: "▤", title: "真实可靠", text: "来自社区真实分享，减少虚假与不确定" },
  { icon: "◈", title: "更有温度", text: "邻里经验互助，答案更贴近生活" },
  { icon: "↻", title: "持续更新", text: "内容实时更新，信息更及时" }
];

const tipQuestions = [
  "附近有没有宠物友好的咖啡店？",
  "周末有什么亲子手作活动推荐？"
];

const formatDistance = (meters?: number) => {
  if (!meters && meters !== 0) return "附近";
  if (meters < 1000) return `${Math.max(1, Math.round(meters))}m内`;
  return `${(meters / 1000).toFixed(1)}km内`;
};

const formatPublishedAt = (value?: string) => {
  if (!value) return "最近更新";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "最近更新";

  const diff = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "今天";
  if (diff < day * 2) return "昨天";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const renderEmHighlightedText = (text: string): ReactNode => {
  if (!text.includes("<em")) return text;

  const parts: ReactNode[] = [];
  const re = /<em(?:\s[^>]*)?>(.*?)<\/em>/gis;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(<em key={`em-${key++}`}>{match[1]}</em>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? <>{parts}</> : text;
};

const SearchPage = () => {
  const [q, setQ] = useState("");
  const [tags] = useState("");
  const [size] = useState<number>(20);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
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
      setPage(response.page);
      setAfter(response.nextAfter ?? null);
      setHasMore(Boolean(response.hasMore));
    } catch {
      setItems([]);
      setPage(1);
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
      const response = await searchService.query({ q: q.trim(), page: page + 1, size, tags: tags.trim() || undefined, after });
      setItems((current) => [...current, ...(response.items ?? [])]);
      setPage(response.page);
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

  const answerRows: AnswerRow[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.description ?? "",
    tag: item.tags?.[0] ? `#${item.tags[0]}` : "来自邻里帖子",
    meta: `${(item.likeCount ?? 0) + (item.favoriteCount ?? 0)}条相关互动`,
    distance: formatDistance(item.distanceMeters),
    updated: formatPublishedAt(item.publishedAt),
    likes: item.likeCount ?? 0,
    coverImage: item.coverImage,
    to: `/post/${item.id}`,
    visual: "post"
  }));

  const showingExamples = !q.trim() && !items.length;
  const rows = showingExamples ? answerExamples : answerRows;

  return (
    <main className={styles.shell}>
      <CommunityTopNav locationLabel="AI 问答" />

      <section className={styles.askHero}>
        <article className={styles.heroCard}>
          <div className={styles.askCopy}>
            <span className={styles.kicker}>NEIGHBORHOOD QA</span>
            <h1>
              把问题交给真实内容，
              <br />
              <span>而不是凭空回答。</span>
            </h1>
            <p>
              接入 `linli` 搜索接口，从社区帖子里寻找答案线索。没有结果时保持真实空态，不伪造 AI 回复。
            </p>
            <div className={styles.promptChips}>
              {promptChips.map((item) => (
                <button key={item.label} type="button" onClick={() => void executeSearch(item.label)}>
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.heroScene} aria-hidden="true">
            <span className={styles.sceneSun} />
            <span className={styles.sceneCloudOne} />
            <span className={styles.sceneCloudTwo} />
            <span className={styles.sceneHouseMain} />
            <span className={styles.sceneHouseSmall} />
            <span className={styles.sceneTreeOne} />
            <span className={styles.sceneTreeTwo} />
            <span className={styles.scenePath} />
          </div>
        </article>

        <form className={styles.askBox} onSubmit={handleSubmit}>
          <div className={styles.askDecor} aria-hidden="true">
            <span className={styles.chatBubble} />
            <span className={styles.cup} />
            <span className={styles.plant} />
          </div>
          <div className={styles.askBadge}>
            <SparkIcon width={16} height={16} stroke="none" fill="currentColor" />
            真实内容问答
          </div>
          <label htmlFor="ai-query">想问社区什么？</label>
          <p>我们会从社区真实经验中帮你找答案</p>
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
          <div className={styles.askFootnote}>
            <span>◇</span>
            基于真实社区内容为你寻找答案，尊重每一位分享者。
          </div>
        </form>
      </section>

      {showLoginHint && !user ? (
        <div className={styles.loginHint}>
          当前为未登录状态，登录后可以获得更完整的推荐和学习记录。
          <Link to="/login">去登录</Link>
        </div>
      ) : null}

      <section className={styles.contentGrid}>
        <section className={styles.resultsPanel}>
          <div className={styles.resultHeader}>
            <div>
              <span className={styles.kicker}>REAL ANSWERS</span>
              <h2>{q.trim() ? `关于「${q.trim()}」的内容线索` : "真实经验，从附近开始"}</h2>
            </div>
            <button type="button" onClick={() => void executeSearch(q.trim() || "附近活动")}>
              查看更多答案
              <span>›</span>
            </button>
          </div>

          {loading && !items.length ? <div className={styles.stateCard}>正在读取社区内容...</div> : null}
          {!loading && q.trim() && !items.length ? (
            <div className={styles.stateCard}>暂无匹配内容，可以换一个更生活化的问题试试。</div>
          ) : null}

          <div className={styles.answerList}>
            {rows.map((row) => {
              const content = (
                <>
                  <div className={`${styles.answerVisual} ${visualClassMap[row.visual]}`}>
                    {row.coverImage ? (
                      <img src={row.coverImage} alt={row.title} loading="lazy" />
                    ) : (
                      <>
                        <span />
                        <i />
                      </>
                    )}
                  </div>
                  <div className={styles.answerBody}>
                    <h3>{renderEmHighlightedText(row.title)}</h3>
                    <p>{renderEmHighlightedText(row.summary)}</p>
                    <div className={styles.answerMeta}>
                      <strong>{row.tag}</strong>
                      <span>☰ {row.meta}</span>
                      <span>⌖ {row.distance}</span>
                      <span>更新于 {row.updated}</span>
                    </div>
                  </div>
                  <div className={styles.likeMark}>♡ {row.likes}</div>
                </>
              );

              return row.to ? (
                <Link key={row.id} to={row.to} className={styles.answerRow}>
                  {content}
                </Link>
              ) : (
                <article key={row.id} className={styles.answerRow}>
                  {content}
                </article>
              );
            })}
          </div>

          {hasMore ? (
            <button className={styles.loadMoreBtn} type="button" disabled={loading} onClick={() => void loadMore()}>
              {loading ? "加载中..." : "加载更多"}
            </button>
          ) : null}
        </section>

        <aside className={styles.sideColumn}>
          <section className={styles.sideCard}>
            <div className={styles.sidePlant} aria-hidden="true">
              <span />
              <i />
            </div>
            <h2>为什么用真实内容？</h2>
            <div className={styles.reasonList}>
              {trustReasons.map((item) => (
                <div key={item.title} className={styles.reasonItem}>
                  <span>{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.tipCard}>
            <h2>使用小贴士</h2>
            <p>问题越具体，越容易找到有用的回答</p>
            <div className={styles.tipChips}>
              {tipQuestions.map((item) => (
                <button key={item} type="button" onClick={() => void executeSearch(item)}>
                  “{item}”
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
};

export default SearchPage;
