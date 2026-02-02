# Project Structure

This document categorizes the files in the repository based on their function in the application.

## Configuration & Environment
- `.env` - Environment variables
- `.gitignore` - Git ignore rules
- `bun.lockb` - Bun lockfile
- `components.json` - Shadcn UI configuration
- `eslint.config.js` - ESLint configuration
- `package-lock.json` - NPM lockfile
- `package.json` - Project dependencies and scripts
- `postcss.config.js` - PostCSS configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.app.json` - TypeScript application configuration
- `tsconfig.json` - Base TypeScript configuration
- `tsconfig.node.json` - TypeScript node configuration
- `vite.config.ts` - Vite build configuration
- `vitest.config.ts` - Vitest test configuration
- `TODO.md` - Project todo list
- `README.md` - Project documentation
- `index.html` - Application entry HTML

## Backend & Database
- `database/marketplace_schema.sql` - Database schema for marketplace features
- `database/spoonsure_schema.sql` - Main application database schema
- `supabase/config.toml` - Supabase local configuration
- `supabase/migrations/*` - Database migration files
- `inventory_items_rows.sql` - SQL data seed for inventory
- `setup_marketplace.sql` - SQL script for marketplace setup
- `inventory_rows.csv` - CSV data seed for inventory
- `shopping_list_rows.csv` - CSV data seed for shopping list

## Authentication & User Management
- `src/pages/Auth.tsx` - Authentication page (Login/Signup)
- `src/pages/Onboarding.tsx` - User onboarding flow
- `src/hooks/useAuth.ts` - Authentication logic hook
- `src/hooks/useHouseholdMembers.ts` - Logic for managing household members
- `src/hooks/useSpoonSureProfile.ts` - User profile logic
- `src/components/SpoonSureProfile.tsx` - Profile component
- `src/components/views/FamilyView.tsx` - View for managing family/household members

## Core Application & Routing
- `src/main.tsx` - React application entry point
- `src/App.tsx` - Main application component and routing
- `src/pages/Index.tsx` - Main dashboard wrapper
- `src/pages/NotFound.tsx` - 404 Not Found page
- `src/vite-env.d.ts` - Vite environment type definitions

## Inventory Management
- `src/components/views/HomeView.tsx` - Home dashboard view
- `src/components/views/InventoryView.tsx` - Full inventory list view
- `src/components/InventoryItem.tsx` - Component representing a single inventory item
- `src/hooks/useInventory.ts` - Main inventory logic hook
- `src/hooks/useKitchenInventory.ts` - Kitchen specific inventory logic
- `src/hooks/useVigilInventory.ts` - Vigil system inventory integration
- `src/components/QuickAddPreset.tsx` - Quick add buttons component
- `src/components/RemovalModeToggle.tsx` - Toggle for item removal mode
- `src/components/RecipeDrawer.tsx` - Drawer for displaying recipes

## Shopping List
- `src/components/views/ShoppingListView.tsx` - Shopping list view
- `src/components/ShoppingListWidget.tsx` - Small widget for shopping list
- `src/hooks/useShoppingList.ts` - Shopping list logic hook

## Scanning & OCR
- `src/components/views/ScanView.tsx` - Scanning interface view
- `src/hooks/useBarcodeScanner.ts` - Barcode scanning logic

## Notifications & Reminders
- `src/components/MedicineDoseReminder.tsx` - Reminder for medicine doses
- `src/components/PopUpReminder.tsx` - General popup reminders
- `src/components/NudgeFeed.tsx` - Feed of nudges/notifications
- `src/components/views/NudgesView.tsx` - View for nudges
- `src/hooks/useExpiryNotifications.ts` - Logic for expiry notifications
- `src/hooks/useEbayNudge.ts` - Logic for eBay suggestion nudges

## Community & Social (Comm)
- `src/components/views/CommView.tsx` - Community marketplace view
- `src/components/EbayListingModal.tsx` - Modal for creating eBay listings

## Settings & Integrations
- `src/components/views/SettingsView.tsx` - Settings page view
- `src/pages/VigilSetup.tsx` - Setup page for Vigil hardware
- `src/pages/Feedback.tsx` - User feedback page
- `src/hooks/useVigilSettings.ts` - Logic for Vigil settings
- `src/integrations/vigil/client.ts` - Vigil API client
- `src/integrations/supabase/client.ts` - Supabase API client
- `src/integrations/supabase/types.ts` - Supabase TypeScript types
- `src/integrations/lovable/index.ts` - Lovable integration

## Logic & Utilities
- `src/lib/utils.ts` - General utility functions
- `src/lib/rulesEngine.ts` - Business rules engine
- `src/lib/spoonacular.ts` - Spoonacular API integration
- `src/contexts/ThemeContext.tsx` - Theme state management
- `src/hooks/use-mobile.tsx` - Hook for mobile detection
- `src/hooks/use-toast.ts` - Hook for toast notifications

## UI Components (Shared)
- `src/components/ui/*` - Shadcn UI components (buttons, inputs, dialogs, etc.)
- `src/components/GlassNav.tsx` - Bottom navigation bar
- `src/components/GlassCard.tsx` - Glassmorphism card component
- `src/components/Header.tsx` - Application header
- `src/components/NavLink.tsx` - Navigation link component
- `src/components/StatsCard.tsx` - Statistics display card
- `src/components/SuccessFlash.tsx` - Success animation component
- `src/index.css` - Global CSS styles
- `src/App.css` - Application specific CSS styles

## Assets
- `src/assets/*` - Application images and static assets
- `public/*` - Public static files

## Github Workflows
- `.github/Changes.md` - Changelog
- `.github/Jules_Instructions.md` - Agent instructions

## Testing
- `src/test/setup.ts` - Test setup file
- `src/test/example.test.ts` - Example test file
