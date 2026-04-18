import SwiftUI

struct DashboardView: View {
    @ObservedObject var viewModel: PortfolioViewModel
    @State private var showingAddCard = false

    var body: some View {
        NavigationStack {
            List {
                Section("Portfolio") {
                    metricRow("Collection Value", value: viewModel.totalCollectionValue)
                    metricRow("Cost Basis", value: viewModel.totalCostBasis)
                    metricRow("Unrealized Gain", value: viewModel.totalGain)
                }

                Section("Holdings") {
                    ForEach(viewModel.holdings) { holding in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(holding.title)
                                .font(.headline)
                            Text("\(holding.year) \(holding.setName) • \(holding.grade.rawValue)")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            HStack {
                                Text("Value: \(currency(holding.totalMarketValue))")
                                Spacer()
                                Text(gainText(for: holding.unrealizedGain))
                                    .foregroundStyle(holding.unrealizedGain >= 0 ? .green : .red)
                            }
                            .font(.footnote)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            .navigationTitle("Card Portfolio")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Refresh") {
                        Task {
                            await viewModel.refreshPrices()
                        }
                    }
                    .disabled(viewModel.isRefreshing)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Add Card") {
                        showingAddCard = true
                    }
                }
            }
            .sheet(isPresented: $showingAddCard) {
                AddCardView(viewModel: viewModel)
            }
        }
    }

    private func metricRow(_ title: String, value: Double) -> some View {
        HStack {
            Text(title)
            Spacer()
            Text(currency(value))
                .fontWeight(.semibold)
        }
    }

    private func currency(_ value: Double) -> String {
        value.formatted(.currency(code: "USD"))
    }

    private func gainText(for value: Double) -> String {
        let prefix = value >= 0 ? "+" : ""
        return "\(prefix)\(currency(value))"
    }
}
