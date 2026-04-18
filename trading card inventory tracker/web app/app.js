const storageKey = "trading-card-inventory-tracker";
const apiTokenStorageKey = "trading-card-inventory-tracker-pricecharting-token";

const sampleHoldings = [
  {
    id: crypto.randomUUID(),
    title: "Charizard Holo",
    franchise: "Pokemon",
    setName: "Base Set",
    year: 1999,
    cardNumber: "4/102",
    grade: "PSA 8",
    purchasePrice: 1200,
    quantity: 1,
    notes: "Childhood grail card.",
    latestMarketValue: 1450,
    valuationSource: "Seed data",
    matchedProductName: "Charizard Holo",
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: "Michael Jordan",
    franchise: "Basketball",
    setName: "Fleer",
    year: 1988,
    cardNumber: "17",
    grade: "PSA 9",
    purchasePrice: 680,
    quantity: 1,
    notes: "Strong corners and centering.",
    latestMarketValue: 760,
    valuationSource: "Seed data",
    matchedProductName: "Michael Jordan",
    createdAt: new Date().toISOString()
  }
];

const initialState = loadState();

const state = {
  holdings: initialState.holdings,
  history: initialState.history,
  selectedRange: "week"
};

const elements = {
  form: document.querySelector("#cardForm"),
  providerForm: document.querySelector("#providerForm"),
  apiTokenInput: document.querySelector("#apiTokenInput"),
  clearTokenButton: document.querySelector("#clearTokenButton"),
  providerStatus: document.querySelector("#providerStatus"),
  refreshButton: document.querySelector("#refreshButton"),
  totalValue: document.querySelector("#totalValue"),
  costBasis: document.querySelector("#costBasis"),
  totalGain: document.querySelector("#totalGain"),
  chartCurrentValue: document.querySelector("#chartCurrentValue"),
  chartRangeLabel: document.querySelector("#chartRangeLabel"),
  historyChart: document.querySelector("#historyChart"),
  chartGrid: document.querySelector("#chartGrid"),
  chartArea: document.querySelector("#chartArea"),
  chartLine: document.querySelector("#chartLine"),
  chartPoints: document.querySelector("#chartPoints"),
  chartEmptyState: document.querySelector("#chartEmptyState"),
  chartAxisLabels: document.querySelector("#chartAxisLabels"),
  rangeButtons: Array.from(document.querySelectorAll(".range-button")),
  holdingsTableBody: document.querySelector("#holdingsTableBody"),
  historyList: document.querySelector("#historyList"),
  lastUpdated: document.querySelector("#lastUpdated")
};

elements.form.addEventListener("submit", onSubmit);
elements.providerForm.addEventListener("submit", onSaveToken);
elements.clearTokenButton.addEventListener("click", onClearToken);
elements.rangeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.selectedRange = button.dataset.range;
    render();
  });
});
elements.refreshButton.addEventListener("click", () => {
  void refreshPrices();
});

render();

function onSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.form);
  const purchasePrice = Number(formData.get("purchasePrice"));
  const quantity = Number(formData.get("quantity"));

  const holding = {
    id: crypto.randomUUID(),
    title: String(formData.get("title")),
    franchise: String(formData.get("franchise") || ""),
    setName: String(formData.get("setName")),
    year: Number(formData.get("year")),
    cardNumber: String(formData.get("cardNumber") || ""),
    grade: String(formData.get("grade")),
    purchasePrice,
    quantity,
    notes: String(formData.get("notes") || ""),
    latestMarketValue: purchasePrice,
    valuationSource: "Purchase price",
    matchedProductName: "",
    createdAt: new Date().toISOString()
  };

  state.holdings.unshift(holding);
  recordSnapshot();
  persist();
  render();
  elements.form.reset();
}

function onSaveToken(event) {
  event.preventDefault();
  const token = elements.apiTokenInput.value.trim();

  if (!token) {
    updateProviderStatus("Enter a PriceCharting token before saving.");
    return;
  }

  localStorage.setItem(apiTokenStorageKey, token);
  updateProviderStatus("Live pricing token saved locally in this browser.");
  render();
}

function onClearToken() {
  localStorage.removeItem(apiTokenStorageKey);
  elements.apiTokenInput.value = "";
  updateProviderStatus("Live pricing token cleared. Refresh will now keep current values.");
  render();
}

async function refreshPrices() {
  const token = getApiToken();

  if (!token) {
    updateProviderStatus("Save a PriceCharting token to enable live pricing refresh.");
    return;
  }

  elements.refreshButton.disabled = true;
  elements.refreshButton.textContent = "Refreshing...";

  try {
    const refreshedHoldings = [];

    for (const holding of state.holdings) {
      try {
        const livePrice = await fetchLivePriceForHolding(holding, token);
        refreshedHoldings.push({
          ...holding,
          latestMarketValue: livePrice.price,
          valuationSource: `PriceCharting: ${livePrice.matchedName}`,
          matchedProductName: livePrice.matchedName
        });
      } catch (error) {
        refreshedHoldings.push({
          ...holding,
          valuationSource: `Lookup failed: ${error.message}`
        });
      }
    }

    state.holdings = refreshedHoldings;
    recordSnapshot();
    persist();
    updateProviderStatus("Live pricing refresh completed.");
    render(new Date());
  } finally {
    elements.refreshButton.disabled = false;
    elements.refreshButton.textContent = "Refresh Prices";
  }
}

function render(lastRefreshDate) {
  const totalValue = state.holdings.reduce(
    (sum, holding) => sum + holding.latestMarketValue * holding.quantity,
    0
  );
  const costBasis = state.holdings.reduce(
    (sum, holding) => sum + holding.purchasePrice * holding.quantity,
    0
  );
  const gain = totalValue - costBasis;

  elements.totalValue.textContent = formatCurrency(totalValue);
  elements.costBasis.textContent = formatCurrency(costBasis);
  elements.totalGain.textContent = formatCurrency(gain);
  elements.totalGain.className = gain >= 0 ? "gain" : "loss";
  elements.chartCurrentValue.textContent = formatCurrency(totalValue);

  elements.holdingsTableBody.innerHTML = state.holdings
    .map((holding) => {
      const marketValue = holding.latestMarketValue * holding.quantity;
      const holdingGain = marketValue - holding.purchasePrice * holding.quantity;

      return `
        <tr>
          <td>
            <strong>${escapeHtml(holding.title)}</strong><br>
            <small>${escapeHtml(`${holding.year} ${holding.setName}`)}</small>
          </td>
          <td>${escapeHtml(holding.grade)}</td>
          <td>${holding.quantity}</td>
          <td>${formatCurrency(holding.purchasePrice * holding.quantity)}</td>
          <td>${formatCurrency(marketValue)}</td>
          <td class="${holdingGain >= 0 ? "gain" : "loss"}">${formatCurrency(holdingGain)}</td>
          <td><span class="source-pill">${escapeHtml(holding.valuationSource || "Unknown")}</span></td>
        </tr>
      `;
    })
    .join("");

  elements.historyList.innerHTML = state.history
    .slice()
    .reverse()
    .slice(0, 8)
    .map((snapshot) => `
      <li>
        <span>${new Date(snapshot.timestamp).toLocaleString()}</span>
        <strong>${formatCurrency(snapshot.totalValue)}</strong>
      </li>
    `)
    .join("");

  if (lastRefreshDate) {
    elements.lastUpdated.textContent = `Refreshed ${lastRefreshDate.toLocaleString()}`;
  } else if (state.history.length > 0) {
    const latestSnapshot = state.history[state.history.length - 1];
    elements.lastUpdated.textContent = `Updated ${new Date(latestSnapshot.timestamp).toLocaleString()}`;
  }

  elements.apiTokenInput.value = getApiToken();
  if (getApiToken()) {
    elements.providerStatus.textContent = "Live pricing is enabled with your saved PriceCharting token.";
  }

  elements.rangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.range === state.selectedRange);
  });

  renderHistoryChart();
}

function recordSnapshot() {
  const totalValue = state.holdings.reduce(
    (sum, holding) => sum + holding.latestMarketValue * holding.quantity,
    0
  );
  const costBasis = state.holdings.reduce(
    (sum, holding) => sum + holding.purchasePrice * holding.quantity,
    0
  );

  state.history.push({
    timestamp: new Date().toISOString(),
    totalValue,
    totalCostBasis: costBasis,
    totalGain: totalValue - costBasis
  });
}

function loadState() {
  const raw = localStorage.getItem(storageKey);

  if (raw) {
    return JSON.parse(raw);
  }

  const seededState = {
    holdings: sampleHoldings,
    history: [
      {
        timestamp: new Date().toISOString(),
        totalValue: sampleHoldings.reduce((sum, item) => sum + item.latestMarketValue * item.quantity, 0),
        totalCostBasis: sampleHoldings.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0),
        totalGain: sampleHoldings.reduce((sum, item) => sum + (item.latestMarketValue - item.purchasePrice) * item.quantity, 0)
      }
    ]
  };

  localStorage.setItem(storageKey, JSON.stringify(seededState));
  return seededState;
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

async function fetchLivePriceForHolding(holding, token) {
  const searchQuery = buildSearchQuery(holding);
  const searchUrl = new URL("https://www.pricecharting.com/api/products");
  searchUrl.searchParams.set("t", token);
  searchUrl.searchParams.set("q", searchQuery);

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`search ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  if (searchData.status !== "success" || !Array.isArray(searchData.products) || searchData.products.length === 0) {
    throw new Error("no matching listing");
  }

  const matchedProduct = pickBestProduct(searchData.products, holding);
  const productUrl = new URL("https://www.pricecharting.com/api/product");
  productUrl.searchParams.set("t", token);
  productUrl.searchParams.set("id", matchedProduct.id);

  const productResponse = await fetch(productUrl);
  if (!productResponse.ok) {
    throw new Error(`product ${productResponse.status}`);
  }

  const productData = await productResponse.json();
  if (productData.status !== "success") {
    throw new Error("pricing unavailable");
  }

  const price = extractGradePrice(productData, holding.grade);
  if (price == null) {
    throw new Error(`missing ${holding.grade} price`);
  }

  return {
    price,
    matchedName: productData["product-name"] || matchedProduct["product-name"] || "Matched listing"
  };
}

function buildSearchQuery(holding) {
  return [
    holding.title,
    holding.cardNumber,
    holding.setName,
    holding.franchise,
    holding.year
  ]
    .filter(Boolean)
    .join(" ");
}

function pickBestProduct(products, holding) {
  const queryText = `${holding.title} ${holding.setName} ${holding.cardNumber} ${holding.franchise}`.toLowerCase();

  return products
    .map((product) => ({
      product,
      score: scoreProductMatch(product, queryText, holding)
    }))
    .sort((left, right) => right.score - left.score)[0].product;
}

function scoreProductMatch(product, queryText, holding) {
  const name = String(product["product-name"] || "").toLowerCase();
  let score = 0;

  for (const token of queryText.split(/\s+/).filter(Boolean)) {
    if (name.includes(token)) {
      score += token.length > 2 ? 2 : 1;
    }
  }

  if (name.includes(String(holding.cardNumber).toLowerCase())) {
    score += 4;
  }

  return score;
}

function extractGradePrice(productData, grade) {
  const fieldName = gradeToPriceChartingField(grade);
  const pennies = productData[fieldName];

  if (typeof pennies !== "number") {
    return null;
  }

  return pennies / 100;
}

function gradeToPriceChartingField(grade) {
  switch (grade) {
    case "PSA 10":
      return "new-price";
    case "PSA 9":
      return "graded-price";
    case "PSA 8":
      return "manual-only-price";
    case "PSA 7":
      return "cib-price";
    case "PSA 1":
      return "condition-9-price";
    case "PSA 2":
      return "condition-10-price";
    case "PSA 3":
      return "condition-11-price";
    case "PSA 4":
      return "condition-12-price";
    case "PSA 5":
      return "condition-13-price";
    case "PSA 6":
      return "condition-14-price";
    default:
      return "manual-only-price";
  }
}

function getApiToken() {
  return localStorage.getItem(apiTokenStorageKey) || "";
}

function updateProviderStatus(message) {
  elements.providerStatus.textContent = message;
}

function renderHistoryChart() {
  const now = Date.now();
  const rangeConfig = getRangeConfig(state.selectedRange);
  const windowStart = now - rangeConfig.windowMs;
  const filteredHistory = state.history.filter((snapshot) => {
    return new Date(snapshot.timestamp).getTime() >= windowStart;
  });

  const chartHistory = filteredHistory.length > 0 ? filteredHistory : state.history.slice(-Math.min(8, state.history.length));

  elements.chartRangeLabel.textContent = rangeConfig.label;
  elements.chartAxisLabels.innerHTML = "";

  if (chartHistory.length === 0) {
    elements.chartEmptyState.hidden = false;
    elements.chartLine.setAttribute("d", "");
    elements.chartArea.setAttribute("d", "");
    elements.chartGrid.innerHTML = "";
    elements.chartPoints.innerHTML = "";
    return;
  }

  elements.chartEmptyState.hidden = true;

  const width = 960;
  const height = 280;
  const padding = { top: 18, right: 16, bottom: 24, left: 16 };
  const values = chartHistory.map((snapshot) => snapshot.totalValue);
  const times = chartHistory.map((snapshot) => new Date(snapshot.timestamp).getTime());
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const valueSpan = Math.max(maxValue - minValue, Math.max(maxValue * 0.05, 1));
  const lowerBound = Math.max(0, minValue - valueSpan * 0.15);
  const upperBound = maxValue + valueSpan * 0.15;
  const timeSpan = Math.max(maxTime - minTime, 1);

  const points = chartHistory.map((snapshot) => {
    const time = new Date(snapshot.timestamp).getTime();
    const x = padding.left + ((time - minTime) / timeSpan) * (width - padding.left - padding.right);
    const y = padding.top + (1 - ((snapshot.totalValue - lowerBound) / (upperBound - lowerBound))) * (height - padding.top - padding.bottom);
    return { x, y, snapshot };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const areaPath = [
    linePath,
    `L ${points[points.length - 1].x.toFixed(2)} ${(height - padding.bottom).toFixed(2)}`,
    `L ${points[0].x.toFixed(2)} ${(height - padding.bottom).toFixed(2)}`,
    "Z"
  ].join(" ");

  elements.chartLine.setAttribute("d", linePath);
  elements.chartArea.setAttribute("d", areaPath);
  elements.chartGrid.innerHTML = buildChartGrid(width, height, padding, lowerBound, upperBound);
  elements.chartPoints.innerHTML = points
    .map((point) => `<circle class="chart-point" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="5"></circle>`)
    .join("");

  elements.chartAxisLabels.innerHTML = buildAxisLabels(chartHistory, rangeConfig);
}

function getRangeConfig(range) {
  switch (range) {
    case "day":
      return { label: "Last 24 hours", windowMs: 24 * 60 * 60 * 1000 };
    case "month":
      return { label: "Last 30 days", windowMs: 30 * 24 * 60 * 60 * 1000 };
    case "week":
    default:
      return { label: "Last 7 days", windowMs: 7 * 24 * 60 * 60 * 1000 };
  }
}

function buildChartGrid(width, height, padding, lowerBound, upperBound) {
  const rows = 4;
  const lines = [];

  for (let index = 0; index < rows; index += 1) {
    const y = padding.top + (index / (rows - 1)) * (height - padding.top - padding.bottom);
    lines.push(`<line class="chart-grid-line" x1="${padding.left}" y1="${y.toFixed(2)}" x2="${width - padding.right}" y2="${y.toFixed(2)}"></line>`);
  }

  return lines.join("");
}

function buildAxisLabels(chartHistory, rangeConfig) {
  if (chartHistory.length === 1) {
    return `<span>${formatChartTimestamp(chartHistory[0].timestamp, rangeConfig)}</span><span>${formatCurrency(chartHistory[0].totalValue)}</span>`;
  }

  const first = chartHistory[0];
  const middle = chartHistory[Math.floor(chartHistory.length / 2)];
  const last = chartHistory[chartHistory.length - 1];

  return [
    `<span>${formatChartTimestamp(first.timestamp, rangeConfig)}</span>`,
    `<span>${formatChartTimestamp(middle.timestamp, rangeConfig)}</span>`,
    `<span>${formatChartTimestamp(last.timestamp, rangeConfig)}</span>`
  ].join("");
}

function formatChartTimestamp(timestamp, rangeConfig) {
  const date = new Date(timestamp);

  if (rangeConfig.windowMs <= 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
