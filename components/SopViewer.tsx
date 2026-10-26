"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { MediaViewer } from "@/components/MediaViewer";
import { PdfViewer } from "@/components/PdfViewer";
import type { SopDetail } from "@/lib/sops/types";

interface SopViewerProps {
  detail: SopDetail | null;
  loading: boolean;
  error: string | null;
}

export function SopViewer({ detail, loading, error }: SopViewerProps) {
  if (loading) {
    return (
      <div className="mx-auto h-full max-w-4xl overflow-y-auto">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
          <p className="text-slate-500">正在載入作業程序…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto h-full max-w-4xl overflow-y-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto h-full max-w-4xl overflow-y-auto">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-3xl font-bold">標準作業程序</h2>
          <p className="mb-6 text-lg text-slate-600 dark:text-slate-400">
            請從側邊欄選擇作業程序，或上傳文件、圖片、音訊與影片。
          </p>
          <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
              <h3 className="font-semibold">搜尋</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">以關鍵字快速找到作業程序</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
              <h3 className="font-semibold">上傳</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">將文件儲存於伺服器</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950/30">
              <h3 className="font-semibold">響應式設計</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">適用於各種裝置</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fillPanel =
    Boolean(detail.fileUrl) &&
    (detail.type === "pdf" || detail.type === "image" || detail.type === "audio" || detail.type === "video");

  return (
    <div className={fillPanel ? "h-full min-h-0" : "mx-auto h-full max-w-4xl overflow-y-auto"}>
      <article
        className={
          fillPanel
            ? "flex h-full min-h-0 flex-col rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900"
            : "rounded-xl bg-white p-6 shadow-sm md:p-8 dark:bg-slate-900"
        }
      >
        {detail.type === "pdf" && detail.fileUrl ? (
          <PdfViewer fileUrl={detail.fileUrl} />
        ) : (detail.type === "image" || detail.type === "audio" || detail.type === "video") && detail.fileUrl ? (
          <MediaViewer type={detail.type} fileUrl={detail.fileUrl} title={detail.title} />
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {detail.content}
            </ReactMarkdown>
          </div>
        )}
      </article>
    </div>
  );
}
