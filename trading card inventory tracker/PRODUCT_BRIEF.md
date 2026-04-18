# Product Brief

## Vision

Build an iOS portfolio tracker for trading cards that feels like a net-worth dashboard for collectibles.

## Primary User

A collector or investor who owns graded cards and wants a simple way to monitor:

- What they own
- What each card is worth today
- How values change over time
- How the whole collection performs

## Key User Flows

### Add a Card

The user enters card details, PSA grade, purchase cost, and quantity.

### Refresh Pricing

The app queries a valuation source using the card metadata and records the latest market estimate.

### Track Performance

The app shows:

- Current market value
- Cost basis
- Unrealized gain/loss
- Collection allocation
- Historical trend lines

## MVP Entities

### CardHolding

- Unique id
- Title
- Franchise
- Set name
- Year
- Card number
- PSA grade
- Purchase price
- Purchase date
- Quantity
- Notes

### CardValuationPoint

- Card id
- Timestamp
- Market value per card
- Data source

### CollectionSnapshot

- Timestamp
- Total collection value
- Total cost basis
- Unrealized gain/loss

## Architecture Notes

- `SwiftUI` for UI
- `ObservableObject` view model for early iteration
- Local persistence can start with `SwiftData` or `CoreData`
- Price ingestion should be isolated behind a provider protocol so the source can change without rewriting the app

## Future Enhancements

- Multiple grading providers
- Sealed product support
- Alerts for price moves
- Import from CSV
- OAuth integrations if a market API supports it
- Rich analytics and category breakdowns
