# AI Town Comprehensive Review

## Critical Issues

### 1. Share page navigation not handled ✅ FIXED
Share pages (e.g., `/town/town-hall/`) redirect visitors to `/#building=town-hall` via `<meta http-equiv="refresh">`, but the main app had **zero code** to parse `window.location.hash` and navigate the camera to the building. Visitors landed at the default camera position.

**Fix**: Added `navigateToBuilding(slug)` method to `TownRenderer` in `renderer.js` and hash parsing (`#building=slug` and `#slug`) in `main.js` with `hashchange` listener.

### 2. Missing share pages for 2 buildings ✅ FIXED
`fountain-of-happiness` and `ivproduced-tech-corner` had no `town/<slug>/` directory at all.

**Fix**: Generated share pages with proper OG meta tags and meta-refresh redirects.

### 3. Missing OG images for 7 buildings ✅ FIXED
These buildings had `index.html` but no `og.png`: `tacos-el-cochi`, `sawasdi-baan-thai`, `federal-bureau-of-ai-investigation`, `arasaka-customer-experience-center`, `the-aussie-escape`, `fountain-of-happiness`, `ivproduced-tech-corner`.

**Fix**: Generated OG images via `verify-browser.mjs` for all 7 buildings.

### 4. Duplicate share page generators ✅ FIXED
Two separate generators (`dispatch.sh` `generate_share_page()` and `verify-browser.mjs` `buildSharePage()`) produced different HTML with inconsistent redirect behavior.

**Fix**: Replaced `generate_share_page()` in `dispatch.sh` with a wrapper that delegates to `verify-browser.mjs` as the single canonical generator.

### 5. Issues not auto-closing after local merge ✅ FIXED
When `gh pr merge --squash` failed and dispatch fell back to local `git merge`, linked issues were never closed.

**Fix**: Added explicit `gh issue close "$linked_issue"` after merge (idempotent — safe if GitHub already auto-closed it).

### 6. Human-reviewed issues missing build context ✅ FIXED
When the repo owner approved a `needs-review` issue, phase 3 assigned it to Copilot without plot assignment or contributor info.

**Fix**: `phase_assign` now checks for existing build context comment and generates one (with plot assignment via AI planner) if missing.

### 7. Modified building slug detection broken ✅ FIXED
`new_slug` only looked for new `"id"` additions in the diff. Modifications (where the id already exists) were missed.

**Fix**: Added fallback detection that compares main vs PR `town.json` to find modified buildings.

### 8. Share page committed to PR branch gets lost ✅ FIXED
Share page was generated on test-merge branch, then lost when checking out the PR branch.

**Fix**: Share page + OG image generation now happens AFTER merge on main, then committed directly to main.

### 9. Inconsistent hash format ✅ FIXED
`verify-browser.mjs` used `#building=slug`, `dispatch.sh` used `#slug`, and nobody handled either format.

**Fix**: Standardized on `#building=slug` via `verify-browser.mjs` (canonical generator). `main.js` handles both `#building=slug` and `#slug` for backwards compatibility.

## Medium Issues

### 10. JSON merge conflict resolution fragile ✅ FIXED
Stripping conflict markers without handling JSON syntax produced invalid JSON (missing commas between entries).

**Fix**: JSON-aware merge that ensures proper comma separation between conflicting blocks, with JSON.parse validation.

### 11. Post-merge OG image link may be broken ✅ FIXED
`mayor_merged()` always included an OG image link even if og.png wasn't generated.

**Fix**: `mayor_merged()` now checks if `town/${slug}/og.png` exists before including the image in the comment.
