// API Base URL - use relative path to work with both localhost and ngrok
const API_BASE = window.location.origin;

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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>📈 Executive Overview</h2>
                <div class="export-button">
                    <button class="btn btn-primary" onclick="toggleExportMenu('executive')">📥 Export Report</button>
                    <div id="executive-export-menu" class="export-dropdown">
                        <button onclick="exportToPDF('executive')">📄 Export to PDF</button>
                        <button onclick="exportToExcel('executive')">📊 Export to Excel</button>
                        <button onclick="exportToCSV('executive')">📋 Export to CSV</button>
                    </div>
                </div>
            </div>
            
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
                            <label for="month-filter">Month:</label>
                            <select id="month-filter" onchange="applyExecutiveFilters()">
                                <option value="">All Months</option>
                                <option value="01" ${filters.month === '01' ? 'selected' : ''}>January</option>
                                <option value="02" ${filters.month === '02' ? 'selected' : ''}>February</option>
                                <option value="03" ${filters.month === '03' ? 'selected' : ''}>March</option>
                                <option value="04" ${filters.month === '04' ? 'selected' : ''}>April</option>
                                <option value="05" ${filters.month === '05' ? 'selected' : ''}>May</option>
                                <option value="06" ${filters.month === '06' ? 'selected' : ''}>June</option>
                                <option value="07" ${filters.month === '07' ? 'selected' : ''}>July</option>
                                <option value="08" ${filters.month === '08' ? 'selected' : ''}>August</option>
                                <option value="09" ${filters.month === '09' ? 'selected' : ''}>September</option>
                                <option value="10" ${filters.month === '10' ? 'selected' : ''}>October</option>
                                <option value="11" ${filters.month === '11' ? 'selected' : ''}>November</option>
                                <option value="12" ${filters.month === '12' ? 'selected' : ''}>December</option>
                            </select>
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
                    <div class="chart-controls">
                        <button class="btn btn-primary active" onclick="switchRevenueView('year')">View by Year</button>
                        <button class="btn btn-secondary" onclick="switchRevenueView('month')">View by Month</button>
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

        // Load monthly data with year filter
        await loadRevenueTrend(filters.year);

        // Render initial chart (by year)
        renderBarChart('revenue-chart', data.revenue_by_year, 'Revenue by Year', '#1e3c72');

    } catch (error) {
        showError('executive-tab', `Failed to load data: ${error.message}`);
    }
}

// Load revenue trend (monthly)
async function loadRevenueTrend(yearFilter = null) {
    try {
        // Build URL with year filter if provided
        let url = `${API_BASE}/api/revenue-trend`;
        if (yearFilter) {
            url += `?year=${yearFilter}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (!result.success) return;

        // Store all monthly data
        allMonthlyData = {};
        
        result.data.forEach(item => {
            allMonthlyData[item.month] = item.revenue;
        });

        // Store monthly data
        revenueTrendData.month = allMonthlyData;

    } catch (error) {
        console.error('Failed to load revenue trend:', error);
    }
}

// Switch between year and month view
async function switchRevenueView(view) {
    if (!revenueTrendData) return;

    // Update button states
    document.querySelectorAll('.chart-controls .btn').forEach(btn => {
        btn.classList.remove('btn-primary', 'btn-secondary', 'active');
    });

    if (view === 'year') {
        event.target.classList.add('btn-primary', 'active');
        event.target.nextElementSibling.classList.add('btn-secondary');
        renderBarChart('revenue-chart', revenueTrendData.year, 'Revenue by Year', '#1e3c72');
    } else {
        event.target.classList.add('btn-primary', 'active');
        event.target.previousElementSibling.classList.add('btn-secondary');
        
        // Reload monthly data with current year filter
        const yearFilter = document.getElementById('overview-year-filter')?.value || null;
        await loadRevenueTrend(yearFilter);
        
        if (revenueTrendData.month) {
            const title = yearFilter ? `Revenue by Month (${yearFilter})` : 'Revenue by Month (All Years)';
            renderBarChart('revenue-chart', revenueTrendData.month, title, '#2a5298');
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>👥 Customer Analysis</h2>
                <div class="export-button">
                    <button class="btn btn-primary" onclick="toggleExportMenu('customer')">📥 Export Report</button>
                    <div id="customer-export-menu" class="export-dropdown">
                        <button onclick="exportToPDF('customer')">📄 Export to PDF</button>
                        <button onclick="exportToExcel('customer')">📊 Export to Excel</button>
                        <button onclick="exportToCSV('customer')">📋 Export to CSV</button>
                    </div>
                </div>
            </div>
            
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>🛍️ Product Performance</h2>
                <div class="export-button">
                    <button class="btn btn-primary" onclick="toggleExportMenu('product')">📥 Export Report</button>
                    <div id="product-export-menu" class="export-dropdown">
                        <button onclick="exportToPDF('product')">📄 Export to PDF</button>
                        <button onclick="exportToExcel('product')">📊 Export to Excel</button>
                        <button onclick="exportToCSV('product')">📋 Export to CSV</button>
                    </div>
                </div>
            </div>
            
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
                        <div class="filter-group">
                            <label for="product-start-date">From Date:</label>
                            <input type="date" id="product-start-date" 
                                   min="${productFilterOptions.date_range.min}" 
                                   max="${productFilterOptions.date_range.max}" 
                                   value="${filters.start_date || ''}"
                                   onchange="applyProductFilters()">
                        </div>
                        <div class="filter-group">
                            <label for="product-end-date">To Date:</label>
                            <input type="date" id="product-end-date" 
                                   min="${productFilterOptions.date_range.min}" 
                                   max="${productFilterOptions.date_range.max}" 
                                   value="${filters.end_date || ''}"
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
        month: document.getElementById('month-filter').value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    loadExecutiveOverview(filters);
}

function resetExecutiveFilters() {
    document.getElementById('overview-year-filter').value = '';
    document.getElementById('month-filter').value = '';
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
        price_max: document.getElementById('price-max-filter').value,
        start_date: document.getElementById('product-start-date').value,
        end_date: document.getElementById('product-end-date').value
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
    document.getElementById('product-start-date').value = '';
    document.getElementById('product-end-date').value = '';
    loadProductPerformance();
}


// ==================== EXPORT FUNCTIONS ====================

// Toggle export menu
function toggleExportMenu(page) {
    const menu = document.getElementById(`${page}-export-menu`);
    const allMenus = document.querySelectorAll('.export-dropdown');
    
    // Close all other menus
    allMenus.forEach(m => {
        if (m !== menu) m.classList.remove('show');
    });
    
    // Toggle current menu
    menu.classList.toggle('show');
}

// Close export menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.export-button')) {
        document.querySelectorAll('.export-dropdown').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Export to PDF
async function exportToPDF(page) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const container = document.getElementById(`${page}-tab`);
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let position = 10;
        
        // Add title
        doc.setFontSize(18);
        doc.setTextColor(30, 60, 114);
        doc.text(`${getPageTitle(page)} Report`, 105, position, { align: 'center' });
        position += 10;
        
        // Add date
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 105, position, { align: 'center' });
        position += 10;
        
        // Add image
        if (imgHeight > 270) {
            // Split into multiple pages
            let heightLeft = imgHeight;
            let currentPosition = 0;
            
            while (heightLeft > 0) {
                doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, '', 'FAST', currentPosition);
                heightLeft -= 270;
                currentPosition -= 270;
                
                if (heightLeft > 0) {
                    doc.addPage();
                    position = 10;
                }
            }
        } else {
            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        }
        
        doc.save(`${page}-report-${Date.now()}.pdf`);
        toggleExportMenu(page);
        
        // Show success message
        showToast('PDF exported successfully!', 'success');
    } catch (error) {
        console.error('PDF export failed:', error);
        showToast('Failed to export PDF', 'error');
    }
}

// Export to Excel
function exportToExcel(page) {
    try {
        const wb = XLSX.utils.book_new();
        const data = getCurrentPageData(page);
        
        if (!data) {
            showToast('No data to export', 'error');
            return;
        }
        
        // Convert data to worksheet
        Object.keys(data).forEach(sheetName => {
            const ws = XLSX.utils.json_to_sheet(data[sheetName]);
            XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Excel sheet name limit
        });
        
        XLSX.writeFile(wb, `${page}-report-${Date.now()}.xlsx`);
        toggleExportMenu(page);
        
        showToast('Excel exported successfully!', 'success');
    } catch (error) {
        console.error('Excel export failed:', error);
        showToast('Failed to export Excel', 'error');
    }
}

// Export to CSV
function exportToCSV(page) {
    try {
        const data = getCurrentPageData(page);
        
        if (!data) {
            showToast('No data to export', 'error');
            return;
        }
        
        // Export first dataset as CSV
        const firstKey = Object.keys(data)[0];
        const csvData = data[firstKey];
        
        if (!csvData || csvData.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
        
        // Convert to CSV
        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(h => {
                const value = row[h];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(','))
        ].join('\n');
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${page}-report-${Date.now()}.csv`;
        link.click();
        
        toggleExportMenu(page);
        showToast('CSV exported successfully!', 'success');
    } catch (error) {
        console.error('CSV export failed:', error);
        showToast('Failed to export CSV', 'error');
    }
}

// Get current page data for export
function getCurrentPageData(page) {
    const tables = document.querySelectorAll(`#${page}-tab table`);
    const data = {};
    
    tables.forEach((table, index) => {
        const rows = Array.from(table.querySelectorAll('tr'));
        const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
        const tableData = rows.slice(1).map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            const rowData = {};
            headers.forEach((header, i) => {
                rowData[header] = cells[i] ? cells[i].textContent.trim() : '';
            });
            return rowData;
        });
        
        const sheetName = table.previousElementSibling?.textContent || `Data ${index + 1}`;
        data[sheetName] = tableData;
    });
    
    return Object.keys(data).length > 0 ? data : null;
}

// Get page title
function getPageTitle(page) {
    const titles = {
        'executive': 'Executive Overview',
        'customer': 'Customer Analysis',
        'product': 'Product Performance'
    };
    return titles[page] || page;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
