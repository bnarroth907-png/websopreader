"use client";

interface PdfViewerProps {
  fileUrl: string;
}

export function PdfViewer({ fileUrl }: PdfViewerProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <iframe
        title="PDF 預覽"
        src={fileUrl}
        className="min-h-0 h-full w-full flex-1 rounded border border-slate-200 bg-white dark:border-slate-700"
      />
      <p className="text-center text-sm text-slate-500">
        若預覽空白，請
        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          在新分頁開啟 PDF
        </a>
        。
      </p>
    </div>
  );
}
