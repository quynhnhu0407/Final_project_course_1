# 📊 Sales Report Dashboard

A comprehensive sales analytics dashboard built with Flask backend and interactive Chart.js visualizations.

![Dashboard Preview](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.1.3-green)

## 🎯 Features

### 📈 Executive Overview
- Total Revenue tracking
- Total Orders count
- Customer base size
- Average Order Value (AOV)
- Revenue Growth percentage
- Interactive Year/Month revenue charts with filter

### 👥 Customer Analysis
- New vs Returning customer segmentation
- Top 10 customers by revenue
- Purchase frequency distribution
- Loyalty member analysis with donut chart
- Age group segmentation

### 🛍️ Product Performance
- Top 10 best-selling products
- Revenue breakdown by category
- Total quantity sold
- Best and worst performing products comparison

## 🖼️ Screenshots

### Executive Overview
Dashboard showing key metrics and revenue trends with interactive filters.

### Customer Loyalty
Donut chart visualization with color-coded risk indicators:
- 🔵 Navy Blue (Yes) - Loyal customers
- 🔴 Red (No) - At-risk customers requiring attention

## 🚀 Quick Start

### Prerequisites
```bash
Python 3.10+
pip (Python package manager)
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/quynhnhu0407/Final_project_course_1.git
cd Final_project_course_1
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run the application**
```bash
python API.py
```

4. **Access the dashboard**
Open your browser and navigate to: `http://localhost:5000`

## 📁 Project Structure

```
Final_project_course_1/
├── dataset/              # CSV data files
│   ├── customers.csv
│   ├── orders.csv
│   └── products.csv
├── API.py               # Flask backend server
├── report.html          # Dashboard frontend
├── report.js            # JavaScript logic
├── requirements.txt     # Python dependencies
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve dashboard HTML |
| `/api/executive-overview` | GET | Executive metrics and revenue data |
| `/api/customer-analysis` | GET | Customer segmentation and analysis |
| `/api/product-performance` | GET | Product sales performance |
| `/api/revenue-trend` | GET | Monthly revenue trend data |

## 🎨 Design System

### Color Palette
- **Primary Navy**: #1e3c72 (Main theme, buttons, headers)
- **Light Navy**: #2a5298 (Gradients, secondary elements)
- **Risk Red**: #d32f2f (Warning indicators)
- **Gray**: #e9ecef (Inactive states)

### Typography
- **Font Family**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Metric Values**: 3em, bold
- **Headers**: 1.5em - 2.5em
- **Body Text**: 1em - 1.1em

## 🛠️ Technology Stack

- **Backend**: Flask 3.1.3
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Data Processing**: Pandas 3.0.5
- **CORS**: Flask-CORS 6.0.5

## 📊 Data Schema

### customers.csv
- customer_id, gender, age, city, signup_date, loyalty_member

### orders.csv
- order_id, customer_id, product_id, order_date, quantity, payment_method

### products.csv
- product_id, product_name, category, price

## 🌐 Deployment

### Local Development
```bash
python API.py
# Access at http://localhost:5000
```

### Public Sharing with ngrok
```bash
# Terminal 1: Start Flask
python API.py

# Terminal 2: Start ngrok tunnel
ngrok http 5000
# Share the ngrok URL
```

### Production Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to:
- PythonAnywhere (Free)
- Render
- Heroku

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Pham Thi Quynh Nhu**
- GitHub: [@quynhnhu0407](https://github.com/quynhnhu0407)

## 🙏 Acknowledgments

- MindX Technology School
- Flask Documentation
- Chart.js Community

---

Made with ❤️ for data-driven decision making
