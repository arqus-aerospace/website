# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Arqus Aerospace's website built with Next.js 15, React 19, TypeScript, and Tailwind CSS. The project uses the shadcn/ui component library for UI components.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui
- **Package Manager**: npm

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles and Tailwind CSS imports
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components (auto-generated)
│   │   └── animated-shader-hero.tsx  # Custom WebGL hero component
│   └── demo.tsx          # Demo/example components
├── lib/                  # Utility functions
│   └── utils.ts          # cn() utility for className merging
└── public/               # Static assets

```

## Component Architecture

### UI Components (`/components/ui`)

This directory contains shadcn/ui components. It's important to keep UI components in this folder because:
- shadcn/ui CLI expects components in this location
- Maintains consistent component organization
- Separates base UI primitives from composed components

### Component Imports

Use path aliases for imports:
```tsx
import Hero from "@/components/ui/animated-shader-hero";
import { cn } from "@/lib/utils";
```

## shadcn/ui Integration

The project uses shadcn/ui for component primitives. Configuration is in `components.json`.

To add new shadcn/ui components:
```bash
npx shadcn@latest add [component-name]
```

## Styling Guidelines

- Use Tailwind CSS utility classes for styling
- Use `cn()` utility from `@/lib/utils` for conditional className merging
- Custom CSS variables are defined in `app/globals.css` for theming
- Component-specific animations can be added via `dangerouslySetInnerHTML` for `<style>` tags

## TypeScript Configuration

- Strict mode enabled
- Path aliases configured (`@/*` maps to root directory)
- Target: ES2017

## Client Components

Components that use browser APIs or React hooks must include `"use client"` directive at the top:
```tsx
"use client";

import { useState } from 'react';
// Component code...
```
