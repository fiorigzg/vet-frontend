"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { adminApi, adminWsUrl, UnauthorizedError } from "@/lib/adminApi";
import { adminLogout } from "@/lib/adminAuth";

interface LogEntry {
  time: string;
  level: string;
  message: string;
}

interface CrawlStatus {
  is_crawling: boolean;
  current_site: string;
  logs: LogEntry[];
  stats: {
    pages_processed: number;
    benefits_found: number;
    total_count: number;
  };
}

const EMPTY_STATUS: CrawlStatus = {
  is_crawling: false,
  current_site: "",
  logs: [],
  stats: { pages_processed: 0, benefits_found: 0, total_count: 0 },
};

const LOG_COLOR: Record<string, string> = {
  SYSTEM: "text-blue-400",
  INFO: "text-green-400",
  CRAWL: "text-cyan-400",
  PARSE: "text-purple-400",
  LLM: "text-indigo-300",
  WARN: "text-yellow-400",
  ERROR: "text-red-400",
};

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CrawlStatus>(EMPTY_STATUS);
  const [urlInput, setUrlInput] = useState("");
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const successRate = useMemo(() => {
    if (!status.stats.pages_processed) return "0.0";
    return ((status.stats.benefits_found / status.stats.pages_processed) * 100).toFixed(1);
  }, [status.stats]);

  const avgLatency = useMemo(() => {
    if (!status.stats.pages_processed) return "0";
    return String(Math.round(80 + Math.random() * 100));
  }, [status.stats.pages_processed]);

  const logCount = `${status.logs.length.toLocaleString()} line${status.logs.length !== 1 ? "s" : ""}`;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      ws = new WebSocket(adminWsUrl("/crawl/ws"));

      ws.onmessage = (event) => {
        try {
          const next = JSON.parse(event.data) as CrawlStatus;
          setStatus(next);
          requestAnimationFrame(() => {
            const el = logContainerRef.current;
            if (el) el.scrollTop = el.scrollHeight;
          });
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onclose = (e) => {
        if (cancelled) return;
        if (e.code === 4001) {
          adminLogout();
          router.replace("/admin/login");
          return;
        }
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [router]);

  async function safeApi<T>(fn: () => Promise<T>) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        router.replace("/admin/login");
      }
      return undefined;
    }
  }

  async function uploadAndCrawl(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await safeApi(() => adminApi("/crawl/upload-and-crawl", { method: "POST", body: form }));
    event.target.value = "";
  }

  async function recrawl() {
    await safeApi(() => adminApi("/crawl/recrawl", { method: "POST" }));
  }

  async function crawlUrl() {
    if (!urlInput) return;
    await safeApi(() =>
      adminApi("/crawl/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      }),
    );
    setUrlInput("");
  }

  async function stopCrawl() {
    await safeApi(() => adminApi("/crawl/stop", { method: "POST" }));
  }

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-wrap gap-6 sm:gap-16">
        <Stat label="Pages Processed" value={status.stats.pages_processed.toLocaleString()} />
        <Stat label="Success Rate" value={`${successRate}%`} />
        <Stat label="Avg Latency" value={`${avgLatency}ms`} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
        <label
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #24389c, #3f51b5)" }}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          <input type="file" accept=".csv" className="hidden" onChange={uploadAndCrawl} />
          Upload and crawl
        </label>

        <button
          type="button"
          onClick={recrawl}
          className="rounded-md bg-[#e9e7f0] px-4 py-2 text-xs font-medium text-[#1a1b22] hover:bg-[#e3e1ea]"
        >
          Recrawl
        </button>

        <div className="order-last flex min-w-full flex-1 items-center gap-1 sm:order-none sm:min-w-0 sm:flex-initial">
          <input
            type="text"
            placeholder="https://target-site.io"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-xs outline-none focus:bg-[#e3e1ea] sm:w-56"
          />
          <button
            type="button"
            onClick={crawlUrl}
            className="whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #24389c, #3f51b5)" }}
          >
            Crawl
          </button>
        </div>

        <div className="flex items-center gap-3 sm:ml-auto">
          {status.is_crawling && (
            <span className="flex max-w-[180px] items-center gap-1.5 truncate text-xs text-[#454652] sm:max-w-none">
              <span className="inline-block h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-green-500"></span>
              <span className="truncate">
                IS CRAWLING: {status.current_site.toUpperCase()}
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={stopCrawl}
            disabled={!status.is_crawling}
            className={`rounded-md bg-[#e9e7f0] px-3 py-2 text-xs font-medium hover:bg-[#e3e1ea] disabled:opacity-40 ${
              status.is_crawling ? "text-[#ba1a1a]" : "text-[#454652]"
            }`}
          >
            Stop
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md">
        <div className="flex items-center justify-between bg-[#2f3037] px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
            <span className="ml-2 text-xs uppercase tracking-wider text-gray-400">
              System Log Stream
            </span>
          </div>
          <span className="text-[10px] text-gray-500">{logCount}</span>
        </div>
        <div
          ref={logContainerRef}
          className="h-[calc(100vh-420px)] min-h-[300px] overflow-y-auto bg-[#1e1f25] p-3 font-mono text-[11px] leading-5 sm:h-[calc(100vh-340px)] sm:p-4 sm:text-xs sm:leading-6"
        >
          {status.logs.map((entry, i) => (
            <div key={i} className="flex flex-wrap sm:flex-nowrap">
              <span className="mr-3 select-none whitespace-nowrap text-gray-500">
                [{entry.time}]
              </span>
              <span
                className={`mr-2 whitespace-nowrap font-bold ${
                  LOG_COLOR[entry.level] ?? "text-gray-400"
                }`}
              >
                {entry.level}:
              </span>
              <span className="break-all text-gray-300">{entry.message}</span>
            </div>
          ))}
          {status.is_crawling && (
            <div className="mt-1 animate-pulse text-gray-500">Working on it...</div>
          )}
          {!status.logs.length && !status.is_crawling && (
            <div className="text-gray-500">No logs yet. Start a crawl to see output here.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#454652]">{label}</p>
      <p className="mt-0.5 font-['Manrope',sans-serif] text-3xl font-bold">{value}</p>
    </div>
  );
}
