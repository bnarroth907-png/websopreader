"use client";

interface PdfViewerProps {
  fileUrl: string;
}

export function PdfViewer({ fileUrl }: PdfViewerProps) {
  return (
    <div className="space-y-3">
      <iframe
        title="PDF preview"
        src={fileUrl}
        className="h-[80vh] w-full rounded border border-slate-200 bg-white dark:border-slate-700"
      />
      <p className="text-center text-sm text-slate-500">
        If the preview is blank,{" "}
        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          open the PDF in a new tab
        </a>
        .
      </p>
    </div>
  );
}
