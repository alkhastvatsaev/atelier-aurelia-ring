# Atelier Aurelia

A responsive, browser-based 3D ring configurator and jewellery pre-CAD engine built with React, TypeScript, and React Three Fiber.

**[Open the live demo](https://atelier-aurelia-ring.vercel.app)**

The customer experience is in French. Technical documentation is in English.

![Atelier Aurelia ring configurator on desktop](docs/screenshots/configurator-desktop.png)

<details>
<summary>Mobile view</summary>

![Atelier Aurelia ring configurator on mobile](docs/screenshots/configurator-mobile.png)

</details>

## Product overview

Atelier Aurelia combines a minimal luxury retail interface with a millimetre-based semantic geometry engine. It supports solitaire, halo, three-stone, and full-eternity architectures while checking setting, pavé, casting, and clearance rules against cited jewellery references.

### Features

- Procedural interactive 3D with separate round, oval, and emerald-cut geometry
- Solitaire, halo, three-stone, and full-eternity style recipes
- EU/ISO ring-size conversion in millimetres
- Yellow gold, rose gold, and platinum direct-casting profiles
- Diamond, sapphire, and emerald density-aware dimension estimates
- Four-grain pavé with pavilion seats subtracted from the metal by BVH/CSG
- Structured pre-CAD validation for prongs, galleries, pavé borders, clearances, and casting allowances
- On-demand technical report with measured values and source links
- Versioned configuration migration, local persistence, URL sharing, and PNG export
- Responsive controls and a style-aware fallback when WebGL is unavailable

Prices and materials are illustrative. The browser report is a pre-CAD check, not a manufacturing certificate or order workflow.

## Architecture

```text
src/domain/
├── configuration, units, alloys, casting profiles, gemstones
src/styles/
├── solitaire, halo, three-stone, eternity recipes
src/geometry/
├── semantic millimetre layout and design pipeline
src/validation/
├── structured CAP/GIA/Stuller/foundry rules
src/rendering/three/
├── meshes generated only from the validated layout
App.tsx
└── UI, persistence, sharing, report drawer, lazy 3D loading
```

The pipeline is:

`validated configuration → style recipe → semantic mm layout → validation report → Three.js adapter`

The geometry is original and generated at runtime. Jewellery references, CAD models studied, licensing decisions, and limitations are documented in [CAD_SOURCES.md](./CAD_SOURCES.md).

## Technology

- React 19 and TypeScript
- Vite
- Three.js, React Three Fiber, and Drei
- Vitest and Oxlint
- GitHub Actions and Dependabot
- Vercel

## Local setup

Requirements: Node.js 20.19 or newer and npm.

```bash
git clone https://github.com/alkhastvatsaev/atelier-aurelia-ring.git
cd atelier-aurelia-ring
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

Tests cover configuration migration, ISO sizing, alloy-specific casting compensation, style reference structures, invalid geometry, and the supported style/cut/stone/size/carat grid.

## Engineering considerations

### Manufacturing

The engine classifies rules as universal principles, quality criteria, foundry profiles, or workshop thresholds. Foundry-specific shrinkage and finishing allowances remain explicit. A jeweller, setter, and foundry must validate the final piece.

### Accessibility

Controls use native elements, labels, pressed states, and status announcements. A non-WebGL representation is available. A formal WCAG and assistive-technology audit remains future work.

### Performance

The scene is lazy-loaded, device pixel ratio is capped, and design calculations are memoized. `preserveDrawingBuffer` enables PNG export at a GPU-memory cost.

### Security and privacy

All processing happens in the browser. Stored and shared configurations are treated as untrusted data, validated, and migrated before use. There is no authentication, payment, inventory, or backend.

## Licence

Released under the [MIT License](./LICENSE).
