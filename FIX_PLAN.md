# CRITICAL FIX PLAN - PowerPoint Inheritance

## Problem
The extractor is returning NO COLORS because it only looks for fills in the slide's `<p:sp>` elements.
But PowerPoint stores colors using **inheritance**:

```
Slide shape → inherits from → Layout placeholder → inherits from → Master placeholder → inherits from → Theme
```

## Current (WRONG) Flow
1. Extract slide shape → check `<p:spPr>` for fill → None → STOP ❌
2. Check `<p:style><a:fillRef>` → None → STOP ❌
3. Return shape with NO FILL ❌

## Correct Flow (PowerPoint Inheritance)
1. Load theme colors: `ppt/theme/theme1.xml` → `{accent1: "4472C4", dk1: "000000", ...}`
2. Extract master shape → resolve `<p:style><a:fillRef><a:schemeClr val="accent1">` → lookup "accent1" → "4472C4"
3. Extract layout shape → inherit master fill OR override with own fillRef
4. Extract slide shape → inherit layout fill OR override with own spPr/fillRef
5. Return final resolved fill with actual RGB color

## What Needs to Change

### Option 1: Post-Processing (FASTEST TO IMPLEMENT)
After extracting all shapes, do a second pass to resolve inheritance:

```python
def resolve_inheritance(slide_el, layout_el, master_el, theme_colors):
    # Start with master formatting
    fill = extract_style_fill(master_el, theme_colors)
    border = extract_style_border(master_el, theme_colors)

    # Override with layout if present
    if layout_el:
        fill = extract_style_fill(layout_el, theme_colors) or fill
        border = extract_style_border(layout_el, theme_colors) or border

    # Override with slide if present
    if slide_el:
        fill = extract_fill(slide_el.spPr, ...) or extract_style_fill(slide_el, theme_colors) or fill
        border = extract_border(slide_el.spPr, theme_colors) or extract_style_border(slide_el, theme_colors) or border

    return fill, border
```

### Option 2: Build Inheritance Chain (CLEANER)
Change `extract_shape()` to accept parent shape:

```python
def extract_shape(sp_el, layout_parent=None, master_parent=None, theme_colors={}):
    # Extract own formatting
    fill = extract_fill(sp_el.spPr, ...)
    border = extract_border(sp_el.spPr, theme_colors)

    # Fallback to style refs
    if not fill:
        fill = extract_style_fill(sp_el, theme_colors)

    # Fallback to layout parent
    if not fill and layout_parent:
        fill = layout_parent.get("fill")

    # Fallback to master parent
    if not fill and master_parent:
        fill = master_parent.get("fill")

    return {..., "fill": fill, "border": border}
```

## Implementation Steps

1. ✅ Theme colors are already being loaded
2. ❌ Need to extract fills from `<p:style><a:fillRef>` (currently broken)
3. ❌ Need to match slide → layout → master by placeholder type
4. ❌ Need to apply inheritance chain

## Test Case
```xml
<!-- Master slideMaster1.xml -->
<p:sp>
  <p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
  <p:style>
    <a:fillRef idx="1">
      <a:schemeClr val="accent1"/>  <!-- Theme says accent1 = 4472C4 -->
    </a:fillRef>
  </p:style>
</p:sp>

<!-- Slide slide1.xml -->
<p:sp>
  <p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
  <!-- NO fill here! Should inherit from master! -->
</p:sp>
```

**Expected result:** Slide title has fill color #4472C4
**Current result:** Slide title has NO fill ❌

## Fix Priority
**CRITICAL** - Without this, ALL slides will have no colors
