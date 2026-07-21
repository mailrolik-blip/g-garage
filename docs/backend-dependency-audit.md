# Backend Dependency Audit

Команда:

```powershell
npm audit --json
```

Дата проверки: 2026-07-21.

## Summary

| Severity | Count |
| --- | ---: |
| critical | 1 |
| high | 2 |
| moderate | 3 |
| low | 0 |
| total | 6 |

## Findings

| Package | Severity | Direct | Runtime use | Fix available | Notes |
| --- | --- | --- | --- | --- | --- |
| `vitest` | critical | yes | no, test runner only | yes, `vitest@4.1.10`, semver-major | Separate upgrade task required; do not auto-fix in this stage. |
| `vite` | high | no | no, transitive test tooling | via semver-major Vitest upgrade | Affects dev/test stack. |
| `@vitest/mocker` | moderate | no | no, transitive test tooling | via semver-major Vitest upgrade | Affects dev/test stack. |
| `vite-node` | moderate | no | no, transitive test tooling | via semver-major Vitest upgrade | Affects dev/test stack. |
| `esbuild` | moderate | no | no, transitive test tooling | via semver-major Vitest upgrade | Development server advisory. |
| `xlsx` | high | yes | yes, local import/inspect CLI | no safe npm fix reported | Used only for local XLS import tools, not public API request handling. Needs a separate replacement/mitigation task before production importer use. |

## Decision

`npm audit fix` and `npm audit fix --force` were not executed. The critical issue is in dev/test tooling, not runtime API. The direct `xlsx` issue is high severity and affects local import tooling; production deploy of backend is prohibited in this stage, and importer is not exposed via API.

Before any production backend/import deployment, create a dependency remediation task to replace `xlsx` or sandbox the import pipeline and upgrade Vitest/Vite with test verification.