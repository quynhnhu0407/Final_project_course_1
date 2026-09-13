from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Đường dẫn folder dataset (absolute path)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_FOLDER = os.path.join(BASE_DIR, "dataset")

# Hàm đọc dữ liệu
def load_data():
    """Load all CSV files"""
    customers = pd.read_csv(os.path.join(DATASET_FOLDER, "customers.csv"))
    orders = pd.read_csv(os.path.join(DATASET_FOLDER, "orders.csv"))
    products = pd.read_csv(os.path.join(DATASET_FOLDER, "products.csv"))
    return customers, orders, products

# Route để serve HTML report
@app.route('/')
def serve_report():
    """Serve the main report HTML"""
    return send_from_directory('.', 'report.html')

# Route để serve JS file
@app.route('/report.js')
def serve_js():
    """Serve the report JavaScript"""
    return send_from_directory('.', 'report.js')

# ==================== EXECUTIVE OVERVIEW APIs ====================

@app.route('/api/executive-overview', methods=['GET'])
def get_executive_overview():
    """
    API cho trang Executive Overview
    Trả về: Total Revenue, Total Orders, Total Customers, AOV, Revenue Growth %
    """
    try:
        customers, orders, products = load_data()
        
        # Merge orders với products để có giá
        orders_with_price = orders.merge(products[['product_id', 'price']], on='product_id')
        orders_with_price['total_price'] = orders_with_price['quantity'] * orders_with_price['price']
        
        # Total Revenue
        total_revenue = orders_with_price['total_price'].sum()
        
        # Total Orders
        total_orders = len(orders)
        
        # Total Customers
        total_customers = customers['customer_id'].nunique()
        
        # AOV (Average Order Value)
        aov = total_revenue / total_orders if total_orders > 0 else 0
        
        # Revenue Growth % (so sánh 2023 vs 2024)
        orders_with_price['order_date'] = pd.to_datetime(orders_with_price['order_date'])
        orders_with_price['year'] = orders_with_price['order_date'].dt.year
        
        revenue_by_year = orders_with_price.groupby('year')['total_price'].sum().to_dict()
        
        revenue_2023 = revenue_by_year.get(2023, 0)
        revenue_2024 = revenue_by_year.get(2024, 0)
        
        if revenue_2023 > 0:
            revenue_growth = ((revenue_2024 - revenue_2023) / revenue_2023) * 100
        else:
            revenue_growth = 0
        
        return jsonify({
            "success": True,
            "data": {
                "total_revenue": round(total_revenue, 2),
                "total_orders": total_orders,
                "total_customers": total_customers,
                "aov": round(aov, 2),
                "revenue_growth_percent": round(revenue_growth, 2),
                "revenue_by_year": {str(k): round(v, 2) for k, v in revenue_by_year.items()}
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== CUSTOMER ANALYSIS APIs ====================

@app.route('/api/customer-analysis', methods=['GET'])
def get_customer_analysis():
    """
    API cho trang Customer Analysis
    Trả về: New vs Returning Customers, Top Customers, Purchase Frequency, Segmentation
    """
    try:
        customers, orders, products = load_data()
        
        # Merge để có đầy đủ thông tin
        orders_with_price = orders.merge(products[['product_id', 'price']], on='product_id')
        orders_with_price['total_price'] = orders_with_price['quantity'] * orders_with_price['price']
        orders_with_customer = orders_with_price.merge(customers, on='customer_id')
        
        # 1. New vs Returning Customers (dựa trên số lần mua)
        customer_order_count = orders.groupby('customer_id').size().reset_index(name='order_count')
        new_customers = len(customer_order_count[customer_order_count['order_count'] == 1])
        returning_customers = len(customer_order_count[customer_order_count['order_count'] > 1])
        
        # 2. Top 10 Customers (theo doanh thu)
        customer_revenue = orders_with_customer.groupby(['customer_id', 'loyalty_member', 'city']).agg({
            'total_price': 'sum',
            'order_id': 'count'
        }).reset_index()
        customer_revenue.columns = ['customer_id', 'loyalty_member', 'city', 'total_revenue', 'order_count']
        top_customers = customer_revenue.nlargest(10, 'total_revenue').to_dict('records')
        
        # 3. Customer Purchase Frequency
        frequency_dist = customer_order_count['order_count'].value_counts().sort_index().to_dict()
        
        # 4. Customer Segmentation (theo loyalty member)
        loyalty_stats = orders_with_customer.groupby('loyalty_member').agg({
            'customer_id': 'nunique',
            'total_price': 'sum',
            'order_id': 'count'
        }).reset_index()
        loyalty_stats.columns = ['loyalty_member', 'customer_count', 'total_revenue', 'order_count']
        
        # Segmentation theo tuổi
        customers['age_group'] = pd.cut(customers['age'], 
                                        bins=[0, 25, 35, 50, 100], 
                                        labels=['18-25', '26-35', '36-50', '50+'])
        age_segment = customers.groupby('age_group').size().to_dict()
        
        return jsonify({
            "success": True,
            "data": {
                "new_vs_returning": {
                    "new_customers": new_customers,
                    "returning_customers": returning_customers
                },
                "top_customers": top_customers,
                "purchase_frequency": {str(k): v for k, v in frequency_dist.items()},
                "loyalty_segmentation": loyalty_stats.to_dict('records'),
                "age_segmentation": {str(k): v for k, v in age_segment.items()}
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== PRODUCT PERFORMANCE APIs ====================

@app.route('/api/product-performance', methods=['GET'])
def get_product_performance():
    """
    API cho trang Product Performance
    Trả về: Top 10 Products, Revenue by Category, Quantity Sold, Best/Worst Products
    """
    try:
        customers, orders, products = load_data()
        
        # Merge orders với products
        orders_with_products = orders.merge(products, on='product_id')
        orders_with_products['total_price'] = orders_with_products['quantity'] * orders_with_products['price']
        
        # 1. Top 10 Products (theo doanh thu)
        product_revenue = orders_with_products.groupby(['product_id', 'product_name', 'category', 'price']).agg({
            'total_price': 'sum',
            'quantity': 'sum',
            'order_id': 'count'
        }).reset_index()
        product_revenue.columns = ['product_id', 'product_name', 'category', 'price', 'total_revenue', 'quantity_sold', 'order_count']
        
        top_10_products = product_revenue.nlargest(10, 'total_revenue').to_dict('records')
        
        # 2. Revenue by Category
        category_revenue = orders_with_products.groupby('category').agg({
            'total_price': 'sum',
            'quantity': 'sum',
            'order_id': 'count'
        }).reset_index()
        category_revenue.columns = ['category', 'total_revenue', 'quantity_sold', 'order_count']
        
        # 3. Total Quantity Sold
        total_quantity = orders['quantity'].sum()
        
        # 4. Best Products (top 5 theo doanh thu)
        best_products = product_revenue.nlargest(5, 'total_revenue')[['product_name', 'total_revenue']].to_dict('records')
        
        # 5. Worst Products (bottom 5 theo doanh thu)
        worst_products = product_revenue.nsmallest(5, 'total_revenue')[['product_name', 'total_revenue']].to_dict('records')
        
        return jsonify({
            "success": True,
            "data": {
                "top_10_products": top_10_products,
                "revenue_by_category": category_revenue.to_dict('records'),
                "total_quantity_sold": int(total_quantity),
                "best_products": best_products,
                "worst_products": worst_products
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== ADDITIONAL APIs ====================

@app.route('/api/revenue-trend', methods=['GET'])
def get_revenue_trend():
    """API để lấy xu hướng doanh thu theo tháng"""
    try:
        customers, orders, products = load_data()
        
        orders_with_price = orders.merge(products[['product_id', 'price']], on='product_id')
        orders_with_price['total_price'] = orders_with_price['quantity'] * orders_with_price['price']
        orders_with_price['order_date'] = pd.to_datetime(orders_with_price['order_date'])
        orders_with_price['year_month'] = orders_with_price['order_date'].dt.to_period('M').astype(str)
        
        monthly_revenue = orders_with_price.groupby('year_month')['total_price'].sum().reset_index()
        monthly_revenue.columns = ['month', 'revenue']
        
        return jsonify({
            "success": True,
            "data": monthly_revenue.to_dict('records')
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test_api():
    """Test API để kiểm tra kết nối"""
    return jsonify({
        "success": True,
        "message": "API is working!",
        "timestamp": datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    print("🚀 Starting Sales Report API Server...")
    print("📊 Dashboard available at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)