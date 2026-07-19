# Responsive MVP prototype

This stage keeps the vanilla HTML/CSS/JavaScript prototype and adds responsive layouts without starting backend work.

## Breakpoints

- Mobile: 320-767 px.
- Tablet: 768-1099 px.
- Desktop: 1100-1599 px.
- Wide desktop: 1600 px and above.

Control viewports used for smoke checks:

- 360 x 800
- 390 x 844
- 430 x 932
- 768 x 1024
- 1024 x 768
- 1280 x 800
- 1440 x 900
- 1920 x 1080

## Layout system

Implemented as vanilla render functions and CSS primitives:

- AppShell: `layout()` in `prototype/js/app.js`.
- MobileHeader: `header()`.
- DesktopHeader and DesktopNavigation: `desktopHeader()`.
- MobileBottomNavigation: `bottomNav()`.
- DesktopContainer: `.responsive-frame` and `.responsive-screen`.
- ContentGrid: `.content-grid`, `.grid`, `.catalog-grid`.
- SidebarLayout: `.sidebar-layout`, `.desktop-split`.
- FiltersSidebar: `filtersSidebar()`.
- StickySummary: `.sticky-summary`, `orderSummary()`.
- ManagerSidebar and ManagerTopbar: manager workspace render in `managerFlow()`.

## Desktop customer MVP

The same hash routes adapt by viewport:

- `#/home`: desktop hero, search, pick modes, categories, brands, products and trust sections.
- `#/catalog`: breadcrumbs, selected car, filters sidebar, sort row, product grid and quick VIN.
- `#/product`: gallery, details, compatibility and sticky purchase rail.
- `#/garage` and vehicle steps: sidebar stepper and current step.
- `#/vin`: form plus document/help column.
- `#/cart`: item list plus sticky summary.
- `#/checkout-*`: structured form plus progress and summary.
- `#/account`: account sidebar plus dashboard area.

## Manager workspace

Manager routes are desktop-first:

- persistent sidebar;
- topbar;
- VIN queue with SLA;
- request detail with client, vehicle and message area;
- product search and selection preview;
- order list and status action.

Mobile manager remains a simplified single-column view.

## Review mode

`#/review` now supports:

- Mobile, Tablet, Desktop and Side-by-side view toggles;
- desktop screenshots for the 50 recommended MVP routes;
- Codex defaults in `prototype/data/review-defaults.json`;
- localStorage user decisions overriding defaults;
- export/import final JSON decisions.

## Generated artifacts

- `prototype/review-thumbnails/`: 154 mobile route screenshots, 390 x 844.
- `prototype/review-thumbnails-desktop/`: 50 MVP desktop screenshots, 1440 x 900.
- `screenshots/responsive/`: 15 responsive QA screenshots.

## Non-goals

- No backend, database, payment integration or API work.
- No root production homepage changes.
- No separate desktop route per screen.
