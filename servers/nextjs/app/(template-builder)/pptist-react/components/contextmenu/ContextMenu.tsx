"use client";

import { useMemo } from "react";
import { MenuContent } from "./MenuContent";
import type { Axis, ContextMenuItem } from "./types";

const MENU_WIDTH = 180;
const MENU_HEIGHT = 30;
const DIVIDER_HEIGHT = 11;
const PADDING = 5;

export interface ContextMenuProps {
  axis: Axis;
  targetEl?: HTMLElement | null;
  menus: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ axis, targetEl, menus, onClose }: ContextMenuProps) {
  const style = useMemo(() => {
    const { x, y } = axis;
    const menuCount = menus.filter((m) => !(m.divider || m.hide)).length;
    const dividerCount = menus.filter((m) => m.divider).length;
    const menuHeight = menuCount * MENU_HEIGHT + dividerCount * DIVIDER_HEIGHT + PADDING * 2;

    const screenWidth = typeof document !== "undefined" ? document.body.clientWidth : 0;
    const screenHeight = typeof document !== "undefined" ? document.body.clientHeight : 0;

    return {
      left: screenWidth && screenWidth <= x + MENU_WIDTH ? x - MENU_WIDTH : x,
      top: screenHeight && screenHeight <= y + menuHeight ? y - menuHeight : y,
    };
  }, [axis, menus]);

  const handleClickMenuItem = (item: ContextMenuItem) => {
    if (item.disable) return;
    if (item.children && !item.handler) return;
    if (item.handler) item.handler(targetEl || undefined);
    onClose();
  };

  return (
    <>
      <div
        className="fixed left-0 top-0 h-screen w-screen z-[9998]"
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
        onMouseDown={(e) => {
          if (e.button === 0) onClose();
        }}
      />
      <div
        className="fixed z-[9999] user-select-none"
        style={{ left: style.left, top: style.top }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <MenuContent menus={menus} onClick={handleClickMenuItem} />
      </div>
    </>
  );
}

