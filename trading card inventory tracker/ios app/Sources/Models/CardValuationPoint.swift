import Foundation

struct CardValuationPoint: Identifiable, Codable {
    let id: UUID
    let cardID: UUID
    let timestamp: Date
    let marketValue: Double
    let source: String
}
