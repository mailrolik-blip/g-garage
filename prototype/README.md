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

Generated audit artifacts:

- `docs/ux-route-audit.md`
- `docs/product-weaknesses.md`
- `docs/mvp-scope.md`
- `docs/data-readiness.md`
- `prototype/review-thumbnails/`

The production homepage files in the repository root are not replaced by this prototype.
