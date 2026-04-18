import Foundation

@MainActor
final class PortfolioViewModel: ObservableObject {
    @Published var holdings: [CardHolding]
    @Published var snapshots: [CollectionSnapshot]
    @Published var isRefreshing = false

    private let valuationService: ValuationProvider

    init(
        valuationService: ValuationProvider,
        holdings: [CardHolding] = CardHolding.sampleData
    ) {
        self.valuationService = valuationService
        self.holdings = holdings
        self.snapshots = [
            CollectionSnapshot(
                id: UUID(),
                timestamp: .now,
                totalValue: holdings.reduce(0) { $0 + $1.totalMarketValue },
                totalCostBasis: holdings.reduce(0) { $0 + $1.totalCostBasis }
            )
        ]
    }

    var totalCollectionValue: Double {
        holdings.reduce(0) { $0 + $1.totalMarketValue }
    }

    var totalCostBasis: Double {
        holdings.reduce(0) { $0 + $1.totalCostBasis }
    }

    var totalGain: Double {
        totalCollectionValue - totalCostBasis
    }

    func addHolding(_ holding: CardHolding) {
        holdings.append(holding)
        recordSnapshot()
    }

    func refreshPrices() async {
        isRefreshing = true
        defer { isRefreshing = false }

        for index in holdings.indices {
            do {
                let value = try await valuationService.fetchEstimatedValue(for: holdings[index])
                holdings[index].latestMarketValue = value
            } catch {
                continue
            }
        }

        recordSnapshot()
    }

    private func recordSnapshot() {
        snapshots.append(
            CollectionSnapshot(
                id: UUID(),
                timestamp: .now,
                totalValue: totalCollectionValue,
                totalCostBasis: totalCostBasis
            )
        )
    }
}
