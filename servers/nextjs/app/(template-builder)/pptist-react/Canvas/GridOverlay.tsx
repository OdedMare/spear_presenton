"use client";

export function GridOverlay({ gridSize }: { gridSize: number }) {
  if (!gridSize || gridSize <= 0) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(148, 163, 184, 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.35) 1px, transparent 1px)",
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
}
