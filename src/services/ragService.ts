export type RagStreamRequest = {
  question: string;
  postId?: string;
  lat?: number;
  lng?: number;
  topK?: number;
  sessionId?: string;
};

export type RagStreamChunk = {
  event: string;
  seq: number;
  delta: string;
  references?: Array<{
    title?: string;
    postId?: string;
    chunkId?: string;
  }>;
  finishReason?: string | null;
  errorCode?: string | null;
};

const getBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return envBase?.replace(/\/$/, "") ?? "";
};

const readAccessToken = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("linzhi_auth_tokens");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
};

export async function streamRagAnswer(
  payload: RagStreamRequest,
  handlers: {
    onChunk: (chunk: RagStreamChunk) => void;
    onDone?: (chunk: RagStreamChunk) => void;
    onError?: (chunk: RagStreamChunk | null, error?: Error) => void;
    signal?: AbortSignal;
  }
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream"
  };
  const token = readAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/rag/queries/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: handlers.signal,
    credentials: "include"
  });

  if (!response.ok || !response.body) {
    throw new Error(`RAG 请求失败：${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const flushEvent = (rawBlock: string) => {
    const lines = rawBlock.split(/\r?\n/);
    let eventName = "message";
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (!dataLines.length) {
      return;
    }

    try {
      const chunk = JSON.parse(dataLines.join("\n")) as RagStreamChunk;
      if (eventName === "done") {
        handlers.onDone?.(chunk);
      } else if (eventName === "error") {
        handlers.onError?.(chunk);
      } else {
        handlers.onChunk(chunk);
      }
    } catch (error) {
      handlers.onError?.(null, error instanceof Error ? error : new Error("解析 RAG 流失败"));
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      if (block.trim()) {
        flushEvent(block);
      }
    }
  }

  if (buffer.trim()) {
    flushEvent(buffer);
  }
}
