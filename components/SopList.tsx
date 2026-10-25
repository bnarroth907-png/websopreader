"use client";

import type { SopListItem } from "@/lib/sops/types";

interface SopListProps {
  items: SopListItem[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  onSelect: (id: string) => void;
  onDelete: (item: SopListItem) => void;
}

export function SopList({
  items,
  selectedId,
  loading,
  error,
  emptyMessage,
  onSelect,
  onDelete,
}: SopListProps) {
  if (loading) {
    return <p className="px-2 py-6 text-sm text-slate-500">Loading procedures…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="px-2 py-6 text-sm text-slate-500">{emptyMessage}</p>;
  }

  const categories = [...new Set(items.map((item) => item.category))];

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <section key={category}>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {category}
          </h3>
          <div className="space-y-1">
            {items
              .filter((item) => item.category === category)
              .map((item) => {
                const selected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    className={`group relative cursor-pointer rounded-lg p-3 transition-colors ${
                      selected
                        ? "bg-blue-50 dark:bg-blue-950/40"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full pr-6 text-left"
                      onClick={() => onSelect(item.id)}
                    >
                      <div className="font-medium">
                        {item.title}
                        {item.isUploaded ? (
                          <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                            Uploaded
                          </span>
                        ) : null}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{item.description}</div>
                    </button>
                    {item.isUploaded ? (
                      <button
                        type="button"
                        className="absolute top-2 right-2 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => onDelete(item)}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
