# menu redirect pages

This repository is a GitHub Pages redirect layer for fixed table links.

## What it does

- `https://marwandahi198-tech.github.io/menu/t5` redirects to active server table menu URL.
- `https://marwandahi198-tech.github.io/menu/bill/t5` redirects to active server table bill URL.

## Setup

1. Enable GitHub Pages from `main` branch, root folder.
2. Keep `404.html` as-is (required for deep links).
3. Optional fallback: set `targetBase` in `config.json`.
   - Example: `"targetBase": "https://your-live-domain.com"`

## Best mode with your Inventory app

Your app can generate fixed links with a `?target=` parameter.
When that exists, this redirect page uses it directly and redirects immediately.

Example:

`https://marwandahi198-tech.github.io/menu/t5?target=https%3A%2F%2Fabc.trycloudflare.com%2Fmenu%2Ft5`
