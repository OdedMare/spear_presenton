"use client";

import { useState, useCallback } from "react";
import type { Axis, ContextMenuItem } from "../components/contextmenu/types";

export const useContextMenu = () => {
  const [axis, setAxis] = useState<Axis | null>(null);
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);
  const [menus, setMenus] = useState<ContextMenuItem[]>([]);

  const openContextMenu = useCallback(
    (event: React.MouseEvent, items: ContextMenuItem[]) => {
      event.preventDefault();
      setAxis({ x: event.clientX, y: event.clientY });
      setTargetEl(event.currentTarget as HTMLElement);
      setMenus(items);
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setAxis(null);
    setTargetEl(null);
    setMenus([]);
  }, []);

  return {
    axis,
    targetEl,
    menus,
    openContextMenu,
    closeContextMenu,
    isOpen: !!axis,
  };
};

