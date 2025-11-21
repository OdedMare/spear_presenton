# Visual Template Builder

## Overview

The Visual Template Builder allows users to create custom presentation layouts directly in the web interface without needing to upload PPTX files. This is a fully client-side, drag-and-drop canvas editor.

## Features

### ✨ Visual Editing
- **Drag-and-drop interface**: Click and drag elements to reposition them
- **Visual resize handles**: 8-point resize handles (corners + edges) for precise sizing
- **Real-time preview**: See your template as you build it
- **Multi-slide support**: Create templates with multiple slide layouts

### 🎨 Element Types
1. **Text Boxes**
   - Editable text content
   - Font size control
   - Text color picker
   - Text alignment (left, center, right, justify)
   - Background fill color

2. **Shapes**
   - Rectangle and circle/oval shapes
   - Fill color picker
   - Border/stroke support
   - Various geometric shapes

3. **Image Placeholders**
   - Add image placeholders for AI-generated images
   - Configure size and position
   - Object-fit options (cover, contain)

### ⚙️ Properties Panel
- **Position & Size**: Precise X/Y coordinates and width/height inputs
- **Colors**: Color pickers with hex input for fills, text, and strokes
- **Rotation**: Slider control for element rotation (-180° to 180°)
- **Opacity**: Transparency control (0-100%)
- **Slide Background**: Set slide background color

### 💾 Save & Reuse
- **Save as Template**: Save your layouts to the template library
- **Template Metadata**: Add name and description
- **Reusable**: Use saved templates for AI presentation generation

## Architecture

### Frontend Structure
```
app/(presentation-generator)/template-builder/
├── page.tsx                          # Main template builder page
├── components/
│   ├── Canvas.tsx                    # Drag-and-drop canvas with elements
│   ├── Toolbar.tsx                   # Element type selection sidebar
│   ├── PropertiesPanel.tsx           # Element/slide properties editor
│   └── SaveTemplateDialog.tsx        # Save template modal
├── hooks/
│   └── useTemplateBuilder.ts         # State management hook
├── services/
│   └── api.ts                        # API calls to backend
└── types/
    └── index.ts                      # TypeScript interfaces
```

### Backend Structure
```
servers/fastapi/api/v1/ppt/endpoints/
└── template_save.py                  # Template save/list/get endpoints
```

### API Endpoints

#### POST `/api/v1/ppt/template/save`
Save a new template to the filesystem.

**Request:**
```json
{
  "name": "My Custom Template",
  "description": "A template with custom layouts",
  "slides": [
    {
      "id": "uuid",
      "index": 0,
      "width_px": 1280,
      "height_px": 720,
      "background": { "type": "solid", "color": "#FFFFFF" },
      "fonts": ["Arial", "Helvetica"],
      "elements": [
        {
          "id": "uuid",
          "type": "text",
          "bbox": { "x": 100, "y": 100, "width": 400, "height": 100 },
          "z": 0,
          "rotation": 0,
          "opacity": 1,
          "align": "center",
          "runs": [...],
          "bullets": [],
          "fill": { "type": "solid", "color": "#F3F4F6" }
        }
      ]
    }
  ],
  "width_px": 1280,
  "height_px": 720,
  "fonts": ["Arial", "Helvetica"]
}
```

**Response:**
```json
{
  "success": true,
  "template_id": "uuid",
  "message": "Template 'My Custom Template' saved successfully"
}
```

#### GET `/api/v1/ppt/template/list`
List all saved templates.

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "My Custom Template",
      "description": "A template with custom layouts",
      "num_slides": 3
    }
  ]
}
```

#### GET `/api/v1/ppt/template/{template_id}`
Get a specific template by ID.

**Response:**
```json
{
  "id": "uuid",
  "name": "My Custom Template",
  "description": "...",
  "slides": [...],
  "width_px": 1280,
  "height_px": 720,
  "fonts": [...]
}
```

## Usage Guide

### Creating a Template

1. **Access the Builder**
   - Click "Visual Builder" in the top navigation
   - Or navigate to `/template-builder`

2. **Add Elements**
   - Click element type buttons in the left sidebar:
     - "Text Box" - Add editable text
     - "Shape" - Add rectangle/circle
     - "Image" - Add image placeholder

3. **Position & Size**
   - **Drag**: Click and drag elements to move them
   - **Resize**: Click element → drag resize handles (blue dots)
   - **Precise values**: Use Properties Panel for exact positioning

4. **Style Elements**
   - Select an element
   - Use Properties Panel on the right to:
     - Change colors
     - Adjust text content and font size
     - Rotate elements
     - Change opacity
     - Set alignment

5. **Manage Slides**
   - **Add Slide**: Click "+ Add" button in slides panel
   - **Switch Slides**: Click slide thumbnails
   - **Delete Slide**: Click × on slide thumbnail (minimum 1 slide)

6. **Save Template**
   - Click "Save Template" button (top right)
   - Enter template name and description
   - Template is saved and can be used for AI generation

### Using Saved Templates

Saved templates appear in:
- Template Preview page (`/template-preview`)
- Template selector during presentation generation
- Can be edited and re-saved

## Data Storage

Templates are stored in:
```
{APP_DATA_DIRECTORY}/layout_templates/{template_id}.json
```

Each template file contains:
- Template metadata (id, name, description)
- Slide layouts with element positions and styles
- Font list
- Dimensions (width_px, height_px)

## Benefits Over PPTX Upload

1. **No file dependencies**: Create templates directly in browser
2. **Faster workflow**: No need to design in PowerPoint first
3. **Real-time editing**: Immediate visual feedback
4. **Precise control**: Pixel-perfect positioning with inputs
5. **No extraction issues**: No background color detection problems
6. **Deterministic**: What you see is exactly what you get

## Future Enhancements

Potential features to add:
- [ ] Image upload for custom backgrounds
- [ ] Gradient fills
- [ ] Text formatting (bold, italic, underline)
- [ ] Layer ordering (bring to front, send to back)
- [ ] Element duplication
- [ ] Undo/redo
- [ ] Template preview thumbnails
- [ ] Import from PPTX (use existing extraction pipeline)
- [ ] Export template to PPTX
- [ ] Snap-to-grid and alignment guides
- [ ] Keyboard shortcuts
- [ ] Copy/paste elements
- [ ] Element grouping

## Technical Notes

### State Management
- Uses React hooks (`useState`) for local state
- Custom `useTemplateBuilder` hook manages:
  - Slides array
  - Current slide selection
  - Selected element
  - Add/update/delete operations

### Drag & Drop
- Pure React implementation (no external libraries)
- Mouse events for drag detection
- Scale-aware coordinate calculations
- Boundary constraints (keep elements on canvas)

### Resize Handles
- 8-point resize system (N, NE, E, SE, S, SW, W, NW)
- Maintains aspect ratio options
- Min size constraints (50px)
- Corner handles resize both dimensions
- Edge handles resize single dimension

### Canvas Scaling
- Auto-scales to fit container
- Maintains slide aspect ratio
- Coordinates calculated relative to scale
- Responsive to window resize

## Troubleshooting

### Elements not dragging
- Ensure you're clicking the element itself, not resize handles
- Check that element is not off-canvas

### Colors not applying
- Verify hex color format (#RRGGBB)
- Check that element type supports the property (e.g., images don't have fill)

### Save not working
- Check FastAPI server is running
- Verify `/api/v1/ppt/template/save` endpoint is accessible
- Check browser console for errors
- Ensure template has a name

### Template not appearing in list
- Check `{APP_DATA_DIRECTORY}/layout_templates/` directory exists
- Verify JSON file was created
- Refresh template list page

## Related Files

- Backend template save: [template_save.py](servers/fastapi/api/v1/ppt/endpoints/template_save.py)
- Frontend builder: [template-builder/page.tsx](servers/nextjs/app/(presentation-generator)/template-builder/page.tsx)
- Navigation: [Header.tsx](servers/nextjs/app/(presentation-generator)/dashboard/components/Header.tsx)
