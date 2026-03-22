# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server with HMR (Vite, port 3000)
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build
```

**Note:** Test runner is not currently configured. Tests exist in `src/__tests__/` (Jest format) but `react-scripts` was removed during Vite migration. Vitest setup is needed to re-enable them.

## Architecture

Data center rack design tool (React 18 + TypeScript + Tailwind CSS + Vite). Deployed to GitHub Pages.

### State Management

No external state library. All state lives in React hooks:

- **`useRackState`** (`src/hooks/useRackState.ts`): Central state hook managing all rack data (racks, equipment, cage nuts, rails, PDUs, floor settings). Returns ~25 action functions. Loads initial state from localStorage or shared URL.
- **`useDragAndDrop`** (`src/hooks/useDragAndDrop.ts`): Drag-and-drop state for equipment placement between library and rack units.

### Equipment Placement System

`EquipmentPlacementManager` (`src/services/EquipmentPlacementManager.ts`) is a class-based constraint validation engine. It validates equipment placement against multiple rules (unit overlap, weight limits, rack bounds, mounting requirements). Used by `useRackState` when adding/moving equipment.

Key types: `PlacementConstraint`, `PlacementContext`, `PlacementResult` (all in `src/types.ts`).

**Pro Mode** enables stricter constraints (cage nut and rail requirements).

### Component Structure

`App.tsx` orchestrates everything. Components are memoized at the App level (`React.memo`).

- **LeftSidebar**: Equipment library (drag source), zoom, view mode toggles, perspective switch
- **RightSidebar**: Rack list, rack selection, floor/cooling/power config buttons
- **RackView → RackUnit**: Rack visualization; units are drop targets
- **ModalsAndDialogs**: All modals (equipment detail, rack manager, floor settings, etc.)

### Data Model

`Rack` is the core type. Each rack has:
- `equipment: Record<number, Equipment>` — keyed by unit number
- `cageNuts: Record<number, CageNutConfig>` — per-unit cage nut state (4 columns × 3 positions)
- `rails: Record<number, RailConfiguration>` — per-unit rail state
- `pduPlacements: PDUPlacement[]` — vertical PDUs on sides
- `physicalStructure: PhysicalStructure` — doors, panels, frame, base, dimensions

Multi-U equipment occupies multiple unit slots; `isMainUnit` marks the primary slot.

### Persistence

- **localStorage** (`src/utils/localStorage.ts`): Auto-saves full app state on every change
- **URL sharing** (`src/utils/shareUtils.ts`): Encodes full state via lz-string compression into URL hash

### Environment Variables

Uses Vite env vars (prefix: `VITE_`). Currently only `VITE_COMMIT_HASH` is used (set in CI).

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) → GitHub Pages. Build artifact is `dist/` directory. Base path is `/otak-racking/` (configured in `vite.config.ts`).

## Test Structure

Tests are in `src/__tests__/` organized by domain:
- `equipment/`: Placement constraints, shelf logic, new equipment specs
- `rail/`: Rail requirements and slot validation
- `unit/`: Utility functions, mounting methods, load balancer specs
- `integration/`: Cross-component workflows
