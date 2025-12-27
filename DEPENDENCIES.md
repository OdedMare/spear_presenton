# Dependencies Documentation

This document provides a comprehensive overview of all libraries and dependencies required for the Presenton application, covering both the backend (FastAPI) and frontend (Next.js) components.

---

## Backend Dependencies (FastAPI)

The backend is built with Python and requires Python 3.11 or higher. Dependencies are managed through `requirements.txt` and `pyproject.toml`.

### Core Framework

#### FastAPI (`fastapi[standard]>=0.116.1`)
- **Purpose**: Modern, fast web framework for building APIs with Python
- **Features**: Automatic API documentation, type validation, async support
- **Usage**: Core API server framework for all endpoints

### AI & LLM Providers

#### OpenAI (`openai>=1.98.0`)
- **Purpose**: Official OpenAI Python client library
- **Features**: GPT models, DALL-E image generation, structured outputs
- **Usage**: Text generation, image generation, presentation content creation

#### Anthropic (`anthropic>=0.60.0`)
- **Purpose**: Official Anthropic Python client library
- **Features**: Claude models, tool calling, streaming support
- **Usage**: Alternative LLM provider for presentation generation

#### Google Generative AI (`google-genai>=1.28.0`)
- **Purpose**: Official Google AI Python client library
- **Features**: Gemini models, image generation, grounding with Google Search
- **Usage**: Text generation, image generation (Gemini Flash), web search integration

### Document Processing & OCR

#### Docling (`docling>=2.43.0`)
- **Purpose**: Advanced document understanding and extraction library
- **Features**: PDF parsing, layout analysis, table extraction, OCR
- **Usage**: Parse uploaded documents (PDF, DOCX) to extract content for presentations
- **Note**: Heavy ML model, loaded as singleton to optimize performance

#### pdfplumber (`pdfplumber>=0.11.7`)
- **Purpose**: PDF text and table extraction
- **Features**: Precise text extraction, table detection, metadata parsing
- **Usage**: Backup PDF parsing, extract text and tables from uploaded files

#### lxml (`lxml>=5.4.0`)
- **Purpose**: XML and HTML processing library
- **Features**: Fast XML/HTML parsing, XPath support, HTML generation
- **Usage**: Parse and manipulate HTML templates, process slide content

### Database & ORM

#### SQLModel (`sqlmodel>=0.0.24`)
- **Purpose**: SQL database ORM built on SQLAlchemy and Pydantic
- **Features**: Type-safe database models, async support, migration support
- **Usage**: Database models for presentations, users, templates

#### aiosqlite (`aiosqlite>=0.21.0`)
- **Purpose**: Async SQLite database driver
- **Features**: Async database operations for SQLite
- **Usage**: Default database for local deployments

#### asyncpg (`asyncpg>=0.30.0`)
- **Purpose**: Fast PostgreSQL database driver for Python
- **Features**: High-performance async PostgreSQL operations
- **Usage**: PostgreSQL database support for production deployments

#### aiomysql (`aiomysql>=0.2.0`)
- **Purpose**: Async MySQL/MariaDB database driver
- **Features**: Async MySQL operations
- **Usage**: MySQL database support for production deployments

#### greenlet (`greenlet>=3.0.2`)
- **Purpose**: Lightweight concurrent programming support
- **Features**: Coroutine support for SQLAlchemy
- **Usage**: Required for async SQLAlchemy operations

### Vector Database & Embeddings

#### ChromaDB (`chromadb>=1.0.15`)
- **Purpose**: Embedded vector database for AI applications
- **Features**: Vector embeddings storage, semantic search, document retrieval
- **Usage**: Store and retrieve presentation templates, semantic search functionality

#### Redis (`redis>=6.2.0`)
- **Purpose**: In-memory data structure store
- **Features**: Caching, session storage, pub/sub
- **Usage**: Caching layer for LLM responses, session management

### Natural Language Processing

#### NLTK (`nltk>=3.9.1`)
- **Purpose**: Natural Language Toolkit
- **Features**: Text tokenization, stemming, tagging, semantic analysis
- **Usage**: Text analysis, language detection, content processing

#### deep-translator (`deep-translator>=1.11.4`)
- **Purpose**: Multi-provider translation library
- **Features**: Support for Google Translate, DeepL, Microsoft, etc.
- **Usage**: Translate presentation content to different languages

#### langdetect (`langdetect>=1.0.9`)
- **Purpose**: Language detection library
- **Features**: Automatic language identification
- **Usage**: Detect language of uploaded documents and user input

### HTTP & Networking

#### aiohttp (`aiohttp>=3.12.15`)
- **Purpose**: Async HTTP client/server framework
- **Features**: Async HTTP requests, WebSocket support, session management
- **Usage**: Make async API calls to external services (image providers, web search)

### MCP Server Integration

#### fastmcp (`fastmcp>=2.11.0`)
- **Purpose**: FastAPI-based Model Context Protocol server
- **Features**: Expose OpenAPI spec as MCP tools, Claude Desktop integration
- **Usage**: MCP server for generating presentations via Claude Desktop

### Data Processing & Validation

#### pathvalidate (`pathvalidate>=3.3.1`)
- **Purpose**: File path validation and sanitization
- **Features**: Cross-platform path validation, security checks
- **Usage**: Validate user-provided file paths, prevent directory traversal attacks

#### dirtyjson (`dirtyjson>=1.0.8`)
- **Purpose**: Fault-tolerant JSON parser
- **Features**: Parse malformed JSON, handle syntax errors
- **Usage**: Parse LLM-generated JSON that may have formatting issues

#### json-repair (`json-repair>=0.1.0`)
- **Purpose**: Repair and fix broken JSON strings
- **Features**: Automatic JSON repair, handle incomplete JSON
- **Usage**: Fix LLM-generated JSON responses with syntax errors

### Testing

#### pytest (`pytest>=8.4.1`)
- **Purpose**: Python testing framework
- **Features**: Test discovery, fixtures, parametrization, plugins
- **Usage**: Unit tests, integration tests, API endpoint testing

### Additional Requirements

#### PyTorch CPU Index
```
--extra-index-url https://download.pytorch.org/whl/cpu
```
- **Purpose**: Install CPU-only version of PyTorch for Docling
- **Note**: Reduces installation size, faster for CPU-only deployments

---

## Frontend Dependencies (Next.js)

The frontend is built with Next.js 14, React 18, and TypeScript. Dependencies are managed through `package.json`.

### Core Framework

#### Next.js (`next@^14.2.14`)
- **Purpose**: React framework for production
- **Features**: Server-side rendering, static generation, API routes, app router
- **Usage**: Main application framework, routing, server components

#### React (`react@^18.3.1`) & React DOM (`react-dom@^18.3.1`)
- **Purpose**: JavaScript library for building user interfaces
- **Features**: Component-based architecture, hooks, concurrent rendering
- **Usage**: UI components, state management, rendering

#### TypeScript (`typescript@^5`)
- **Purpose**: Typed superset of JavaScript
- **Features**: Static type checking, IntelliSense, compile-time error detection
- **Usage**: Type safety across the entire frontend codebase

### State Management

#### Redux Toolkit (`@reduxjs/toolkit@^2.2.8`)
- **Purpose**: Official Redux toolset for efficient state management
- **Features**: Simplified Redux setup, immutable updates, async logic
- **Usage**: Global state for presentations, slides, user settings

#### React Redux (`react-redux@^9.1.2`)
- **Purpose**: React bindings for Redux
- **Features**: Hooks API (useSelector, useDispatch), performance optimizations
- **Usage**: Connect React components to Redux store

### UI Component Libraries

#### Radix UI (Multiple packages)
- **Purpose**: Unstyled, accessible component primitives
- **Packages**:
  - `@radix-ui/react-accordion@^1.2.1` - Collapsible content sections
  - `@radix-ui/react-avatar@^1.1.2` - User avatar display
  - `@radix-ui/react-dialog@^1.1.6` - Modal dialogs
  - `@radix-ui/react-dropdown-menu@^2.1.4` - Dropdown menus
  - `@radix-ui/react-icons@^1.3.0` - Icon set
  - `@radix-ui/react-label@^2.1.0` - Form labels
  - `@radix-ui/react-popover@^1.1.4` - Popover overlays
  - `@radix-ui/react-progress@^1.1.0` - Progress bars
  - `@radix-ui/react-radio-group@^1.2.1` - Radio button groups
  - `@radix-ui/react-scroll-area@^1.2.1` - Custom scrollbars
  - `@radix-ui/react-select@^2.1.4` - Select dropdowns
  - `@radix-ui/react-separator@^1.1.0` - Visual separators
  - `@radix-ui/react-slider@^1.2.3` - Range sliders
  - `@radix-ui/react-slot@^1.1.1` - Component composition utility
  - `@radix-ui/react-switch@^1.1.3` - Toggle switches
  - `@radix-ui/react-tabs@^1.1.1` - Tab navigation
  - `@radix-ui/react-toast@^1.2.2` - Toast notifications
  - `@radix-ui/react-toggle@^1.1.0` - Toggle buttons
  - `@radix-ui/react-tooltip@^1.1.6` - Tooltips
- **Usage**: Base UI components styled with Tailwind CSS

#### Lucide React (`lucide-react@^0.447.0`)
- **Purpose**: Beautiful and consistent icon set
- **Features**: 1000+ icons, tree-shakeable, customizable
- **Usage**: Icons throughout the application

#### Sonner (`sonner@^2.0.6`)
- **Purpose**: Opinionated toast notification component
- **Features**: Beautiful animations, promise support, customizable
- **Usage**: User feedback notifications, error messages

### Styling

#### Tailwind CSS (`tailwindcss@^3.4.1`)
- **Purpose**: Utility-first CSS framework
- **Features**: Responsive design, dark mode, custom theming
- **Usage**: All component styling, responsive layouts

#### @tailwindcss/typography (`@tailwindcss/typography@^0.5.16`)
- **Purpose**: Beautiful typographic defaults for markdown content
- **Features**: Prose classes, customizable styles
- **Usage**: Render markdown content with proper formatting

#### tailwindcss-animate (`tailwindcss-animate@^1.0.7`)
- **Purpose**: Tailwind CSS plugin for animations
- **Features**: Pre-built animation utilities, smooth transitions
- **Usage**: UI animations, transitions

#### tailwind-merge (`tailwind-merge@^2.5.3`)
- **Purpose**: Utility for merging Tailwind CSS classes
- **Features**: Conflict resolution, class deduplication
- **Usage**: Combine and override Tailwind classes in components

#### class-variance-authority (`class-variance-authority@^0.7.0`)
- **Purpose**: Type-safe variant API for components
- **Features**: Create component variants with TypeScript
- **Usage**: Define button variants, theme variations

#### clsx (`clsx@^2.1.1`)
- **Purpose**: Utility for constructing className strings conditionally
- **Features**: Tiny size, fast, conditional classes
- **Usage**: Dynamic class name generation

#### Framer Motion (`framer-motion@^12.23.24`)
- **Purpose**: Production-ready motion library for React
- **Features**: Declarative animations, gestures, layout animations
- **Usage**: Slide transitions, UI animations, interactive elements

#### next-themes (`next-themes@^0.4.6`)
- **Purpose**: Theme management for Next.js
- **Features**: Dark mode support, system preference detection
- **Usage**: Toggle between light/dark themes

### Rich Text Editing

#### Tiptap (`@tiptap/react@^2.11.5`, `@tiptap/starter-kit@^2.11.5`)
- **Purpose**: Headless rich text editor framework
- **Features**: Extensible, prosemirror-based, collaborative editing
- **Usage**: Edit slide content, format text

#### @tiptap/extension-underline (`@tiptap/extension-underline@^2.0.0`)
- **Purpose**: Underline extension for Tiptap
- **Usage**: Add underline formatting to text editor

#### tiptap-markdown (`tiptap-markdown@^0.8.10`)
- **Purpose**: Markdown support for Tiptap
- **Features**: Convert between HTML and Markdown
- **Usage**: Import/export presentation outlines as markdown

#### react-simple-code-editor (`react-simple-code-editor@^0.14.1`)
- **Purpose**: Simple code editor component
- **Features**: Syntax highlighting, lightweight
- **Usage**: Edit HTML/CSS in custom templates

### Drag & Drop

#### @dnd-kit (Multiple packages)
- `@dnd-kit/core@^6.3.1` - Core drag and drop functionality
- `@dnd-kit/sortable@^10.0.0` - Sortable lists
- `@dnd-kit/utilities@^3.2.2` - Utility functions
- **Purpose**: Modern drag and drop toolkit for React
- **Features**: Accessible, performant, flexible, touch support
- **Usage**: Reorder slides, drag and drop elements

### Charts & Data Visualization

#### Recharts (`recharts@^2.15.4`)
- **Purpose**: Composable charting library built on React
- **Features**: Line charts, bar charts, pie charts, responsive
- **Usage**: Generate charts in presentation slides

#### Mermaid (`mermaid@^11.9.0`)
- **Purpose**: Generate diagrams and flowcharts from text
- **Features**: Flowcharts, sequence diagrams, Gantt charts, class diagrams
- **Usage**: Create diagrams in slides from markdown syntax

### Content Processing

#### Marked (`marked@^15.0.11`)
- **Purpose**: Fast markdown parser and compiler
- **Features**: CommonMark compliant, extensible
- **Usage**: Parse markdown in slide content

#### Prism.js (`prismjs@^1.30.0`)
- **Purpose**: Syntax highlighting library
- **Features**: 200+ languages, themes, plugins
- **Usage**: Highlight code blocks in presentations

#### jsonrepair (`jsonrepair@^3.12.0`)
- **Purpose**: Repair malformed JSON
- **Features**: Fix syntax errors, handle truncated JSON
- **Usage**: Parse LLM-generated JSON responses

### PDF & Image Generation

#### Puppeteer (`puppeteer@^24.13.0`)
- **Purpose**: Headless Chrome/Chromium control
- **Features**: PDF generation, screenshots, browser automation
- **Usage**: Export presentations as PDF

#### html2canvas (`html2canvas@^1.4.1`)
- **Purpose**: Screenshot HTML elements
- **Features**: Render DOM to canvas, export images
- **Usage**: Generate slide thumbnails, export images

#### Sharp (`sharp@^0.34.3`)
- **Purpose**: High-performance image processing
- **Features**: Resize, crop, format conversion, optimizations
- **Usage**: Process and optimize images in presentations

### Remote Components

#### @paciolan/remote-component (`@paciolan/remote-component@^2.13.0`)
- **Purpose**: Load React components from remote URLs
- **Features**: Dynamic component loading, code splitting
- **Usage**: Load custom presentation templates dynamically

#### @babel/standalone (`@babel/standalone@^7.28.2`)
- **Purpose**: Standalone Babel compiler for browsers
- **Features**: Transform JSX/ES6+ in the browser
- **Usage**: Compile remote template components

### Utilities

#### uuid (`uuid@^11.1.0`)
- **Purpose**: Generate RFC-compliant UUIDs
- **Features**: v1, v4, v5 UUID generation
- **Usage**: Generate unique IDs for presentations, slides

#### Zod (`zod@^4.0.5`)
- **Purpose**: TypeScript-first schema validation
- **Features**: Type inference, parsing, validation
- **Usage**: Validate API responses, form inputs, configuration

#### cmdk (`cmdk@^1.0.0`)
- **Purpose**: Command menu component (Command+K)
- **Features**: Keyboard navigation, fuzzy search
- **Usage**: Quick actions, search functionality

### Analytics

#### Mixpanel Browser (`mixpanel-browser@^2.67.0`)
- **Purpose**: Analytics and user tracking
- **Features**: Event tracking, user properties, funnels
- **Usage**: Anonymous telemetry (can be disabled), usage analytics

---

## Development Dependencies

### Frontend Development Tools

#### TypeScript Type Definitions
- `@types/node@^20` - Node.js type definitions
- `@types/react@^18` - React type definitions
- `@types/react-dom@^18` - React DOM type definitions
- `@types/babel__standalone@^7.1.9` - Babel standalone types
- `@types/prismjs@^1.26.5` - Prism.js type definitions
- `@types/puppeteer@^5.4.7` - Puppeteer type definitions
- `@types/uuid@^10.0.0` - UUID type definitions
- `@types/ws@^8.5.13` - WebSocket type definitions

#### Testing

##### Cypress (`cypress@^14.3.3`)
- **Purpose**: End-to-end testing framework
- **Features**: Time-travel debugging, automatic waiting, screenshots
- **Usage**: E2E tests for presentation generation workflow

#### Build Tools

##### esbuild (`esbuild@0.25.8`)
- **Purpose**: Extremely fast JavaScript bundler
- **Features**: Fast builds, tree shaking, minification
- **Usage**: Build and bundle Next.js application

---

## System Dependencies

### Backend System Requirements

#### Python 3.11+
- Required for FastAPI backend
- Type hints, async/await support

#### PyTorch (CPU version)
- Required by Docling for document processing
- Installed from PyTorch CPU-only index to reduce size

### Frontend System Requirements

#### Node.js (Version 20 recommended)
- Required for Next.js development and builds
- NPM for package management

### Optional System Dependencies

#### Docker & Docker Compose
- For containerized deployment
- Recommended for production

#### Nginx
- Reverse proxy for production deployment
- Serves frontend on port 80/5000

#### NVIDIA Container Toolkit (Optional)
- For GPU acceleration with Ollama models
- Requires NVIDIA GPU

#### Ollama (Optional)
- For running local open-source LLMs
- Supports CPU and GPU execution

---

## Installation Guide

### Backend Setup

1. **Create Python virtual environment:**
```bash
cd servers/fastapi
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Download NLTK data:**
```python
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### Frontend Setup

1. **Install Node.js dependencies:**
```bash
cd servers/nextjs
npm install
```

2. **Build for production (optional):**
```bash
npm run build
```

---

## Dependency Management

### Backend

- **requirements.txt**: Pin specific versions for reproducible builds
- **pyproject.toml**: Define project metadata and dependencies
- **PyTorch CPU index**: Reduce installation size by using CPU-only PyTorch

### Frontend

- **package.json**: Define dependencies and scripts
- **package-lock.json**: Lock exact dependency versions
- **overrides**: Force specific versions to resolve conflicts
  - `brace-expansion@2.0.2` - Security fix

---

## Security Considerations

### Backend

- **pathvalidate**: Prevents directory traversal attacks
- **Pydantic validation**: Input validation on all API endpoints
- **CORS configuration**: Controlled cross-origin requests

### Frontend

- **Zod validation**: Runtime type checking and validation
- **Content Security Policy**: Prevent XSS attacks
- **Sanitization**: HTML sanitization before rendering user content

---

## Performance Optimizations

### Backend

- **Docling singleton**: Load heavy ML models once
- **Redis caching**: Cache LLM responses
- **Async operations**: Non-blocking I/O for database and API calls
- **Connection pooling**: Database connection management

### Frontend

- **Code splitting**: Load components on demand
- **Image optimization**: Sharp for image processing
- **Tree shaking**: Remove unused code
- **Lazy loading**: Load remote components as needed

---

## License Compliance

All dependencies are compatible with Apache 2.0 license. Notable licenses:
- **MIT**: Most JavaScript and Python packages
- **BSD**: Some core libraries
- **Apache 2.0**: FastAPI, Anthropic SDK

---

## Updating Dependencies

### Check for updates:

**Backend:**
```bash
pip list --outdated
```

**Frontend:**
```bash
npm outdated
```

### Update dependencies:

**Backend:**
```bash
pip install --upgrade -r requirements.txt
```

**Frontend:**
```bash
npm update
```

### Security audits:

**Backend:**
```bash
pip-audit
```

**Frontend:**
```bash
npm audit
```

---

## Support & Resources

For issues related to specific dependencies, refer to their official documentation:
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Google AI Documentation](https://ai.google.dev/docs)

For Presenton-specific issues:
- [GitHub Issues](https://github.com/presenton/presenton/issues)
- [Discord Community](https://discord.gg/9ZsKKxudNE)
- [Official Documentation](https://docs.presenton.ai)
