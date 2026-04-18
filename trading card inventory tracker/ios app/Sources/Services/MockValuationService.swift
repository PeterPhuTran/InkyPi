import Foundation

struct MockValuationService: ValuationProvider {
    func fetchEstimatedValue(for holding: CardHolding) async throws -> Double {
        // Placeholder logic until a real marketplace integration is added.
        let gradeMultiplier: Double

        switch holding.grade {
        case .psa10:
            gradeMultiplier = 1.35
        case .psa9:
            gradeMultiplier = 1.2
        case .psa8:
            gradeMultiplier = 1.05
        default:
            gradeMultiplier = 0.92
        }

        return holding.purchasePrice * gradeMultiplier
    }
}
