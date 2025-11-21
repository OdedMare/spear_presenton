# PowerPoint Online Clone - Implementation Guide

## 🎉 Progress So Far

### ✅ Completed
1. **TypeScript Types** - Complete type system (300+ lines)
2. **EditorContext** - Full state management with all operations
3. **EditorLayout** - Main PowerPoint-like interface structure
4. **PowerPoint CSS** - Professional Microsoft Office styling
5. **Dependencies Installed** - Konva, Slate, Framer Motion, etc.

### 📂 Files Created
```
servers/nextjs/app/(presentation-generator)/powerpoint-editor/
├── page.tsx                              ✅ Entry point
├── context/
│   └── EditorContext.tsx                 ✅ State management (600+ lines)
├── components/
│   └── EditorLayout.tsx                  ✅ Main layout
├── types/
│   └── index.ts                          ✅ Complete types (500+ lines)
└── styles/
    └── powerpoint.css                    ✅ PowerPoint styling (400+ lines)
```

## 🚧 Next Steps - Component by Component

### Priority 1: Core Components (Week 1)

#### 1.1 QuickAccessToolbar
**File**: `components/QuickAccessToolbar.tsx`

```typescript
"use client";
import React from "react";
import { Save, Undo, Redo } from "lucide-react";
import { useEditor } from "../context/EditorContext";

export const QuickAccessToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, savePresentation } = useEditor();

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#0078d4]">
      <button
        className="pptx-btn pptx-btn-icon text-white border-white/30"
        onClick={savePresentation}
        title="Save (Ctrl+S)"
      >
        <Save size={16} />
      </button>
      <button
        className="pptx-btn pptx-btn-icon text-white border-white/30"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={16} />
      </button>
      <button
        className="pptx-btn pptx-btn-icon text-white border-white/30"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={16} />
      </button>
      <div className="text-white text-sm ml-4">
        {/* Presentation name editable */}
        <input
          type="text"
          className="bg-transparent border-none outline-none text-white"
          defaultValue="Untitled Presentation"
        />
      </div>
    </div>
  );
};
```

#### 1.2 RibbonMenu
**File**: `components/RibbonMenu/RibbonMenu.tsx`

```typescript
"use client";
import React, { useState } from "react";
import { RibbonTab } from "../../types";
import { HomeTab } from "./HomeTab";
import { InsertTab } from "./InsertTab";
import { DesignTab } from "./DesignTab";
import { TransitionsTab } from "./TransitionsTab";
import { AnimationsTab } from "./AnimationsTab";

export const RibbonMenu: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");

  const tabs: { key: RibbonTab; label: string }[] = [
    { key: "home", label: "Home" },
    { key: "insert", label: "Insert" },
    { key: "design", label: "Design" },
    { key: "transitions", label: "Transitions" },
    { key: "animations", label: "Animations" },
    { key: "slideshow", label: "Slide Show" },
    { key: "review", label: "Review" },
    { key: "view", label: "View" },
  ];

  return (
    <div className="pptx-ribbon">
      <div className="pptx-ribbon-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`pptx-ribbon-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pptx-ribbon-content">
        {activeTab === "home" && <HomeTab />}
        {activeTab === "insert" && <InsertTab />}
        {activeTab === "design" && <DesignTab />}
        {activeTab === "transitions" && <TransitionsTab />}
        {activeTab === "animations" && <AnimationsTab />}
      </div>
    </div>
  );
};
```

#### 1.3 SlidesThumbnailPanel
**File**: `components/SlidesThumbnailPanel.tsx`

Use `@hello-pangea/dnd` for drag-to-reorder:

```typescript
"use client";
import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useEditor } from "../context/EditorContext";
import { Plus } from "lucide-react";

export const SlidesThumbnailPanel: React.FC = () => {
  const {
    presentation,
    currentSlideIndex,
    setCurrentSlide,
    addSlide,
    moveSlide,
  } = useEditor();

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    moveSlide(result.source.index, result.destination.index);
  };

  return (
    <div className="pptx-slides-panel">
      <button
        className="pptx-btn pptx-btn-primary w-full mb-2"
        onClick={() => addSlide()}
      >
        <Plus size={16} />
        New Slide
      </button>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="slides">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {presentation.slides.map((slide, index) => (
                <Draggable key={slide.id} draggableId={slide.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`pptx-slide-thumbnail ${
                        index === currentSlideIndex ? "active" : ""
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    >
                      <div className="pptx-slide-number">{index + 1}</div>
                      {/* TODO: Render slide preview */}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
```

#### 1.4 SlideCanvas with Konva
**File**: `components/Canvas/SlideCanvas.tsx`

```typescript
"use client";
import React, { useRef, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useEditor } from "../../context/EditorContext";
import { ElementRenderer } from "./ElementRenderer";

export const SlideCanvas: React.FC = () => {
  const { presentation, currentSlideIndex } = useEditor();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const slide = presentation.slides[currentSlideIndex];
  const containerRef = useRef<HTMLDivElement>(null);

  const stageWidth = presentation.width * zoom;
  const stageHeight = presentation.height * zoom;

  return (
    <div className="pptx-canvas" ref={containerRef}>
      <Stage
        width={stageWidth}
        height={stageHeight}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
      >
        <Layer>
          {/* Slide background */}
          <Rect
            x={0}
            y={0}
            width={presentation.width}
            height={presentation.height}
            fill={
              slide.background.type === "solid"
                ? slide.background.color
                : "#FFFFFF"
            }
          />

          {/* Render elements */}
          {slide.elements.map((element) => (
            <ElementRenderer key={element.id} element={element} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
```

#### 1.5 StatusBar
**File**: `components/StatusBar.tsx`

```typescript
"use client";
import React from "react";
import { useEditor } from "../context/EditorContext";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface StatusBarProps {
  onToggleNotes: () => void;
  showNotes: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ onToggleNotes, showNotes }) => {
  const { presentation, currentSlideIndex } = useEditor();
  const [zoom, setZoom] = React.useState(100);

  return (
    <div className="pptx-status-bar">
      <div className="flex items-center gap-4">
        <span>
          Slide {currentSlideIndex + 1} of {presentation.slides.length}
        </span>
        <button
          className="text-xs hover:underline"
          onClick={onToggleNotes}
        >
          {showNotes ? "Hide Notes" : "Show Notes"}
        </button>
      </div>

      <div className="pptx-zoom-controls">
        <button
          className="pptx-btn pptx-btn-icon"
          onClick={() => setZoom(Math.max(10, zoom - 10))}
        >
          <ZoomOut size={14} />
        </button>
        <input
          type="range"
          className="pptx-zoom-slider"
          min="10"
          max="400"
          value={zoom}
          onChange={(e) => setZoom(parseInt(e.target.value))}
        />
        <span className="text-xs w-12">{zoom}%</span>
        <button
          className="pptx-btn pptx-btn-icon"
          onClick={() => setZoom(Math.min(400, zoom + 10))}
        >
          <ZoomIn size={14} />
        </button>
        <button
          className="pptx-btn pptx-btn-icon"
          onClick={() => setZoom(100)}
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
};
```

### Priority 2: Ribbon Tabs (Week 2)

#### 2.1 HomeTab
**File**: `components/RibbonMenu/HomeTab.tsx`

Features:
- Font family/size dropdowns
- Bold, Italic, Underline buttons
- Text color picker
- Bullet list, numbered list
- Text alignment (left, center, right, justify)
- Shape insert buttons
- Arrange tools (bring front, send back)
- Layout dropdown

#### 2.2 InsertTab
**File**: `components/RibbonMenu/InsertTab.tsx`

Features:
- Image upload button
- Shapes gallery
- Table insert
- Chart insert
- Text box
- Video/Audio
- Icons
- Hyperlink

### Priority 3: Canvas Interactions (Week 3)

#### 3.1 ElementRenderer
**File**: `components/Canvas/ElementRenderer.tsx`

Render different element types:
- TextElement → Use Konva.Text
- ShapeElement → Use Konva shapes (Rect, Circle, Path)
- ImageElement → Use Konva.Image
- TableElement → Custom rendering
- ChartElement → Use Chart.js canvas

#### 3.2 Selection & Transform
**File**: `components/Canvas/SelectionTransformer.tsx`

Features:
- Selection box on click
- Multi-select with Shift+click
- Drag to reposition
- 8-point resize handles
- Rotation handle
- Alignment guides (smart guides)
- Snap to grid

### Priority 4: Rich Text Editor (Week 4)

**File**: `components/TextEditor/SlateTextEditor.tsx`

Use Slate.js for rich text:
- Bold, italic, underline
- Font family, size, color
- Bullet lists, numbered lists
- Alignment
- Inline editing on canvas

### Priority 5: Shape Library (Week 5)

**File**: `utils/shapes.ts`

Create 50+ shape path definitions using SVG paths:
```typescript
export const shapes: Record<ShapeType, string> = {
  rectangle: "M0,0 L100,0 L100,100 L0,100 Z",
  ellipse: "...", // SVG path
  triangle: "...",
  // ... 50+ more shapes
};
```

### Priority 6: Animations & Transitions (Week 6)

**Files**:
- `components/AnimationsPane.tsx`
- `utils/animations.ts`

Use Framer Motion for animations.

### Priority 7: PPTX Import/Export (Week 7)

**Backend API Endpoints** (FastAPI):
```python
@router.post("/api/v1/ppt/import")
async def import_pptx(file: UploadFile):
    # Use python-pptx to parse
    # Convert to our JSON format
    pass

@router.post("/api/v1/ppt/export")
async def export_pptx(presentation: dict):
    # Use python-pptx to generate
    # Return PPTX file
    pass
```

### Priority 8: Presentation Mode (Week 8)

**File**: `components/PresentationMode/Slideshow.tsx`

Full-screen slideshow with:
- Keyboard navigation
- Transitions
- Animations
- Presenter view

## 🔧 Development Workflow

### Daily Development
1. Pick a component from the priority list
2. Create the file
3. Implement basic functionality
4. Test in the browser
5. Add styling with PowerPoint CSS classes
6. Connect to EditorContext

### Testing Checklist
- [ ] Can add/delete/reorder slides
- [ ] Can add text boxes and shapes
- [ ] Can select and drag elements
- [ ] Can resize and rotate
- [ ] Can change colors and formatting
- [ ] Can undo/redo
- [ ] Can save presentation
- [ ] Can export to PPTX

## 📚 Key Libraries Documentation

- **Konva.js**: https://konvajs.org/docs/react/
- **Slate.js**: https://docs.slatejs.org/
- **Framer Motion**: https://www.framer.com/motion/
- **React Beautiful DnD**: https://github.com/hello-pangea/dnd

## 🎯 MVP Feature Checklist

Focus on these for first launch:
- [x] Editor layout
- [ ] Slide management (add, delete, reorder)
- [ ] Text boxes with basic formatting
- [ ] 10-15 basic shapes
- [ ] Image upload
- [ ] Drag and resize
- [ ] Copy/paste, undo/redo
- [ ] Export to PPTX
- [ ] Basic slideshow mode

## 🚀 Launch Roadmap

- **Week 1-2**: Core UI and basic shapes
- **Week 3-4**: Text editing and formatting
- **Week 5-6**: Complete shape library and images
- **Week 7**: PPTX import/export
- **Week 8**: Presentation mode and polish
- **Week 9**: Testing and bug fixes
- **Week 10**: Beta launch

## 💡 Tips & Best Practices

1. **Start Simple**: Get basic shapes working before complex features
2. **Test Early**: Test each component in isolation
3. **Use Context**: All state goes through EditorContext
4. **Performance**: Use React.memo for heavy components
5. **Keyboard Shortcuts**: Implement common shortcuts (Ctrl+C, Ctrl+V, Delete)
6. **Auto-save**: Save to localStorage every 30 seconds
7. **Error Handling**: Wrap everything in try-catch
8. **Mobile**: Make responsive (hide panels on mobile)

## 📞 Getting Help

If you get stuck:
1. Check the types in `types/index.ts` for data structure
2. Look at EditorContext for available operations
3. Use PowerPoint CSS classes for styling
4. Reference the examples above

Good luck! This will be an amazing project when complete! 🎉
