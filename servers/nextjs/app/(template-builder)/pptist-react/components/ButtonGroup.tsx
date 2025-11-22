"use client";

import clsx from "clsx";
import { PropsWithChildren } from "react";

type ButtonGroupProps = PropsWithChildren<{
  passive?: boolean;
}>;

/**
 * Simple horizontal button group that mirrors PPTist grouping styles:
 * - Adjacent buttons share borders; first/last get rounded corners.
 * - When passive=true, caller can pass .first/.last to control rounding.
 */
export default function ButtonGroup({ passive = false, children }: ButtonGroupProps) {
  return (
    <div
      className={clsx(
        "pptist-btn-group",
        "flex items-center",
        passive ? "pptist-btn-group-passive" : "pptist-btn-group-active"
      )}
    >
      {children}
      <style jsx>{`
        .pptist-btn-group :global(button.button) {
          border-radius: 0;
          border-left-width: 1px;
          border-right-width: 0;
          display: inline-block;
        }
        .pptist-btn-group-active :global(button.button:first-child) {
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
          border-left-width: 1px;
        }
        .pptist-btn-group-active :global(button.button:last-child) {
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
          border-right-width: 1px;
        }
        .pptist-btn-group-active
          :global(button.button:not(:last-child):not(.radio):not(.checkbox):hover)::after {
          content: "";
          width: 1px;
          height: calc(100% + 2px);
          background-color: #4f46e5;
          position: absolute;
          top: -1px;
          right: -1px;
        }
        .pptist-btn-group-passive :global(button.button.first) {
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
          border-left-width: 1px;
        }
        .pptist-btn-group-passive :global(button.button.last) {
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
          border-right-width: 1px;
        }
        .pptist-btn-group-passive
          :global(button.button:not(.last):not(.radio):not(.checkbox):hover)::after {
          content: "";
          width: 1px;
          height: calc(100% + 2px);
          background-color: #4f46e5;
          position: absolute;
          top: -1px;
          right: -1px;
        }
      `}</style>
    </div>
  );
}

