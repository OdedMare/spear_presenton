"use client";

import type { CSSProperties } from "react";

interface AlignmentLine {
  type: "vertical" | "horizontal";
  x?: number;
  y?: number;
}

export function AlignmentLines({
  lines,
  scale,
}: {
  lines: AlignmentLine[];
  scale: number;
}) {
  return (
    <>
      {lines.map((line, idx) => {
        const style: CSSProperties =
          line.type === "vertical"
            ? {
                position: "absolute",
                left: (line.x || 0) * scale,
                top: 0,
                width: 1,
                height: "100%",
                background: "#3b82f6",
              }
            : {
                position: "absolute",
                top: (line.y || 0) * scale,
                left: 0,
                height: 1,
                width: "100%",
                background: "#3b82f6",
              };
        return <div key={idx} style={style} />;
      })}
    </>
  );
}

