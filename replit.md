# Point of Sale System

## Overview

This is a full-stack Point of Sale (POS) system built with React, Express.js, and PostgreSQL. The application provides comprehensive retail management functionality including product management, inventory tracking, customer management, sales processing, and reporting. It features a modern web interface with role-based access control and real-time sales processing capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for robust form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Simple session-based authentication with in-memory session storage
- **Authorization**: Role-based access control (admin, manager, cashier)
- **API Design**: RESTful API endpoints with consistent error handling

### Database Design
- **Database**: PostgreSQL with schema defined in Drizzle
- **Schema Structure**:
  - Users (authentication and role management)
  - Products (with SKU, barcode, pricing, stock levels)
  - Categories and Suppliers for product organization
  - Customers with loyalty points system
  - Sales and SaleItems for transaction tracking
  - Inventory movements for stock management
- **Data Validation**: Zod schemas shared between frontend and backend

### Component Architecture
- **Layout Components**: Modular sidebar navigation and header with responsive design
- **Feature Components**: Dedicated components for each business domain (POS, Products, Inventory, etc.)
- **UI Components**: Reusable Shadcn/ui components with consistent styling
- **Modal System**: Centralized modal components for CRUD operations

### Development Setup
- **Build Tool**: Vite for fast development and optimized production builds
- **TypeScript**: Strict type checking across the entire codebase
- **Path Aliases**: Configured for clean imports (@/ for client, @shared for shared types)
- **Hot Reload**: Development server with HMR for rapid iteration

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary database with connection via DATABASE_URL environment variable
- **Drizzle ORM**: Type-safe database operations with migration support
- **@neondatabase/serverless**: Serverless PostgreSQL adapter for cloud deployment

### UI & Styling
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **Font**: Inter font family from Google Fonts

### Development Tools
- **Vite**: Build tool with React plugin and development server
- **TypeScript**: Type checking and compilation
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Development environment plugins for debugging and deployment

### State & Data Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Express Session**: Server-side session management