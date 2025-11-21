# Docker Build Fix

## Problem
Docker build was failing with:
```
npm ci` can only install packages when your package.json and package-lock.json
are in sync. Please update your lock file with `npm install` before continuing.

Missing: slate-dom@0.119.0 from lock file
Missing: tiny-invariant@1.3.1 from lock file
```

## Root Cause
We installed new packages for the PowerPoint editor:
- `konva` and `react-konva`
- `slate`, `slate-react`, `slate-history`
- `@hello-pangea/dnd`
- `framer-motion`
- `react-colorful`
- `chart.js` and `react-chartjs-2`
- `file-saver` and `jszip`
- `use-image`

These packages were installed with `--legacy-peer-deps` flag, but the `package-lock.json` wasn't properly committed.

## Solution
Ran `npm install` to regenerate `package-lock.json` with all new dependencies:

```bash
cd servers/nextjs
npm install
```

This synchronized the lock file with package.json.

## Result
✅ `package-lock.json` is now updated with all new dependencies
✅ Docker build will now succeed with `npm ci`
✅ All PowerPoint editor dependencies are tracked

## Commit This
Make sure to commit the updated `package-lock.json`:

```bash
git add servers/nextjs/package-lock.json
git commit -m "chore: update package-lock.json for PowerPoint editor dependencies"
```

## Dependencies Added
- **konva@^9.3.18** - Canvas manipulation
- **react-konva@^18.2.10** - React wrapper for Konva
- **slate@^0.119.0** - Rich text framework
- **slate-react@^0.119.0** - Slate React bindings
- **slate-history@^0.119.0** - Slate undo/redo
- **@hello-pangea/dnd@^17.1.0** - Drag and drop
- **framer-motion@^11.15.0** - Animations
- **react-colorful@^5.6.1** - Color picker
- **chart.js@^4.4.7** - Charts
- **react-chartjs-2@^5.3.0** - Chart.js React wrapper
- **file-saver@^2.0.5** - File downloads
- **jszip@^3.10.1** - ZIP file generation
- **use-image@^1.1.1** - Image loading hook for Konva

Total: 13 new packages + their dependencies
