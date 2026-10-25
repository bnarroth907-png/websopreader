"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
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
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
          <p className="text-slate-500">Loading procedure…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-3xl font-bold">Standard Operating Procedures</h2>
          <p className="mb-6 text-lg text-slate-600 dark:text-slate-400">
            Select an SOP from the sidebar or upload your own files (.md, .txt, .pdf).
          </p>
          <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
              <h3 className="font-semibold">Search</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Quickly find procedures by keyword</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
              <h3 className="font-semibold">Upload</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Add documents stored on the server</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950/30">
              <h3 className="font-semibold">Responsive</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Works on all devices</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <article className="rounded-xl bg-white p-6 shadow-sm md:p-8 dark:bg-slate-900">
        {detail.type === "pdf" && detail.fileUrl ? (
          <PdfViewer fileUrl={detail.fileUrl} />
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
