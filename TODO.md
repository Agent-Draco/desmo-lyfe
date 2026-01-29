## Comm Tab Marketplace

- [x] **Re-add Comm Tab implementation (UI + routing)**
- [x] **Recreate `CommView.tsx` (was deleted)**
- [x] **Recreate marketplace schema file (optional, was deleted)**
- [x] **Inventory -> Listing lifecycle integration**
- [x] **Request/handshake workflow**
- [x] **Chat negotiation system**

## Build Stability (Must Be Green)

- [x] **Fix root TypeScript compile error causing cascade**
- [x] **Stop mixing theme systems**
  - [x] Use either `next-themes` everywhere OR local `ThemeContext` everywhere
  - [x] Ensure `src/components/ui/sonner.tsx` matches chosen theme system
- [x] **Fix TypeScript config**
  - [x] Remove restrictive `compilerOptions.types` whitelist unless absolutely needed
  - [x] Ensure `src/vite-env.d.ts` exists and references `vite/client`

## Notes

- If the first error in the Problems panel is fixed, many “cannot find module react/jsx-runtime” style errors will disappear.