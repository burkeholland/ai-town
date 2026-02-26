# Copilot Instructions — AI Town

## What is AI Town?

AI Town is a collaborative 3D village hosted on GitHub Pages where anyone can open a GitHub issue to add a structure. Buildings are placed on organic plots along winding paths (BotW-inspired), and each has a brass plaque with the contributor's GitHub avatar and username. Every merged contribution gets a shareable URL with an OG image that unfurls on X/Twitter.

**Tagline**: *"An open-source town built entirely by AI, directed by the community."*

## Architecture

- Pure HTML/CSS/JS — no build step, no server
- Three.js 3D renderer with WASD walking controls
- Town data stored in `town.json` — array of building objects
- Each building gets a page at `/town/{building-slug}/` with OG meta tags

## Data Model (`town.json`)

Each building is an object:
```json
{
  "id": "the-cat-bookstore",
  "name": "The Cat Bookstore",
  "type": "shop",
  "description": "A cozy bookstore with a cat sleeping in the window",
  "plot": 5,
  "contributor": {
    "username": "burkeholland",
    "avatar": "https://github.com/burkeholland.png"
  },
  "issue": 42,
  "added": "2026-02-26"
}
```

## When Adding a Building

1. Add an entry to `town.json` with:
   - `id`: kebab-case slug from the building name
   - `name`: the building's display name
   - `type`: one of `shop`, `house`, `restaurant`, `public`, `entertainment`, `nature`, `other`
   - `description`: brief description of the building
   - `plot`: an unoccupied plot number (0-39). Check existing buildings to find free plots. Plots are organic positions along winding village paths — see `PLOTS` array in `js/buildings.js` for world coordinates.
   - `contributor`: `{ "username": "...", "avatar": "https://github.com/{username}.png" }`
   - `issue`: the issue number this building was requested in
   - `added`: today's date in YYYY-MM-DD format

2. Buildings can be any shape or size — use the CUSTOM_BUILDERS registry in `js/buildings.js` for unique structures. Register a builder function keyed by the building's `id`.

3. Each plot has a `facing` direction — buildings are automatically rotated to face the nearest road.

## Building Types & Colors

| Type | Roof Color | Wall Color |
|------|-----------|------------|
| shop | #ff7f50 (coral) | #fef3c7 (cream) |
| house | #84cc16 (sage) | #fef3c7 (cream) |
| restaurant | #f59e0b (amber) | #fef3c7 (cream) |
| public | #0ea5e9 (sky blue) | #f0f9ff (mist) |
| entertainment | #c4b5fd (lavender) | #fef3c7 (cream) |
| nature | #84cc16 (sage) | transparent |
| other | #9ca3af (gray) | #fef3c7 (cream) |

## File Structure

```
ai-town/
├── index.html              # Town viewer page
├── style.css               # Town styles
├── js/
│   ├── renderer.js         # Three.js scene, WASD controls, labels
│   ├── buildings.js        # Building construction, plot system, scenery
│   └── main.js             # Load town.json, init renderer
├── town.json               # All buildings data
├── town/                   # Per-building share pages
│   └── {slug}/
│       ├── index.html      # OG meta tags + redirect
│       └── og.png          # Pre-rendered screenshot
└── .github/
    ├── ISSUE_TEMPLATE/
    │   └── add-building.yml
    └── copilot-instructions.md
```

## Quality Bar

- Structures can be any shape — use CUSTOM_BUILDERS for unique designs
- The village should look organic and charming with scattered trees along winding roads
- Family-friendly content only
- Brass plaques on buildings show the contributor's identity

## Ownership Rules

**Each GitHub user gets exactly one building.** This is strictly enforced:

1. When adding a building, set `contributor.username` to the issue author's GitHub login. Never attribute a building to a different user.
2. When modifying a building (issues labeled `building-modification`), only change the building where `contributor.username` matches the issue author. Do not touch any other building's entry in `town.json` or its custom builder code.
3. Never delete or reassign a building's `contributor` field.
4. If a modification issue asks to change someone else's building, do not proceed — the dispatch system will reject the PR.
