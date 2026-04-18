import SwiftUI

@main
struct TradingCardInventoryTrackerApp: App {
    @StateObject private var viewModel = PortfolioViewModel(
        valuationService: MockValuationService()
    )

    var body: some Scene {
        WindowGroup {
            DashboardView(viewModel: viewModel)
        }
    }
}
