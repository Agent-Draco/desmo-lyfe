# Comm Tab Marketplace Implementation Plan

## 1. Navigation Updates
- [ ] Add "comm" tab to GlassNav.tsx navItems array (using Users icon)
- [ ] Update Index.tsx to include "comm" case in renderView switch statement
- [ ] Import and render CommView component in Index.tsx

## 2. CommView Component Creation
- [ ] Create src/components/views/CommView.tsx with marketplace interface
- [ ] Implement dual modes: S-Comm (community sharing) and B-Comm (secondary market)
- [ ] Build request/handshake workflow UI
- [ ] Create real-time chat negotiation system using Supabase subscriptions
- [ ] Integrate item lifecycle management

## 3. Auth Page Update
- [ ] Remove title and spanning emoji from Auth.tsx
- [ ] Replace with asterisk.png image import and display

## 4. Design Implementation
- [ ] Apply glassmorphism styling consistent with existing components
- [ ] Use safety green and royal purple accents as specified
- [ ] Ensure responsive design matching app's aesthetic
