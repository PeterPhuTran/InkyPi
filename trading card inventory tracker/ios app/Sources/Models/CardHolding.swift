import Foundation

struct CardHolding: Identifiable, Codable {
    let id: UUID
    var title: String
    var franchise: String
    var setName: String
    var year: Int
    var cardNumber: String
    var grade: CardGrade
    var purchasePrice: Double
    var quantity: Int
    var purchaseDate: Date
    var notes: String
    var latestMarketValue: Double

    var totalCostBasis: Double {
        purchasePrice * Double(quantity)
    }

    var totalMarketValue: Double {
        latestMarketValue * Double(quantity)
    }

    var unrealizedGain: Double {
        totalMarketValue - totalCostBasis
    }
}

extension CardHolding {
    static let sampleData: [CardHolding] = [
        CardHolding(
            id: UUID(),
            title: "Charizard Holo",
            franchise: "Pokemon",
            setName: "Base Set",
            year: 1999,
            cardNumber: "4/102",
            grade: .psa8,
            purchasePrice: 1200,
            quantity: 1,
            purchaseDate: .now.addingTimeInterval(-86_400 * 120),
            notes: "Childhood grail card.",
            latestMarketValue: 1450
        ),
        CardHolding(
            id: UUID(),
            title: "Michael Jordan",
            franchise: "Basketball",
            setName: "Fleer",
            year: 1988,
            cardNumber: "17",
            grade: .psa9,
            purchasePrice: 680,
            quantity: 1,
            purchaseDate: .now.addingTimeInterval(-86_400 * 45),
            notes: "Clean centering.",
            latestMarketValue: 760
        )
    ]
}
