# Trading Card Inventory Tracker

An iOS app concept for tracking the market value of graded trading cards over time, similar to how Empower or Personal Capital tracks financial accounts.

## Core Idea

Users add cards they own, including:

- Card name
- Set
- Year
- Player or character
- PSA grade
- Purchase price and date
- Quantity

The app fetches estimated market pricing from a valuation provider such as TCGTrader or another card marketplace API, stores historical snapshots, and shows:

- Individual card value over time
- Total collection value over time
- Gain/loss versus purchase price
- Daily or periodic portfolio snapshots

## Suggested MVP

1. Manual card entry with PSA grade.
2. Portfolio dashboard with current total value.
3. Historical chart for each card.
4. Historical chart for the entire collection.
5. Background or scheduled price refresh.
6. Local persistence first, API integration second.

## Project Layout

- `PRODUCT_BRIEF.md`: product direction and roadmap
- `ios app/`: starter SwiftUI app structure
- `web app/`: starter web app structure

## App Variants

### iOS App

The iOS version is a SwiftUI starter focused on:

- manual card entry
- portfolio totals
- per-card gain/loss
- refreshable valuations

### Web App

The web version mirrors the same portfolio concept in the browser with:

- dashboard summary cards
- holdings table
- add-card form
- local mock valuation refresh flow

## Next Steps

- For iOS, create a new Xcode iOS App project and copy in the files from `ios app/Sources/`.
- For web, open `web app/index.html` directly in a browser, or wire the files into your preferred frontend toolchain.
