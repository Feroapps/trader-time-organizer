# Trader Time Organizer

## Overview

A Progressive Web App (PWA) designed for traders to manage schedules across global time zones. The application emphasizes precision, clarity, and minimal distraction with a professional trading platform aesthetic. Built with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with HMR support
- **Fonts**: Inter (UI text) and JetBrains Mono (time displays)
- **Local Storage**: localforage for client-side persistence

The frontend follows a screen-based architecture with three main views:
- Home: Main dashboard with time rulers
- Calendar: Schedule management
- Settings: User preferences

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful routes prefixed with `/api`
- **Storage Pattern**: Interface-based storage abstraction (`IStorage`) with in-memory implementation, designed for easy PostgreSQL migration

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Validation**: Zod schemas generated via drizzle-zod
- **Migrations**: Drizzle Kit for database migrations (`migrations/` directory)

### Build System
- **Client Build**: Vite outputs to `dist/public`
- **Server Build**: esbuild bundles server to `dist/index.cjs`
- **Development**: tsx for TypeScript execution with hot reloading

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable components + shadcn/ui
    screens/      # Page-level components (Home, Calendar, Settings)
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
    storage/      # localforage configuration
server/           # Express backend
  routes.ts       # API route definitions
  storage.ts      # Data access layer
  static.ts       # Static file serving
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM**: Database toolkit with type-safe queries

### UI Components
- **Radix UI**: Headless component primitives (dialog, dropdown, popover, etc.)
- **shadcn/ui**: Pre-styled component library built on Radix
- **Lucide React**: Icon library

### Core Libraries
- **TanStack React Query**: Async state management
- **date-fns**: Date manipulation utilities
- **localforage**: Enhanced localStorage for PWA offline support
- **Zod**: Runtime type validation

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server bundling
- **TypeScript**: Type checking across the stack
- **Tailwind CSS**: Utility-first styling

### Native Mobile (Capacitor)
- **Capacitor**: Native Android app wrapper
- **@capacitor/status-bar**: Dynamic status bar theming (adapts to light/dark mode)
- **@capacitor/splash-screen**: App launch screen
- **capacitorInit.ts**: Runtime initialization for native features

#### Android Build Commands
```bash
npm run build           # Build the web app
npx cap sync android    # Sync web assets to Android
npx cap open android    # Open in Android Studio
```

#### Status Bar Behavior
- Light mode: White background with dark icons
- Dark mode: Dark (#121212) background with light icons
- Automatically updates when theme changes via MutationObserver on document.documentElement