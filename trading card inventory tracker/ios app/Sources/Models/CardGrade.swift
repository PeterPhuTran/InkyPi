import Foundation

enum CardGrade: String, CaseIterable, Codable, Identifiable {
    case psa1 = "PSA 1"
    case psa2 = "PSA 2"
    case psa3 = "PSA 3"
    case psa4 = "PSA 4"
    case psa5 = "PSA 5"
    case psa6 = "PSA 6"
    case psa7 = "PSA 7"
    case psa8 = "PSA 8"
    case psa9 = "PSA 9"
    case psa10 = "PSA 10"

    var id: String { rawValue }
}
