# Presenton PPTX Creator – Engineering Log (PPTist React)

This document tracks the native React/Next PPTX editor: what works today, recent additions, and the remaining work to reach full PowerPoint Online parity.

## Current Capabilities
- **State & canvas**: slides/elements CRUD (text, shape, image), multi-select, drag/resize/rotate, z-order, snapping to slide center/edges/elements, pan/zoom scaffold.
- **Selection/arrange**: align/distribute, rotate 90°, mirror H/V, snap-to-grid with adjustable size, manual guides, multi-select move with snap feedback, layer ordering.
- **Text editing**: inline contentEditable on double-click or typing; text alignment, size, line-height, letter-spacing, bold/italic/underline/strike, bullets/numbering, highlight color, link field; rebuilds HTML safely; Tab/Shift+Tab cycles text boxes.
- **Shapes**: presets (rect, round-rect, ellipse, diamond, parallelogram, trapezoid, hexagon, star, cloud, chevron, arrow up/down/left/right, callout-rect), corner radius, outline color/width/style, fill (solid/gradient scaffold).
- **Images**: flip H/V, numeric crop inset, opacity, object-fit.
- **Colors**: upgraded picker with theme swatches, recent colors (global), transparent option, and standard palette; applied to background, text, fill, and outline.
- **Inspector**: position/size/rotation inputs; color/outline/shadow controls; image fit/opacity/flip/crop; text typography panel; shape preset/outline style panel.
- **Toolbar**: quick add text/shape; fill/outline pickers; align/distribute/rotate/mirror; grid snap and guide controls; layer ordering; hide/show.
- **Slides panel**: add/duplicate/delete, drag reorder.
- **Export**: PPTist JSON → Presenton layout → html-to-react → save template preview.
- **Build**: dynamic route flags; removed blocking fonts/deps.

## Recent Additions (this session)
- Inline text editing with double-click/type-to-edit, hotkey suppression while editing, and Tab navigation across text boxes.
- Color system with theme + recent palettes and transparent option.
- Expanded shape presets and outline style options.
- Snap-to-grid/guides and align/distribute/rotate/mirror actions with hotkeys.
- Image flip and crop inset controls.

## Outstanding Work for PowerPoint-Online Parity
- **Rich text engine**: nested runs (per-span bold/italic/size/color/highlight/link), bullets/numbering with indentation and levels, tabs/ruler, columns, sub/superscript, vertical text, auto-fit/auto-shrink, paste formatting fidelity, text highlight per run.
- **Shapes & vectors**: full preset library (flowchart/callouts/smart shapes), custom path support, shape combine (union/intersect/subtract), adjustable handles, per-corner radii, multi-stop gradients (angles, radial, path), pattern/texture fills, 3D/bevel/soft edges, line caps/joins/dash styles matching PowerPoint, rotation center offset, group/ungroup.
- **Image tools**: interactive crop handles, replace image, masks (circle/rounded/custom), soft edges, brightness/contrast/saturation/blur adjustments, background removal option.
- **Slide master & themes**: theme palettes (12), theme fonts (head/body), effects, slide master editor, layouts (title, two-column, section header, comparison, blank, title+content), apply theme to existing slides, save custom themes, global background/theme settings.
- **Guides & alignment**: smart guides, ruler/grid UI, nudge with arrow keys + Shift/Alt modifiers, rotate left/right buttons on toolbar, mirror via UI icons (done) plus menu/context integration.
- **Animations & transitions**: element animations (in/out/emphasis), timeline/sequencing, slide transitions with easing.
- **Slide metadata**: notes, slide numbers, footer/header fields, date/time placeholders.
- **UI panels/tools**: full format panel, Insert (icons, symbols, tables, charts, SmartArt-lite, equation), Review (spell-check, comments), view modes (Normal/Slide Sorter/Notes Page).
- **Clipboard & history**: full undo/redo for all actions, copy/paste across slides, duplicate with formatting, format painter, Alt-drag duplicate.
- **Import/Export**: PPTX import (OOXML → PPTist JSON), PPTX export, JSON import/export UI, snapshot thumbnails generator.
- **Accessibility**: alt text for images, reading order panel, contrast checker, full keyboard navigation.
- **Performance & polish**: selection/drag perf, thumbnails with visual previews, caret placement improvements when entering edit mode, hover/handles parity, context menu actions mirroring toolbar.

## Hotkeys (implemented)
- Align left/right/top/bottom/center/middle: Cmd/Ctrl + Shift + Arrow or C/M.
- Distribute H/V: Cmd/Ctrl + Alt + H/V.
- Rotate 90°: Cmd/Ctrl + [ or ].
- Mirror H/V: Cmd/Ctrl + Shift + H/V.
- Delete selection: Delete/Backspace.
- Tab/Shift+Tab while editing text: cycle text boxes.

## Code Map (where each capability lives)
- **State & canvas**: `pptist-react/store/slides.ts` (slides/elements CRUD, z-order), `pptist-react/store/main.ts` (selection/snap state), `pptist-react/Canvas/CanvasStage.tsx` (render, drag/resize/rotate, snapping, pan/zoom scaffold), `pptist-react/Canvas/SelectionHandles.tsx`.
- **Selection/arrange**: `pptist-react/utils/alignment.ts` + actions in `store/slides.ts`; toolbar buttons in `Toolbar/CanvasToolbar.tsx`; hotkeys in `hooks/useAlignmentHotkeys.ts`; guides/grid in `store/main.ts` + `CanvasStage.tsx`; layer ordering in `store/slides.ts` and `CanvasToolbar.tsx`.
- **Text editing**: inline edit in `Canvas/EditableElement.tsx` (double-click/type, Tab cycling, safe rebuild via `buildHtmlFromPlainText`); typography props (align/size/line-height/letter-spacing/bold/italic/underline/strike/bullets/numbering/highlight/link); inspector controls in `Inspector/InspectorPanel.tsx`; edit-mode hotkeys in `hooks/useEditingFlowHotkeys.ts`.
- **Shapes**: presets/clip-paths in `Canvas/EditableElement.tsx`; preset selector + corner radius + outline styles in `Inspector/InspectorPanel.tsx`; defaults in `Toolbar/CanvasToolbar.tsx`.
- **Images**: flip/crop/opacity/object-fit rendered in `Canvas/EditableElement.tsx`; controls in `Inspector/InspectorPanel.tsx`.
- **Colors**: picker with theme/recent/transparent in `components/ColorPicker.tsx`; recent colors in `store/main.ts`; applied in inspector/background/toolbar pickers.
- **Inspector**: position/size/rotation; color/outline/shadow; image fit/opacity/flip/crop; text typography; shape preset/outline style in `Inspector/InspectorPanel.tsx`.
- **Toolbar**: add text/shape; fill/outline; align/distribute/rotate/mirror; grid/guide; layer ordering; hide/show in `Toolbar/CanvasToolbar.tsx`.
- **Slides panel**: add/duplicate/delete, drag reorder in `Slides/ThumbnailStrip.tsx`.
- **Export**: PPTist JSON → Presenton layout → html-to-react → save template in `hooks/usePresentonExport.ts`.
- **Build flags/fixes**: `app/api/presentation_to_pptx_model/route.ts` (dynamic), font/dependency cleanup noted in `README.md`.
