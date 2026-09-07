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

async function loadExecutiveOverview() {
    const container = document.getElementById('executive-tab');
    
    try {
        const response = await fetch(`${API_BASE}/api/executive-overview`);
        const result = await response.json();
        
        if (!result.success) {
            showError('executive-tab', result.error);
            return;
        }

        const data = result.data;

        container.innerHTML = `
            <h2>📈 Executive Overview</h2>
            
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
async function loadCustomerAnalysis() {
    const container = document.getElementById('customer-tab');
    
    try {
        const response = await fetch(`${API_BASE}/api/customer-analysis`);
        const result = await response.json();
        
        if (!result.success) {
            showError('customer-tab', result.error);
            return;
        }

        const data = result.data;

        container.innerHTML = `
            <h2>👥 Customer Analysis</h2>
            
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

        // Render frequency chart
        renderSimpleBarChart('frequency-chart', data.purchase_frequency, (v) => `${v}`);

        // Render age segmentation
        renderSimpleBarChart('age-chart', data.age_segmentation, (v) => `${v}`);

    } catch (error) {
        showError('customer-tab', `Failed to load data: ${error.message}`);
    }
}

// ==================== PRODUCT PERFORMANCE ====================
async function loadProductPerformance() {
    const container = document.getElementById('product-tab');
    
    try {
        const response = await fetch(`${API_BASE}/api/product-performance`);
        const result = await response.json();
        
        if (!result.success) {
            showError('product-tab', result.error);
            return;
        }

        const data = result.data;

        container.innerHTML = `
            <h2>🛍️ Product Performance</h2>
            
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
        }
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
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
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
        }
    });
}

function renderSimpleBarChart(containerId, data, formatFunc) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const entries = Object.entries(data);
    const maxValue = Math.max(...entries.map(([_, v]) => v));

    container.innerHTML = '';

    entries.forEach(([label, value]) => {
        const percentage = (value / maxValue) * 100;
        const barItem = document.createElement('div');
        barItem.className = 'bar-item';
        barItem.innerHTML = `
            <div class="bar-label">${label}</div>
            <div class="bar-track">
                <div class="bar-fill" style="width: ${percentage}%">
                    ${formatFunc(value)}
                </div>
            </div>
        `;
        container.appendChild(barItem);
    });
}

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    loadExecutiveOverview();
});
