import Foundation

struct CollectionSnapshot: Identifiable, Codable {
    let id: UUID
    let timestamp: Date
    let totalValue: Double
    let totalCostBasis: Double

    var unrealizedGain: Double {
        totalValue - totalCostBasis
    }
}
