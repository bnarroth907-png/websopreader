"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SopSidebar } from "@/components/SopSidebar";
import { SopViewer } from "@/components/SopViewer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ApiRequestError, apiRequest } from "@/lib/api/request";
import type { PaginatedSops, SopDetail, SopListItem, SopSortField } from "@/lib/sops/types";

interface SopWorkspaceProps {
  appName: string;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }
  return fallback;
}

export function SopWorkspace({ appName }: SopWorkspaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<SopSortField>("title");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<PaginatedSops | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SopDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        sort,
        q: debouncedQuery,
      });
      const envelope = await apiRequest<PaginatedSops>(`/api/sops?${params.toString()}`);
      setList(envelope.data);
    } catch (error) {
      setList(null);
      setListError(errorMessage(error, "Unable to load procedures right now."));
    } finally {
      setListLoading(false);
    }
  }, [debouncedQuery, page, sort]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const envelope = await apiRequest<SopDetail>(`/api/sops/${encodeURIComponent(id)}`);
      setDetail(envelope.data);
    } catch (error) {
      setDetail(null);
      setDetailError(errorMessage(error, "Unable to load that procedure."));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSidebarOpen(false);
    void loadDetail(id);
  };

  const handleDelete = async (item: SopListItem) => {
    if (!window.confirm(`Remove "${item.title}"?`)) {
      return;
    }
    try {
      await apiRequest<{ id: string }>(`/api/sops/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      if (selectedId === item.id) {
        setSelectedId(null);
        setDetail(null);
      }
      await loadList();
    } catch (error) {
      setNotice(errorMessage(error, "Unable to remove that procedure."));
    }
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    setNotice(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        await apiRequest<SopListItem>("/api/sops", { method: "POST", body: form });
      }
      await loadList();
    } catch (error) {
      setNotice(errorMessage(error, "Unable to upload that file."));
    } finally {
      setUploading(false);
    }
  };

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("sop-reader-theme", next ? "dark" : "light");
    setDark(next);
  };

  const title = useMemo(() => {
    if (detail) {
      return detail.title;
    }
    return `Welcome to ${appName}`;
  }, [appName, detail]);

  return (
    <div className="flex h-screen overflow-hidden">
      <SopSidebar
        appName={appName}
        open={sidebarOpen}
        query={query}
        sort={sort}
        items={list?.items ?? []}
        selectedId={selectedId}
        loading={listLoading}
        error={listError}
        uploading={uploading}
        page={list?.page ?? page}
        totalPages={list?.totalPages ?? 1}
        total={list?.total ?? 0}
        onClose={() => setSidebarOpen(false)}
        onQueryChange={setQuery}
        onSortChange={(value) => {
          setSort(value);
          setPage(1);
        }}
        onSelect={handleSelect}
        onDelete={(item) => {
          void handleDelete(item);
        }}
        onFiles={(files) => {
          void handleFiles(files);
        }}
        onPageChange={setPage}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="no-print flex items-center justify-between border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            className="mr-4 text-slate-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            Menu
          </button>
          <h2 className="flex-1 text-xl font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            <ThemeToggle dark={dark} onToggle={toggleTheme} />
            {detail ? (
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Print
              </button>
            ) : null}
          </div>
        </header>
        {notice ? (
          <div className="no-print border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {notice}
          </div>
        ) : null}
        <main className="print-area flex-1 overflow-y-auto p-6 md:p-8">
          <SopViewer detail={selectedId ? detail : null} loading={Boolean(selectedId) && detailLoading} error={detailError} />
        </main>
      </div>
    </div>
  );
}
