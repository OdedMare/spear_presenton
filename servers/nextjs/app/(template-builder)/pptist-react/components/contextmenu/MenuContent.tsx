"use client";

import clsx from "clsx";
import type { ContextMenuItem } from "./types";

interface MenuContentProps {
  menus: ContextMenuItem[];
  onClick: (item: ContextMenuItem) => void;
}

export function MenuContent({ menus, onClick }: MenuContentProps) {
  return (
    <ul className="pptist-menu-content rounded border border-slate-200 bg-white shadow-lg">
      {menus.map((menu, index) => {
        if (menu.hide) return null;
        if (menu.divider) {
          return (
            <li
              key={menu.text || index}
              className="my-[5px] h-px overflow-hidden bg-slate-200 px-0"
            />
          );
        }
        const hasChildren = !!menu.children?.length;
        return (
          <li
            key={menu.text || index}
            onClick={(e) => {
              e.stopPropagation();
              if (menu.disable) return;
              if (hasChildren && !menu.handler) return;
              onClick(menu);
            }}
            className={clsx(
              "relative h-[30px] cursor-pointer select-none px-5 text-[12px] leading-[30px] transition",
              menu.disable
                ? "text-slate-400 cursor-not-allowed"
                : "text-slate-800 hover:bg-indigo-50"
            )}
          >
            <div
              className={clsx(
                "flex items-center justify-between",
                hasChildren && "pr-3"
              )}
            >
              <span className="truncate">{menu.text}</span>
              {!hasChildren && menu.subText && (
                <span className="truncate text-slate-500/70">{menu.subText}</span>
              )}
            </div>
            {hasChildren && (
              <>
                <span className="pointer-events-none absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-slate-500" />
                <div className="absolute left-[112%] top-[-6px] hidden min-w-[120px] group-hover:block">
                  <MenuContent menus={menu.children || []} onClick={onClick} />
                </div>
              </>
            )}
          </li>
        );
      })}
      <style jsx>{`
        .pptist-menu-content {
          width: 180px;
          padding: 5px 0;
          list-style: none;
          margin: 0;
        }
        .pptist-menu-content li:hover > div > .sub-menu {
          display: block;
        }
      `}</style>
    </ul>
  );
}

