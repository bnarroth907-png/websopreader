"use client";

import { SopList } from "@/components/SopList";
import { UploadControl } from "@/components/UploadControl";
import type { SopListItem, SopSortField } from "@/lib/sops/types";

interface SopSidebarProps {
  appName: string;
  open: boolean;
  query: string;
  sort: SopSortField;
  items: SopListItem[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  uploading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSortChange: (value: SopSortField) => void;
  onSelect: (id: string) => void;
  onDelete: (item: SopListItem) => void;
  onFiles: (files: FileList) => void;
  onPageChange: (page: number) => void;
}

export function SopSidebar({
  appName,
  open,
  query,
  sort,
  items,
  selectedId,
  loading,
  error,
  uploading,
  page,
  totalPages,
  total,
  onClose,
  onQueryChange,
  onSortChange,
  onSelect,
  onDelete,
  onFiles,
  onPageChange,
}: SopSidebarProps) {
  return (
    <aside
      className={`fixed z-20 h-full w-80 overflow-y-auto border-r border-slate-200 bg-white shadow-lg transition-transform md:relative md:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="border-b border-slate-200 p-6 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{appName}</h1>
          <button type="button" className="text-slate-500 md:hidden" onClick={onClose} aria-label="Close sidebar">
            ×
          </button>
        </div>
        <div className="mt-4">
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search SOPs..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800"
          />
        </div>
        <div className="mt-3">
          <label className="sr-only" htmlFor="sop-sort">
            Sort
          </label>
          <select
            id="sop-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SopSortField)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="title">Sort by title</option>
            <option value="category">Sort by category</option>
            <option value="createdAt">Sort by newest</option>
          </select>
        </div>
        <div className="mt-4">
          <UploadControl disabled={uploading} onFiles={onFiles} />
          <p className="mt-2 text-center text-xs text-slate-500">Supports .md, .txt, .pdf</p>
        </div>
      </div>
      <div className="p-4">
        <SopList
          items={items}
          selectedId={selectedId}
          loading={loading}
          error={error}
          emptyMessage={query ? "No procedures match your search." : "No procedures are available yet."}
          onSelect={onSelect}
          onDelete={onDelete}
        />
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            {total} item{total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40 dark:border-slate-600"
            >
              Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40 dark:border-slate-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
