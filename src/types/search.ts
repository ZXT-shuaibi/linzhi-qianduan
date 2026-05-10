import type { FeedItem } from "@/types/knowpost";

export type SearchResponse = {
  items: FeedItem[];
  page: number;
  size: number;
  nextAfter: string | null;
  hasMore: boolean;
};

export type SuggestResponse = {
  items: string[];
};
