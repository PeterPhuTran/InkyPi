import SwiftUI

struct AddCardView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: PortfolioViewModel

    @State private var title = ""
    @State private var franchise = ""
    @State private var setName = ""
    @State private var year = ""
    @State private var cardNumber = ""
    @State private var grade: CardGrade = .psa9
    @State private var purchasePrice = ""
    @State private var quantity = "1"
    @State private var notes = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Card Details") {
                    TextField("Card title", text: $title)
                    TextField("Franchise", text: $franchise)
                    TextField("Set name", text: $setName)
                    TextField("Year", text: $year)
                        .keyboardType(.numberPad)
                    TextField("Card number", text: $cardNumber)
                    Picker("PSA Grade", selection: $grade) {
                        ForEach(CardGrade.allCases) { grade in
                            Text(grade.rawValue).tag(grade)
                        }
                    }
                }

                Section("Ownership") {
                    TextField("Purchase price", text: $purchasePrice)
                        .keyboardType(.decimalPad)
                    TextField("Quantity", text: $quantity)
                        .keyboardType(.numberPad)
                    TextField("Notes", text: $notes, axis: .vertical)
                }
            }
            .navigationTitle("Add Card")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        saveHolding()
                    }
                    .disabled(!canSave)
                }
            }
        }
    }

    private var canSave: Bool {
        !title.isEmpty &&
        !setName.isEmpty &&
        Int(year) != nil &&
        Double(purchasePrice) != nil &&
        Int(quantity) != nil
    }

    private func saveHolding() {
        guard
            let parsedYear = Int(year),
            let parsedPrice = Double(purchasePrice),
            let parsedQuantity = Int(quantity)
        else {
            return
        }

        let holding = CardHolding(
            id: UUID(),
            title: title,
            franchise: franchise,
            setName: setName,
            year: parsedYear,
            cardNumber: cardNumber,
            grade: grade,
            purchasePrice: parsedPrice,
            quantity: parsedQuantity,
            purchaseDate: .now,
            notes: notes,
            latestMarketValue: parsedPrice
        )

        viewModel.addHolding(holding)
        dismiss()
    }
}
