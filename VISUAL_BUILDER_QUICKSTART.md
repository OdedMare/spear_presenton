# Visual Template Builder - Quick Start Guide

## ✅ What's Ready

A complete **Visual Template Builder** has been created! Your clients can now create presentation layouts directly in the browser using a drag-and-drop interface.

## 🚀 How to Start

### Option 1: Using start.js (Recommended)
```bash
node start.js --dev
```

### Option 2: Manual Start
```bash
# Terminal 1: Start Next.js
cd servers/nextjs
npm run dev

# Terminal 2: Start FastAPI
cd servers/fastapi
pip install -r requirements.txt  # First time only
python server.py --port 8000 --reload true
```

### Option 3: Docker
```bash
docker-compose up development
```

## 📍 Access the Builder

Once both servers are running:

**Visual Builder**: http://localhost:3000/template-builder

Or click **"Visual Builder"** in the top navigation bar.

## 🎨 Quick Tutorial

### 1. Add Elements
Click buttons in left sidebar:
- **Text Box**: Add text with custom font size, color, and alignment
- **Shape**: Add rectangles or circles with fill colors
- **Image**: Add image placeholders

### 2. Position Elements
- **Drag**: Click and drag to move
- **Resize**: Click element → drag blue resize handles
- **Precise**: Use Properties Panel (right) for exact X, Y, Width, Height

### 3. Style Elements
Select an element, then use Properties Panel to edit:
- Colors (fill, text, stroke)
- Text content and font size
- Rotation and opacity
- Text alignment

### 4. Manage Slides
- **Add Slide**: Click "+ Add" in left panel
- **Switch Slides**: Click slide thumbnails
- **Delete Slide**: Click × on slide (minimum 1 slide)

### 5. Save Template
- Click **"Save Template"** (top right)
- Enter name and description
- Template saved to library
- Use for AI presentation generation

## 📁 What Was Built

### Frontend Components (New)
```
servers/nextjs/app/(presentation-generator)/template-builder/
├── page.tsx                     # Main builder page
├── components/
│   ├── Canvas.tsx              # Drag & drop canvas
│   ├── Toolbar.tsx             # Element selector
│   ├── PropertiesPanel.tsx     # Properties editor
│   └── SaveTemplateDialog.tsx  # Save modal
├── hooks/
│   └── useTemplateBuilder.ts   # State management
├── services/
│   └── api.ts                  # API integration
└── types/
    └── index.ts                # TypeScript types
```

### Backend API (Already Existed!)
```
servers/fastapi/api/v1/ppt/endpoints/template_save.py
```

**Endpoints:**
- `POST /api/v1/ppt/template/save` - Save new template
- `GET /api/v1/ppt/template/list` - List all templates
- `GET /api/v1/ppt/template/{id}` - Get specific template

### Navigation
Updated header with new "Visual Builder" link.

## ✨ Key Features

✅ **No PPTX Upload**: Create templates from scratch
✅ **Drag & Drop**: Intuitive positioning
✅ **Visual Editing**: Real-time preview
✅ **Color Pickers**: Easy color selection (no hex codes needed)
✅ **Multi-Slide**: Create templates with multiple layouts
✅ **Precise Control**: Numeric inputs for exact positioning
✅ **Reusable**: Saved templates work with AI generation

## 🎯 Benefits

This solves your original problem in a better way:

**Before**: Trying to extract background colors from PPTX → Technical issues
**Now**: Visual builder lets users set colors directly → No extraction needed!

Your clients can:
1. Create custom layouts visually
2. Set exact colors they want
3. Save and reuse templates
4. Generate AI presentations with their templates

## 📚 Documentation

- **Complete Guide**: `VISUAL_TEMPLATE_BUILDER.md`
- **Architecture**: `VISUAL_BUILDER_COMPLETE.md`

## 🐛 Troubleshooting

### Template builder page not loading
- Ensure Next.js is running: `npm run dev` in `servers/nextjs/`
- Check console for errors
- Navigate to http://localhost:3000/template-builder

### Save not working
- Ensure FastAPI is running on port 8000
- Check that `template_save.py` endpoint is registered
- Verify `APP_DATA_DIRECTORY` is set (defaults to `app_data/`)
- Check browser console for API errors

### Elements not dragging
- Click the element itself, not resize handles
- Make sure element is selected (blue border)
- Check that drag isn't being blocked by other elements

### Colors not updating
- Use hex format: #RRGGBB (e.g., #FF0000 for red)
- Try using the color picker instead of typing
- Check element type supports the property

## 🎉 Ready to Use!

The Visual Template Builder is complete and ready for production. Your clients can now create beautiful presentation layouts without any PPTX files or background extraction issues!

**Next Steps**:
1. Start the servers
2. Navigate to `/template-builder`
3. Create your first template
4. Save it and use it for AI presentations

Enjoy! 🚀
