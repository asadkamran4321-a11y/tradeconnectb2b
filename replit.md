# TradeConnect - B2B Marketplace

## Overview
TradeConnect is a comprehensive B2B marketplace platform connecting suppliers and buyers globally. It aims to streamline B2B transactions, facilitate product discovery, and manage communication, offering a robust solution for global trade. The platform features secure authentication, detailed product management, a professional inquiry system, and a comprehensive supplier onboarding process with admin approval workflows.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI and shadcn/ui for components, Tailwind CSS for styling, and Vite for building.
- **Backend**: Node.js with Express.js, TypeScript, PostgreSQL with Drizzle ORM, bcrypt for password hashing, and connect-pg-simple for session management.

### Key Design Decisions
- **Monorepo Structure**: Client and server code reside in a single repository, sharing schemas and types.
- **Type Safety**: End-to-end type safety enforced with TypeScript, sharing types between frontend and backend.
- **Component-Based UI**: Modular and reusable UI components built with Radix UI primitives.
- **Database-First Development**: Schema-driven development utilizing Drizzle migrations for database management.

### Key Features and Specifications
- **Authentication System**: Role-based access control (supplier/buyer), session-based authentication, and secure password hashing. Features include separate login flows for user types, email verification (mandatory with SendGrid fallback), and a comprehensive forgot password system. Admin approval is required for all new user registrations.
- **User Management**: Comprehensive supplier onboarding with 7 detailed steps (Company Info, Contact, Products/Services, Compliance/Legal, Additional Info, Shipping, References/Agreements). Includes supplier verification status pages, profile update functionality, and a supplier rejection/resubmission workflow.
- **Product Management**: Suppliers can create, manage, and edit product listings with a comprehensive multi-tab form (Basic Info, Media, Details, Shipping, Quality). Features include URL-based product information fetching, advanced image management with validation (1:1 aspect ratio, size limits), and a product draft system. All edited products require admin re-verification.
- **Product Discovery**: Buyers can search and filter products, save favorites, and follow suppliers.
- **Inquiry System**: Professional, real-time B2B communication system allowing buyers to send inquiries and suppliers to respond with a back-and-forth messaging interface. Includes comprehensive inquiry management for both buyers and suppliers, with status tracking and admin approval for inquiries.
- **Admin Dashboard**: Comprehensive super admin capabilities for managing user approvals, product reviews, approved products, suspended products, suppliers, and buyers. Includes functionality to suspend/unsuspend products and restore rejected suppliers.
- **SEO Optimization**: Comprehensive SEO implementation with dynamic meta tags, Open Graph and Twitter Cards, structured data (JSON-LD) for products and suppliers, automatically generated sitemap.xml and robots.txt, breadcrumb schema, and SEO-friendly URLs for better search engine visibility.
- **API Structure**: RESTful endpoints for CRUD operations, search, filtering, file uploads, and SEO data generation.

## External Dependencies
- **Database**: Neon Database (PostgreSQL serverless).
- **UI Components**: Radix UI.
- **Form Handling**: React Hook Form with Zod validation.
- **Date Handling**: date-fns.
- **Styling**: Tailwind CSS with PostCSS.
- **Email Services**: Brevo (primary) and SendGrid (fallback) for email verification and password reset.