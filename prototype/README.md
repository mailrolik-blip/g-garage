# G-Garage UX prototype

Static mobile-first SPA prototype for reviewing the first G-Garage product release.

Open locally:

```powershell
python -m http.server 8087
```

Main local routes:

- `/prototype/#/home`
- `/prototype/#/map`
- `/prototype/#/review`
- `/prototype/#/manager`
- `/prototype/report.html`

Review mode:

- shows all 154 audited prototype screens;
- supports filters by module, type, priority, decision and audience;
- stores owner decisions, comments and merge notes in `localStorage`;
- exports and imports decisions as JSON;
- includes the 8 critical review scenarios.
- compares mobile and desktop screenshots for the 50 recommended MVP routes.

Responsive mode:

- mobile, tablet, desktop and wide desktop use the same hash routes;
- desktop uses a full header, horizontal navigation, sidebars, grids and sticky summaries;
- manager routes use a desktop-first workspace with sidebar and topbar.

Generated audit artifacts:

- `docs/ux-route-audit.md`
- `docs/product-weaknesses.md`
- `docs/mvp-scope.md`
- `docs/data-readiness.md`
- `docs/responsive-prototype.md`
- `prototype/review-thumbnails/`
- `prototype/review-thumbnails-desktop/`
- `screenshots/responsive/`

The production homepage files in the repository root are not replaced by this prototype.
