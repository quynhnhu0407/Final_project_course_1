// API Base URL
const API_BASE = 'http://localhost:5000';

// Store chart instances
let chartInstances = {};

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load data if needed
    if (tabName === 'executive') loadExecutiveOverview();
    if (tabName === 'customer') loadCustomerAnalysis();
    if (tabName === 'product') loadProductPerformance();
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
}

// Format number
function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

// Show error message
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="error">
            <h3>⚠️ Error</h3>
            <p>${message}</p>
        </div>
    `;
}

// Destroy chart if exists
function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
}

// ==================== EXECUTIVE OVERVIEW ====================
let revenueTrendData = null;
let allMonthlyData = null;
let executiveFilterOptions = null;

async function loadExecutiveOverview(filters = {}) {
    const container = document.getElementById('executive-tab');
    
    try {
        // Build query string from filters
        const params = new URLSearchParams();
        if (filters.year) params.append('year', filters.year);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        
        const queryString = params.toString();
        const url = `${API_BASE}/api/executive-overview${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (!result.success) {
            showError('executive-tab', result.error);
            return;
        }

        const data = result.data;
        executiveFilterOptions = result.filter_options;

        container.innerHTML = `
            <h2>📈 Executive Overview</h2>
            
            <div class="chart-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    <h3>Filters</h3>
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <div class="filter-group">
                            <label for="overview-year-filter">Year:</label>
                            <select id="overview-year-filter" onchange="applyExecutiveFilters()">
                                <option value="">All Years</option>
                                ${executiveFilterOptions.years.map(y => 
                                    `<option value="${y}" ${filters.year == y ? 'selected' : ''}>${y}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="start-date-filter">Start Date:</label>
                            <input type="date" id="start-date-filter" 
                                   min="${executiveFilterOptions.date_range.min}" 
                                   max="${executiveFilterOptions.date_range.max}" 
                                   value="${filters.start_date || ''}"
                                   onchange="applyExecutiveFilters()">
                        </div>
                        <div class="filter-group">
                            <label for="end-date-filter">End Date:</label>
                            <input type="date" id="end-date-filter" 
                                   min="${executiveFilterOptions.date_range.min}" 
                                   max="${executiveFilterOptions.date_range.max}" 
                                   value="${filters.end_date || ''}"
                                   onchange="applyExecutiveFilters()">
                        </div>
                        <button class="btn btn-secondary" onclick="resetExecutiveFilters()">Reset Filters</button>
                    </div>
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Revenue</h3>
                    <div class="value">${formatCurrency(data.total_revenue)}</div>
                    <div class="subtext">Overall sales performance</div>
                </div>
                
                <div class="metric-card">
                    <h3>Total Orders</h3>
                    <div class="value">${formatNumber(data.total_orders)}</div>
                    <div class="subtext">Number of transactions</div>
                </div>
                
                <div class="metric-card">
                    <h3>Total Customers</h3>
                    <div class="value">${formatNumber(data.total_customers)}</div>
                    <div class="subtext">Unique customers</div>
                </div>
                
                <div class="metric-card">
                    <h3>Average Order Value</h3>
                    <div class="value">${formatCurrency(data.aov)}</div>
                    <div class="subtext">Per transaction</div>
                </div>
                
                <div class="metric-card">
                    <h3>Revenue Growth</h3>
                    <div class="value">${data.revenue_growth_percent.toFixed(2)}%</div>
                    <div class="subtext">Year over year</div>
                </div>
            </div>

            <div class="chart-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    <h2>Revenue Trend</h2>
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <div id="year-filter" class="filter-group">
                            <label for="year-select">Year:</label>
                            <select id="year-select" onchange="filterByYear(this.value)">
                                <option value="all">All Years</option>
                            </select>
                        </div>
                        <div class="chart-controls">
                            <button class="btn btn-primary active" onclick="switchRevenueView('year')">View by Year</button>
                            <button class="btn btn-secondary" onclick="switchRevenueView('month')">View by Month</button>
                        </div>
                    </div>
                </div>
                <div class="chart">
                    <canvas id="revenue-chart"></canvas>
                </div>
            </div>
        `;

        // Store data for switching
        revenueTrendData = {
            year: data.revenue_by_year,
            month: null
        };

        // Load monthly data
        await loadRevenueTrend();

        // Render initial chart (by year)
        renderBarChart('revenue-chart', data.revenue_by_year, 'Revenue by Year', '#1e3c72');

    } catch (error) {
        showError('executive-tab', `Failed to load data: ${error.message}`);
    }
}

// Load revenue trend (monthly)
async function loadRevenueTrend() {
    try {
        const response = await fetch(`${API_BASE}/api/revenue-trend`);
        const result = await response.json();
        
        if (!result.success) return;

        // Store all monthly data
        allMonthlyData = {};
        const years = new Set();
        
        result.data.forEach(item => {
            allMonthlyData[item.month] = item.revenue;
            const year = item.month.split('-')[0];
            years.add(year);
        });

        // Populate year filter dropdown
        const yearSelect = document.getElementById('year-select');
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        // Store monthly data
        revenueTrendData.month = allMonthlyData;

    } catch (error) {
        console.error('Failed to load revenue trend:', error);
    }
}

// Filter monthly data by year
function filterByYear(year) {
    if (!allMonthlyData) return;

    let filteredData = {};
    
    if (year === 'all') {
        filteredData = allMonthlyData;
    } else {
        Object.keys(allMonthlyData).forEach(month => {
            if (month.startsWith(year)) {
                filteredData[month] = allMonthlyData[month];
            }
        });
    }

    renderBarChart('revenue-chart', filteredData, `Revenue by Month (${year === 'all' ? 'All Years' : year})`, '#2a5298');
}

// Switch between year and month view
function switchRevenueView(view) {
    if (!revenueTrendData) return;

    // Update button states
    document.querySelectorAll('.chart-controls .btn').forEach(btn => {
        btn.classList.remove('btn-primary', 'btn-secondary', 'active');
    });

    const yearFilter = document.getElementById('year-filter');

    if (view === 'year') {
        event.target.classList.add('btn-primary', 'active');
        event.target.nextElementSibling.classList.add('btn-secondary');
        yearFilter.style.display = 'none';
        renderBarChart('revenue-chart', revenueTrendData.year, 'Revenue by Year', '#1e3c72');
    } else {
        event.target.classList.add('btn-primary', 'active');
        event.target.previousElementSibling.classList.add('btn-secondary');
        yearFilter.style.display = 'flex';
        
        // Reset to all years
        document.getElementById('year-select').value = 'all';
        
        if (revenueTrendData.month) {
            renderBarChart('revenue-chart', revenueTrendData.month, 'Revenue by Month (All Years)', '#2a5298');
        }
    }
}

// ==================== CUSTOMER ANALYSIS ====================
let customerFilterOptions = null;

async function loadCustomerAnalysis(filters = {}) {
    const container = document.getElementById('customer-tab');
    
    try {
        // Build query string from filters
        const params = new URLSearchParams();
        if (filters.loyalty_member) params.append('loyalty_member', filters.loyalty_member);
        if (filters.city) params.append('city', filters.city);
        if (filters.age_group) params.append('age_group', filters.age_group);
        
        const queryString = params.toString();
        const url = `${API_BASE}/api/customer-analysis${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (!result.success) {
            showError('customer-tab', result.error);
            return;
        }

        const data = result.data;
        customerFilterOptions = result.filter_options;

        container.innerHTML = `
            <h2>👥 Customer Analysis</h2>
            
            <div class="chart-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    <h3>Filters</h3>
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <div class="filter-group">
                            <label for="loyalty-filter">Loyalty Member:</label>
                            <select id="loyalty-filter" onchange="applyCustomerFilters()">
                                <option value="">All</option>
                                ${customerFilterOptions.loyalty_members.map(lm => 
                                    `<option value="${lm}" ${filters.loyalty_member === lm ? 'selected' : ''}>${lm}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="city-filter">City:</label>
                            <select id="city-filter" onchange="applyCustomerFilters()">
                                <option value="">All</option>
                                ${customerFilterOptions.cities.map(city => 
                                    `<option value="${city}" ${filters.city === city ? 'selected' : ''}>${city}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="age-group-filter">Age Group:</label>
                            <select id="age-group-filter" onchange="applyCustomerFilters()">
                                <option value="">All</option>
                                ${customerFilterOptions.age_groups.map(ag => 
                                    `<option value="${ag}" ${filters.age_group === ag ? 'selected' : ''}>${ag}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <button class="btn btn-secondary" onclick="resetCustomerFilters()">Reset Filters</button>
                    </div>
                </div>
            </div>
            
            <div class="two-column">
                <div class="chart-container">
                    <h2>New vs Returning Customers</h2>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h3>New Customers</h3>
                            <div class="value">${formatNumber(data.new_vs_returning.new_customers)}</div>
                        </div>
                        <div class="metric-card">
                            <h3>Returning Customers</h3>
                            <div class="value">${formatNumber(data.new_vs_returning.returning_customers)}</div>
                        </div>
                    </div>
                </div>

                <div class="chart-container">
                    <h2>Customer Loyalty</h2>
                    <div class="chart">
                        <canvas id="loyalty-chart"></canvas>
                    </div>
                </div>
            </div>

            <div class="chart-container">
                <h2>Top 10 Customers</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>City</th>
                            <th>Loyalty Member</th>
                            <th>Total Revenue</th>
                            <th>Order Count</th>
                        </tr>
                    </thead>
                    <tbody id="top-customers-table"></tbody>
                </table>
            </div>

            <div class="chart-container">
                <h2>Purchase Frequency Distribution</h2>
                <div class="bar-chart" id="frequency-chart"></div>
            </div>

            <div class="chart-container">
                <h2>Age Segmentation</h2>
                <div class="bar-chart" id="age-chart"></div>
            </div>
        `;

        // Render top customers table
        const tableBody = document.getElementById('top-customers-table');
        data.top_customers.forEach(customer => {
            const row = `
                <tr>
                    <td>${customer.customer_id}</td>
                    <td>${customer.city}</td>
                    <td>${customer.loyalty_member}</td>
                    <td>${formatCurrency(customer.total_revenue)}</td>
                    <td>${customer.order_count}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        // Render loyalty chart as donut chart
        const loyaltyData = {};
        data.loyalty_segmentation.forEach(item => {
            loyaltyData[item.loyalty_member] = item.total_revenue;
        });
        renderDonutChart('loyalty-chart', loyaltyData, 'Revenue by Loyalty');

        // Convert purchase frequency numbers to customer names (hardcoded for test data)
        const frequencyNames = {
            '1': 'One-time Buyers',
            '2': 'Occasional Shoppers',
            '3': 'Regular Customers',
            '4': 'Frequent Buyers',
            '5': 'Loyal Patrons',
            '6': 'VIP Customers',
            '7': 'Elite Members',
            '8': 'Top Advocates',
            '9': 'Premium Collectors',
            '10': 'Ultimate Champions'
        };
        
        const namedFrequencyData = {};
        Object.keys(data.purchase_frequency).forEach(key => {
            const name = frequencyNames[key] || `${key} Purchases`;
            namedFrequencyData[name] = data.purchase_frequency[key];
        });

        // Render frequency chart
        renderSimpleBarChart('frequency-chart', namedFrequencyData, (v) => `${v}`);

        // Render age segmentation
        renderSimpleBarChart('age-chart', data.age_segmentation, (v) => `${v}`);

    } catch (error) {
        showError('customer-tab', `Failed to load data: ${error.message}`);
    }
}

// ==================== PRODUCT PERFORMANCE ====================
let productFilterOptions = null;

async function loadProductPerformance(filters = {}) {
    const container = document.getElementById('product-tab');
    
    try {
        // Build query string from filters
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.price_min) params.append('price_min', filters.price_min);
        if (filters.price_max) params.append('price_max', filters.price_max);
        
        const queryString = params.toString();
        const url = `${API_BASE}/api/product-performance${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (!result.success) {
            showError('product-tab', result.error);
            return;
        }

        const data = result.data;
        productFilterOptions = result.filter_options;

        container.innerHTML = `
            <h2>🛍️ Product Performance</h2>
            
            <div class="chart-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    <h3>Filters</h3>
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <div class="filter-group">
                            <label for="category-filter">Category:</label>
                            <select id="category-filter" onchange="applyProductFilters()">
                                <option value="">All</option>
                                ${productFilterOptions.categories.map(cat => 
                                    `<option value="${cat}" ${filters.category === cat ? 'selected' : ''}>${cat}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="price-min-filter">Price Min:</label>
                            <input type="number" id="price-min-filter" 
                                   min="${productFilterOptions.price_range.min}" 
                                   max="${productFilterOptions.price_range.max}" 
                                   step="10"
                                   value="${filters.price_min || ''}"
                                   placeholder="Min"
                                   onchange="applyProductFilters()">
                        </div>
                        <div class="filter-group">
                            <label for="price-max-filter">Price Max:</label>
                            <input type="number" id="price-max-filter" 
                                   min="${productFilterOptions.price_range.min}" 
                                   max="${productFilterOptions.price_range.max}" 
                                   step="10"
                                   value="${filters.price_max || ''}"
                                   placeholder="Max"
                                   onchange="applyProductFilters()">
                        </div>
                        <button class="btn btn-secondary" onclick="resetProductFilters()">Reset Filters</button>
                    </div>
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Quantity Sold</h3>
                    <div class="value">${formatNumber(data.total_quantity_sold)}</div>
                    <div class="subtext">Units sold</div>
                </div>
            </div>

            <div class="two-column">
                <div class="chart-container">
                    <h2>Best Performing Products</h2>
                    <div class="bar-chart" id="best-products-chart"></div>
                </div>

                <div class="chart-container">
                    <h2>Worst Performing Products</h2>
                    <div class="bar-chart" id="worst-products-chart"></div>
                </div>
            </div>

            <div class="chart-container">
                <h2>Revenue by Category</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Total Revenue</th>
                            <th>Quantity Sold</th>
                            <th>Order Count</th>
                        </tr>
                    </thead>
                    <tbody id="category-table"></tbody>
                </table>
            </div>

            <div class="chart-container">
                <h2>Top 10 Products</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Total Revenue</th>
                            <th>Quantity Sold</th>
                        </tr>
                    </thead>
                    <tbody id="top-products-table"></tbody>
                </table>
            </div>
        `;

        // Render best products
        const bestData = {};
        data.best_products.forEach(p => {
            bestData[p.product_name] = p.total_revenue;
        });
        renderSimpleBarChart('best-products-chart', bestData, formatCurrency);

        // Render worst products
        const worstData = {};
        data.worst_products.forEach(p => {
            worstData[p.product_name] = p.total_revenue;
        });
        renderSimpleBarChart('worst-products-chart', worstData, formatCurrency);

        // Render category table
        const categoryTable = document.getElementById('category-table');
        data.revenue_by_category.forEach(cat => {
            const row = `
                <tr>
                    <td><strong>${cat.category}</strong></td>
                    <td>${formatCurrency(cat.total_revenue)}</td>
                    <td>${formatNumber(cat.quantity_sold)}</td>
                    <td>${formatNumber(cat.order_count)}</td>
                </tr>
            `;
            categoryTable.innerHTML += row;
        });

        // Render top products table
        const productsTable = document.getElementById('top-products-table');
        data.top_10_products.forEach(product => {
            const row = `
                <tr>
                    <td>${product.product_id}</td>
                    <td>${product.product_name}</td>
                    <td>${product.category}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${formatCurrency(product.total_revenue)}</td>
                    <td>${formatNumber(product.quantity_sold)}</td>
                </tr>
            `;
            productsTable.innerHTML += row;
        });

    } catch (error) {
        showError('product-tab', `Failed to load data: ${error.message}`);
    }
}

// ==================== CHART RENDERING ====================

// Render Bar Chart using Chart.js
function renderBarChart(canvasId, data, label, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destroy existing chart
    destroyChart(canvasId);

    const ctx = canvas.getContext('2d');
    const entries = Object.entries(data);
    const labels = entries.map(([key, _]) => key);
    const values = entries.map(([_, value]) => value);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: values,
                backgroundColor: color,
                borderColor: color,
                borderWidth: 2,
                borderRadius: 8,
                barThickness: labels.length > 10 ? 30 : 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 14 },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    anchor: 'end',
                    align: 'top',
                    offset: -5,
                    font: {
                        size: 11,
                        weight: 'bold'
                    },
                    formatter: function(value) {
                        return formatCurrency(value);
                    },
                    display: function(context) {
                        // Only show labels if there aren't too many bars
                        return context.chart.data.labels.length <= 12;
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 12 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Render Donut Chart using Chart.js
function renderDonutChart(canvasId, data, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destroy existing chart
    destroyChart(canvasId);

    const ctx = canvas.getContext('2d');
    const entries = Object.entries(data);
    const labels = entries.map(([key, _]) => key);
    const values = entries.map(([_, value]) => value);

    // Color palette - Red for "No", Navy for "Yes"
    const colors = labels.map(label => {
        if (label.toLowerCase() === 'no') {
            return '#d32f2f'; // Đỏ cho No (risk/warning)
        } else {
            return '#1e3c72'; // Navy cho Yes (good)
        }
    });

    // Calculate total for percentages
    const total = values.reduce((a, b) => a + b, 0);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: values,
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { size: 14 },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    formatter: function(value, context) {
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${percentage}%`;
                    },
                    anchor: 'center',
                    align: 'center',
                    offset: 0,
                    textAlign: 'center',
                    display: true
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Render Line Chart using Chart.js
function renderLineChart(canvasId, data, label, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destroy existing chart
    destroyChart(canvasId);

    const ctx = canvas.getContext('2d');
    const entries = Object.entries(data);
    const labels = entries.map(([key, _]) => key);
    const values = entries.map(([_, value]) => value);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: values,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 14 },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                },
                datalabels: {
                    color: color,
                    anchor: 'end',
                    align: 'top',
                    offset: 5,
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    formatter: function(value) {
                        return formatCurrency(value);
                    },
                    display: function(context) {
                        // Only show labels if there aren't too many points
                        return context.chart.data.labels.length <= 12;
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 12 }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderSimpleBarChart(containerId, data, formatFunc) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const entries = Object.entries(data);
    const totalValue = entries.reduce((sum, [_, v]) => sum + v, 0);
    const maxValue = Math.max(...entries.map(([_, v]) => v));

    container.innerHTML = '';

    entries.forEach(([label, value]) => {
        const widthPercentage = (value / maxValue) * 100;
        const valuePercentage = ((value / totalValue) * 100).toFixed(1);
        const displayText = `${formatFunc(value)} (${valuePercentage}%)`;
        
        // Nếu thanh bar quá nhỏ (< 15%), đặt text bên ngoài
        const isSmallBar = widthPercentage < 15;
        
        const barItem = document.createElement('div');
        barItem.className = 'bar-item';
        barItem.innerHTML = `
            <div class="bar-label">${label}</div>
            <div class="bar-track">
                <div class="bar-fill ${isSmallBar ? 'small-bar' : ''}" style="width: ${widthPercentage}%">
                    ${isSmallBar ? '' : displayText}
                </div>
                ${isSmallBar ? `<div class="bar-text-outside">${displayText}</div>` : ''}
            </div>
        `;
        container.appendChild(barItem);
    });
}

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    loadExecutiveOverview();
});

// ==================== FILTER FUNCTIONS ====================

// Executive Overview Filters
function applyExecutiveFilters() {
    const filters = {
        year: document.getElementById('overview-year-filter').value,
        start_date: document.getElementById('start-date-filter').value,
        end_date: document.getElementById('end-date-filter').value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    loadExecutiveOverview(filters);
}

function resetExecutiveFilters() {
    document.getElementById('overview-year-filter').value = '';
    document.getElementById('start-date-filter').value = '';
    document.getElementById('end-date-filter').value = '';
    loadExecutiveOverview();
}

// Customer Analysis Filters
function applyCustomerFilters() {
    const filters = {
        loyalty_member: document.getElementById('loyalty-filter').value,
        city: document.getElementById('city-filter').value,
        age_group: document.getElementById('age-group-filter').value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    loadCustomerAnalysis(filters);
}

function resetCustomerFilters() {
    document.getElementById('loyalty-filter').value = '';
    document.getElementById('city-filter').value = '';
    document.getElementById('age-group-filter').value = '';
    loadCustomerAnalysis();
}

// Product Performance Filters
function applyProductFilters() {
    const filters = {
        category: document.getElementById('category-filter').value,
        price_min: document.getElementById('price-min-filter').value,
        price_max: document.getElementById('price-max-filter').value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    loadProductPerformance(filters);
}

function resetProductFilters() {
    document.getElementById('category-filter').value = '';
    document.getElementById('price-min-filter').value = '';
    document.getElementById('price-max-filter').value = '';
    loadProductPerformance();
}
