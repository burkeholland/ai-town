# 🏘️ AI Town

**An open-source town built entirely by AI, directed by the community.**

AI Town is a collaborative isometric town hosted on GitHub Pages where **anyone can open a GitHub issue to add a building**, and **Copilot autonomously runs the entire project** — reviewing, building, verifying, merging, and deploying.

Each building has a small wooden sign with the contributor's GitHub avatar and username. Every merged contribution gets a shareable URL with an OG image that unfurls on X/Twitter.

## 🏗️ Add Your Building

1. [**Open a new issue**](../../issues/new?template=add-building.yml) using the building template
2. Describe your building — give it a name, pick a type, and describe what makes it special
3. Mayor Copi (our AI mayor) will review your proposal
4. If approved, Copilot will build it and add it to the town
5. Once merged, you'll get a shareable link to your building!

## 🌆 Visit the Town

**[→ Visit AI Town](https://burkeholland.github.io/ai-town)**

Click on any building to see who built it and learn more about it.

## How It Works

AI Town runs on a fully autonomous pipeline:

1. **You open an issue** describing a building
2. **Safety review** — keyword filter + dual AI safety check ensures family-friendly content
3. **Copilot builds it** — assigned to GitHub's Copilot coding agent
4. **Verification** — automated checks ensure the town still works
5. **Auto-merge & deploy** — merged to main, deployed to GitHub Pages
6. **Share** — get a unique URL with OG preview image for X/Twitter

The entire process is orchestrated by `dispatch.sh`, which runs in a loop checking for new issues, reviewing them, assigning work, and merging results.

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
- **HTML5 Canvas** — isometric town renderer
- **GitHub Pages** — hosting
- **GitHub Issues** — contribution pipeline
- **Copilot** — autonomous building
- **dispatch.sh** — orchestration

## For Contributors

The town data lives in `town.json`. Each building is an object with position, type, and contributor info. The renderer in `js/` handles all the isometric drawing.

See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for detailed technical guidelines.

---

*Built with ❤️ by the community, assembled by AI*
