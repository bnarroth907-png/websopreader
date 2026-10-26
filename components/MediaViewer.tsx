"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SopDocumentType } from "@/lib/sops/types";

interface MediaViewerProps {
  type: Extract<SopDocumentType, "image" | "audio" | "video">;
  fileUrl: string;
  title: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface ImageTransform {
  x: number;
  y: number;
  scale: number;
  fitScale: number;
  naturalWidth: number;
  naturalHeight: number;
}

function ImageFitZoom({ fileUrl, title }: { fileUrl: string; title: string }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const transformRef = useRef<ImageTransform>({
    x: 0,
    y: 0,
    scale: 1,
    fitScale: 1,
    naturalWidth: 0,
    naturalHeight: 0,
  });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const hintRef = useRef<HTMLParagraphElement | null>(null);

  const applyTransform = useCallback(() => {
    const image = imageRef.current;
    const transform = transformRef.current;
    if (!image) {
      return;
    }
    image.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`;
    const percent = transform.fitScale > 0 ? Math.round((transform.scale / transform.fitScale) * 100) : 100;
    if (hintRef.current) {
      hintRef.current.textContent = `滾輪縮放（${percent}%）・左鍵拖曳移動・雙擊還原適合視窗`;
    }
  }, []);

  const clampPan = useCallback(() => {
    const viewport = viewportRef.current;
    const transform = transformRef.current;
    if (!viewport || transform.naturalWidth === 0) {
      return;
    }
    const viewWidth = viewport.clientWidth;
    const viewHeight = viewport.clientHeight;
    const width = transform.naturalWidth * transform.scale;
    const height = transform.naturalHeight * transform.scale;
    if (width <= viewWidth) {
      transform.x = (viewWidth - width) / 2;
    } else {
      transform.x = clamp(transform.x, viewWidth - width, 0);
    }
    if (height <= viewHeight) {
      transform.y = (viewHeight - height) / 2;
    } else {
      transform.y = clamp(transform.y, viewHeight - height, 0);
    }
  }, []);

  const fitToView = useCallback(
    (preserveRelative: boolean) => {
      const viewport = viewportRef.current;
      const image = imageRef.current;
      if (!viewport || !image || image.naturalWidth === 0) {
        return;
      }
      const transform = transformRef.current;
      const previousRelative = transform.fitScale > 0 ? transform.scale / transform.fitScale : 1;
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;
      image.style.width = `${naturalWidth}px`;
      image.style.height = `${naturalHeight}px`;
      const fitScale = Math.min(viewport.clientWidth / naturalWidth, viewport.clientHeight / naturalHeight);
      transform.naturalWidth = naturalWidth;
      transform.naturalHeight = naturalHeight;
      transform.fitScale = fitScale;
      transform.scale = preserveRelative ? clamp(previousRelative * fitScale, fitScale * 0.2, fitScale * 8) : fitScale;
      clampPan();
      applyTransform();
    },
    [applyTransform, clampPan],
  );

  useEffect(() => {
    transformRef.current = { x: 0, y: 0, scale: 1, fitScale: 1, naturalWidth: 0, naturalHeight: 0 };
    if (hintRef.current) {
      hintRef.current.textContent = "滾輪縮放（100%）・左鍵拖曳移動・雙擊還原適合視窗";
    }
  }, [fileUrl]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const observer = new ResizeObserver(() => fitToView(true));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitToView]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const transform = transformRef.current;
      if (transform.naturalWidth === 0) {
        return;
      }
      const previous = transform.scale;
      const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
      const next = clamp(previous * factor, transform.fitScale * 0.2, transform.fitScale * 8);
      if (next === previous) {
        return;
      }
      const rect = viewport.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;
      const imageX = (cursorX - transform.x) / previous;
      const imageY = (cursorY - transform.y) / previous;
      transform.scale = next;
      transform.x = cursorX - imageX * next;
      transform.y = cursorY - imageY * next;
      clampPan();
      applyTransform();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      const transform = transformRef.current;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: transform.x,
        originY: transform.y,
      };
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.remove("cursor-grab");
      viewport.classList.add("cursor-grabbing");
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const transform = transformRef.current;
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      transform.x = drag.originX + (event.clientX - drag.startX);
      transform.y = drag.originY + (event.clientY - drag.startY);
      clampPan();
      applyTransform();
    };

    const endDrag = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      dragRef.current = null;
      viewport.classList.remove("cursor-grabbing");
      viewport.classList.add("cursor-grab");
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    };

    const onDoubleClick = (event: MouseEvent) => {
      event.preventDefault();
      fitToView(false);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("dblclick", onDoubleClick);
    return () => {
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", endDrag);
      viewport.removeEventListener("pointercancel", endDrag);
      viewport.removeEventListener("dblclick", onDoubleClick);
    };
  }, [applyTransform, clampPan, fitToView]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 cursor-grab touch-none select-none overflow-hidden rounded bg-slate-100 dark:bg-slate-950"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={fileUrl}
          alt={title}
          onLoad={() => fitToView(false)}
          draggable={false}
          className="pointer-events-none absolute top-0 left-0 max-h-none max-w-none origin-top-left select-none"
          style={{ willChange: "transform" }}
        />
      </div>
      <p ref={hintRef} className="mt-2 shrink-0 text-center text-xs text-slate-500">
        滾輪縮放（100%）・左鍵拖曳移動・雙擊還原適合視窗
      </p>
    </div>
  );
}

export function MediaViewer({ type, fileUrl, title }: MediaViewerProps) {
  if (type === "image") {
    return <ImageFitZoom fileUrl={fileUrl} title={title} />;
  }

  if (type === "audio") {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4">
        <audio controls src={fileUrl} className="w-full max-w-xl">
          您的瀏覽器不支援音訊播放。
        </audio>
        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
          下載音訊
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <video controls src={fileUrl} className="min-h-0 h-full w-full rounded bg-black object-contain">
        您的瀏覽器不支援影片播放。
      </video>
      <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-2 shrink-0 text-center text-sm text-blue-600 underline">
        下載影片
      </a>
    </div>
  );
}
