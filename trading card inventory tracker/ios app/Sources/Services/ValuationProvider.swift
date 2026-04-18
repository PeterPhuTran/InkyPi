import Foundation

protocol ValuationProvider {
    func fetchEstimatedValue(for holding: CardHolding) async throws -> Double
}
