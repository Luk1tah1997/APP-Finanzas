<!-- Copilot / AI agent instructions for the "Mis Finanzas" repo -->

# Quick orientation

- This is a small single-page frontend app (no backend). Main assets:
  - `index.html` — app structure and UI (Materialize CSS + Material Icons via CDN).
  - `js/app.js` — entire application logic, state, storage and rendering.
  - `css/styles.css` — project styles including `dark-mode` overrides and print rules.

# Big-picture architecture

- Pure client-side SPA storing all data in `localStorage`. There are three named storage keys in `js/app.js`:
  - `STORAGE_KEYS.MOVIMIENTOS` — array of movement objects
  - `STORAGE_KEYS.CATEGORIAS` — categories object { INGRESO, GASTO }
  - `STORAGE_KEYS.CONFIG` — user configuration
- UI uses Materialize components (selects, modals, sidenav). Lifecycle: DOMContentLoaded -> cache DOM -> load from storage -> init Materialize -> render.

# Important code patterns & conventions

- File and identifiers use Spanish names (e.g., `movimientos`, `categorias`, `renderizarMovimientos`). Keep new identifiers consistent with Spanish.
- State is stored in top-level variables in `js/app.js` (e.g., `movimientos`, `categorias`, `config`, `filtros`). Avoid scattering state across files.
- DOM caching: `cacheDomElements()` centralizes getElementById calls — follow this pattern when adding UI elements.
- Materialize instances are stored (`modalMovimientoInstance`, `sidenavInstance`). When changing selects or content programmatically, call `refrescarSelectMaterialize()` or re-init components.
- Persistence: use the existing loader/saver helpers (`cargarMovimientosDesdeStorage`, `guardarMovimientosEnStorage`, `cargarCategoriasDesdeStorage`, `guardarCategoriasEnStorage`, `cargarConfigDesdeStorage`, `guardarConfigEnStorage`). Do not rename storage keys — they are the persistence contract.

# Data shape examples (from `js/app.js`)

- Movement object example:
  - `{ id: Number, fecha: 'YYYY-MM-DD', tipo: 'INGRESO'|'GASTO', categoria: String, monto: Number, nota: String }`
- Backup JSON format (used by export/import):
  - `{ version:1, fecha_exportacion: ISOString, movimientos: [...], categorias: {...}, config: {...} }`

# Common edits & explicit examples

- To add a new field to a movement (example: `ubicacion`):
  1. Add input to the form in `index.html` inside `#form-movimiento`.
  2. Update `manejarSubmitMovimiento()` to read the field and include it in the created/edited object.
  3. Update `cargarMovimientosDesdeStorage()` to tolerate missing fields and `guardarMovimientosEnStorage()` will persist them.
  4. Update `renderizarMovimientos()` to display the new field and `exportarCSV()` / `exportarBackupJSON()` to include it.

- To change default categories: edit `DEFAULT_CATEGORIES` in `js/app.js` (top of file).

# Developer workflows

- Run locally: open `index.html` in a browser (no build step). Prefer Chrome/Edge for better devtools.
- Debugging: use browser DevTools console. `console.log` and `mostrarMensaje()` (Materialize toast) are used by the app.
- Reset local data: in browser DevTools run:
```
localStorage.removeItem('finanzas_movimientos');
localStorage.removeItem('finanzas_categorias');
localStorage.removeItem('finanzas_config');
```
  Or use the UI -> Import/Export backup for controlled restores.

# Integration & external deps

- External CDNs:
  - Materialize CSS/JS (`cdnjs.cloudflare.com`)
  - Google Material Icons (`fonts.googleapis.com`)
- No server APIs or build tools are present. Assume purely client-side interactions.

# Safety notes for changes

- Keep UI strings in Spanish unless you intentionally internationalize the project.
- Preserve `localStorage` key names to avoid breaking user data.
- When touching Materialize selects, call `refrescarSelectMaterialize()` or re-init `M.FormSelect` to update the rendered dropdown.

# Where to look for related logic

- `js/app.js` — main source of truth; search here for:
  - `DEFAULT_CONFIG`, `DEFAULT_CATEGORIES`, `STORAGE_KEYS`
  - `renderizarMovimientos()`, `aplicarFiltros()`, `exportarBackupJSON()`, `importarBackupDesdeObjeto()`
- `index.html` — the DOM elements and IDs that `js/app.js` expects (IDs are authoritative).
- `css/styles.css` — contains `dark-mode` styles and print rules you should not break.

# If you need more context

- Tell me which area you want to change (UI, storage, export/import, categories, config). I can amend examples and update selectors/DOM IDs accordingly.

---
Please review and tell me which sections need clarification or if you want additional examples (e.g., step-by-step to add a new UI input or to extend the backup format).
