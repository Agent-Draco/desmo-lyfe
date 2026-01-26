# TODO: Implement All App Features

## Steps to Complete

- [x] **Manual Entry Enhancement:** Add mfg date, batch number (optional, default "-"), expiry date fields to ScanView manual mode
- [x] **Quick Add Automation:** Update quick add to automatically calculate mfg/exp dates based on current date and market standards, set batch to "-"
- [x] **Shopping List Feature:** Create new shopping list view, hook, and UI; integrate deletion when items added to inventory
- [x] **Camera Permissions Fix:** Update useBarcodeScanner to properly handle permissions
- [x] **Device Registration Display:** Show registered devices in VigilSetup page
- [x] **Settings Buttons:** Make profile, notifications, appearance, privacy buttons functional
- [x] **Themes System:** Implement multiple light/dark themes changeable from settings
- [x] **Pop-up Reminders:** Add overlay notifications for expiring items with add to shopping list option
- [x] **Expiry Disposal:** Keep expired items in inventory for 3 days then delete

# New Tasks

- [x] Task 1: Nudge Architect & Configuration - Build rules engine for Critical State thresholds (Food: 24h, Meds: 48h, Electronics: 168h)
- [x] Task 2: Eat Me First Recipe Engine - Add "View Recipes" button for critical Food items, integrate Spoonacular API
- [x] Task 3: eBay Replacement Nudge (Mockup) - Detect similar electronics and trigger eBay listing modal
- [x] Task 4: High-Fidelity State Machine - Implement NEW/ACTIVE/CRITICAL/LISTED visual states with manual pulse button

## Implementation Steps

1. Resolve merge conflict in InventoryItem.tsx
2. Build rulesEngine.ts with threshold logic
3. Update GlassCard.tsx for visual states
4. Add View Recipes button to InventoryItem.tsx
5. Implement eBay mockup nudge logic
6. Add Manual Pulse button to InventoryItem.tsx
