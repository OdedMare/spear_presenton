"use client";

export default function InspectorPanel() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 text-sm text-slate-800">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        属性
      </div>
      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-slate-500">
        右侧属性面板迁移中（将包含文字/形状/图片等属性编辑）
      </div>
    </div>
  );
}

