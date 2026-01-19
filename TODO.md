# TODO: Remove Category Feature from Inventory Items

## Steps to Complete

- [x] Remove FOOD_CATEGORIES and getCategoryForProduct from src/integrations/vigil/client.ts
- [x] Update types in src/integrations/supabase/types.ts to remove category
- [x] Update src/hooks/useInventory.ts to remove category from addItem functions and logic
- [x] Update src/hooks/useKitchenInventory.ts to remove category from addItem functions and logic
- [x] Update src/hooks/useVigilInventory.ts to remove category from addItem functions and logic
- [x] Update src/components/InventoryItem.tsx to remove category-related code (icons, etc.)
- [x] Update src/components/views/InventoryView.tsx to remove category-related code (grouping, etc.)
- [x] Update src/components/QuickAddPreset.tsx to remove category-related code (presets, etc.)
- [x] Update src/components/views/HomeView.tsx to remove category props and usage
- [x] Update src/components/views/ScanView.tsx to remove category props and usage
- [x] Update src/pages/Index.tsx to remove category props and usage

## Followup Steps
- [x] Test the app to ensure no category references remain and functionality works
