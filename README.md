# 🏘️ AI Town

**An open-source town built entirely by AI, directed by the community.**

AI Town is a collaborative 3D village hosted on GitHub Pages where **anyone can open a GitHub issue to add a building**, and **Copilot autonomously runs the entire project** — reviewing, building, verifying, merging, and deploying.

Walk around the town using WASD controls, fly up with Space, and inspect each building to see who built it. Every resident gets one plot, and each building has a plaque showing the contributor's GitHub avatar and username. Every merged contribution gets a shareable URL with an OG image that unfurls on X/Twitter.

## 🏗️ Add Your Building

1. [**Open a new issue**](../../issues/new?template=add-building.yml) using the building template
2. Describe your building — give it a name, pick a type, and describe what makes it special
3. Mayor Copi (our AI mayor) will review your proposal
4. If approved, Copilot will build it and add it to the town
5. Once merged, you'll get a shareable link to your building!

> **One building per person.** Want to renovate? Use the [✏️ Modify Your Building](../../issues/new?template=modify-building.yml) template.

## 🌆 Visit the Town

**[→ Visit AI Town](https://burkeholland.github.io/ai-town)**

Click to enter, then explore with WASD + mouse. Space to fly, Q to descend.

## How It Works

AI Town runs on a fully autonomous pipeline:

1. **You open an issue** describing a building
2. **Safety review** — keyword filter + dual AI safety check ensures family-friendly content
3. **Ownership check** — one building per user, enforced automatically
4. **Copilot builds it** — assigned to GitHub's Copilot coding agent
5. **Verification** — automated checks ensure the town still works
6. **Auto-merge & deploy** — merged to main, deployed to GitHub Pages
7. **Share** — get a unique URL with OG preview image for X/Twitter

## Building Types

| Type | Description |
|------|-------------|
| 🏪 Shop | Stores and businesses |
| 🏠 House | Residential buildings |
| 🍕 Restaurant | Eateries and cafés |
| 🏛️ Public Building | Libraries, schools, town hall |
| 🎭 Entertainment | Theaters, arcades, museums |
| 🌳 Nature | Parks, gardens, fountains |

## Tech Stack

- **Pure HTML/CSS/JS** — no build step, no server
- **Three.js** — 3D town renderer with walking & flight controls
- **GitHub Pages** — hosting
- **GitHub Issues** — contribution pipeline
- **Copilot** — autonomous building
- **dispatch.sh** — orchestration (safety review, assignment, verification, merge)

## For Contributors

The town data lives in `town.json`. Each building is placed on an organic plot along winding village roads. Buildings can be any shape — use the `CUSTOM_BUILDERS` registry in `js/buildings.js` for unique structures.

See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for detailed technical guidelines.

---

*Built with ❤️ by the community, assembled by AI*
