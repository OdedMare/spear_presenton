"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useMainStore } from "../store/main";
import { useSlidesStore } from "../store/slides";

export const useViewportSize = (canvasRef: React.RefObject<HTMLElement | null>) => {
  const canvasPercentage = useMainStore((s) => s.canvasPercentage);
  const canvasDragged = useMainStore((s) => s.canvasDragged);
  const setCanvasScale = useMainStore((s) => s.setCanvasScale);
  const setCanvasDragged = useMainStore((s) => s.setCanvasDragged);
  const viewportRatio = useSlidesStore((s) => s.viewportRatio);
  const viewportSize = useSlidesStore((s) => s.viewportSize);

  const [viewportLeft, setViewportLeft] = useState(0);
  const [viewportTop, setViewportTop] = useState(0);

  const initViewportPosition = useCallback(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvasWidth = canvasEl.clientWidth;
    const canvasHeight = canvasEl.clientHeight;

    if (canvasHeight / canvasWidth > viewportRatio) {
      const viewportActualWidth = canvasWidth * (canvasPercentage / 100);
      setCanvasScale(viewportActualWidth / viewportSize);
      setViewportLeft((canvasWidth - viewportActualWidth) / 2);
      setViewportTop((canvasHeight - viewportActualWidth * viewportRatio) / 2);
    } else {
      const viewportActualHeight = canvasHeight * (canvasPercentage / 100);
      setCanvasScale(viewportActualHeight / (viewportSize * viewportRatio));
      setViewportLeft((canvasWidth - viewportActualHeight / viewportRatio) / 2);
      setViewportTop((canvasHeight - viewportActualHeight) / 2);
    }
  }, [canvasRef, canvasPercentage, viewportRatio, viewportSize, setCanvasScale]);

  const setViewportPosition = useCallback(
    (newValue: number, oldValue: number) => {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const canvasWidth = canvasEl.clientWidth;
      const canvasHeight = canvasEl.clientHeight;

      if (canvasHeight / canvasWidth > viewportRatio) {
        const newViewportActualWidth = canvasWidth * (newValue / 100);
        const oldViewportActualWidth = canvasWidth * (oldValue / 100);
        const newViewportActualHeight = newViewportActualWidth * viewportRatio;
        const oldViewportActualHeight = oldViewportActualWidth * viewportRatio;

        setCanvasScale(newViewportActualWidth / viewportSize);
        setViewportLeft(
          (prev) => prev - (newViewportActualWidth - oldViewportActualWidth) / 2
        );
        setViewportTop(
          (prev) => prev - (newViewportActualHeight - oldViewportActualHeight) / 2
        );
      } else {
        const newViewportActualHeight = canvasHeight * (newValue / 100);
        const oldViewportActualHeight = canvasHeight * (oldValue / 100);
        const newViewportActualWidth = newViewportActualHeight / viewportRatio;
        const oldViewportActualWidth = oldViewportActualHeight / viewportRatio;

        setCanvasScale(newViewportActualHeight / (viewportSize * viewportRatio));
        setViewportLeft(
          (prev) => prev - (newViewportActualWidth - oldViewportActualWidth) / 2
        );
        setViewportTop(
          (prev) => prev - (newViewportActualHeight - oldViewportActualHeight) / 2
        );
      }
    },
    [canvasRef, viewportRatio, viewportSize, setCanvasScale]
  );

  useEffect(() => {
    initViewportPosition();
  }, [initViewportPosition, viewportRatio, viewportSize]);

  useEffect(() => {
    const prev = canvasPercentage;
    // This effect will rerun when canvasPercentage changes; compute relative shift
    setViewportPosition(canvasPercentage, prev);
  }, [canvasPercentage, setViewportPosition]);

  useEffect(() => {
    if (!canvasDragged) return;
    // Reset when drag state cleared
    initViewportPosition();
    setCanvasDragged(false);
  }, [canvasDragged, initViewportPosition, setCanvasDragged]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ro = new ResizeObserver(() => initViewportPosition());
    ro.observe(canvasEl);
    return () => {
      ro.disconnect();
    };
  }, [canvasRef, initViewportPosition]);

  const viewportStyles = useMemo(
    () => ({
      width: viewportSize,
      height: viewportSize * viewportRatio,
      left: viewportLeft,
      top: viewportTop,
    }),
    [viewportSize, viewportRatio, viewportLeft, viewportTop]
  );

  const dragViewport = (e: React.MouseEvent) => {
    let isMouseDown = true;
    const startPageX = e.pageX;
    const startPageY = e.pageY;
    const originLeft = viewportLeft;
    const originTop = viewportTop;

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;
      setViewportLeft(originLeft + (event.pageX - startPageX));
      setViewportTop(originTop + (event.pageY - startPageY));
    };
    const onMouseUp = () => {
      isMouseDown = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setCanvasDragged(true);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return {
    viewportStyles,
    dragViewport,
  };
};

