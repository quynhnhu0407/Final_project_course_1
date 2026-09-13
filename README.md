# 📊 Sales Report Dashboard

A comprehensive sales analytics dashboard with advanced filtering, built with Flask backend and interactive Chart.js visualizations.

![Dashboard Preview](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.1.3-green)

## 🎯 Features

### 📈 Executive Overview
- Total Revenue tracking with filters
- Total Orders count
- Customer base size
- Average Order Value (AOV)
- Revenue Growth percentage (YoY)
- Interactive charts with Year/Month views
- **Filters**: Year, Start Date, End Date

### 👥 Customer Analysis
- New vs Returning customer segmentation
- Top 10 customers by revenue
- Purchase frequency distribution (with custom names)
- Loyalty member analysis with donut chart
- Age group segmentation
- **Filters**: Loyalty Member (Yes/No), City, Age Group

### 🛍️ Product Performance
- Top 10 best-selling products
- Revenue breakdown by category
- Total quantity sold
- Best and worst performing products
- **Filters**: Category, Price Range (Min/Max)

### 🎨 Enhanced Visualizations
- Bar charts with percentage (%) display
- Color-coded loyalty indicators (Navy/Red)
- Responsive design for all screen sizes
- Smooth animations and transitions

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
Open browser: `http://localhost:5000`

## 🌐 Share Online with Ngrok

### Quick Method (Recommended)
```bash
# Double-click:
start_with_ngrok.bat

# Follow the prompts to update URL automatically
```

### Manual Method
```bash
# Terminal 1: Flask
python API.py

# Terminal 2: Ngrok
ngrok http 5000

# Copy the Forwarding URL (https://xxxx.ngrok-free.app)
# Update API_BASE in report.js
```

### Ngrok Setup (First Time Only)
1. Download: https://ngrok.com/download
2. Sign up: https://dashboard.ngrok.com/signup
3. Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
4. Configure:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## 🔍 Filters Guide

### Executive Overview Filters
| Filter | Type | Description |
|--------|------|-------------|
| Year | Dropdown | Filter by specific year (2023, 2024) |
| Start Date | Date Picker | Filter from date |
| End Date | Date Picker | Filter to date |

### Customer Analysis Filters
| Filter | Type | Description |
|--------|------|-------------|
| Loyalty Member | Dropdown | Yes/No |
| City | Dropdown | Filter by customer city |
| Age Group | Dropdown | 18-25, 26-35, 36-50, 50+ |

### Product Performance Filters
| Filter | Type | Description |
|--------|------|-------------|
| Category | Dropdown | Electronics, Clothing, Home & Garden |
| Price Min | Number Input | Minimum price |
| Price Max | Number Input | Maximum price |

**Note**: All filters can be combined and have a "Reset Filters" button.

## 🎨 Purchase Frequency Names

The dashboard uses descriptive names for purchase frequency:
- **1 purchase** → "One-time Buyers"
- **2 purchases** → "Occasional Shoppers"
- **3 purchases** → "Regular Customers"
- **4 purchases** → "Frequent Buyers"
- **5 purchases** → "Loyal Patrons"
- **6+ purchases** → "VIP Customers", "Elite Members", etc.

## 📁 Project Structure

```
Final_project_course_1/
├── dataset/              # CSV data files
│   ├── customers.csv     # Customer information
│   ├── orders.csv        # Order transactions
│   └── products.csv      # Product catalog
├── API.py               # Flask backend with filters
├── report.html          # Dashboard frontend
├── report.js            # JavaScript with filter logic
├── requirements.txt     # Python dependencies
├── start_with_ngrok.bat # Auto-start script for ngrok
├── push_to_github.bat   # Git push automation
├── NGROK_GUIDE.md       # Detailed ngrok documentation
└── README.md           # This file
```

## 🔌 API Endpoints

| Endpoint | Method | Query Parameters | Description |
|----------|--------|------------------|-------------|
| `/` | GET | - | Serve dashboard HTML |
| `/api/executive-overview` | GET | `year`, `start_date`, `end_date` | Executive metrics |
| `/api/customer-analysis` | GET | `loyalty_member`, `city`, `age_group` | Customer data |
| `/api/product-performance` | GET | `category`, `price_min`, `price_max` | Product data |
| `/api/revenue-trend` | GET | - | Monthly revenue |

### Example API Calls
```bash
# Filter executive by year
GET /api/executive-overview?year=2024

# Filter customers by city and loyalty
GET /api/customer-analysis?city=New%20York&loyalty_member=Yes

# Filter products by category and price
GET /api/product-performance?category=Electronics&price_min=100&price_max=500
```

## 🛠️ Technology Stack

- **Backend**: Flask 3.1.3
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js with chartjs-plugin-datalabels
- **Data Processing**: Pandas 3.0.5
- **CORS**: Flask-CORS 6.0.5
- **Date Handling**: Python datetime

## 📊 Data Schema

### customers.csv
```
customer_id, gender, age, city, signup_date, loyalty_member
```

### orders.csv
```
order_id, customer_id, product_id, order_date, quantity, payment_method
```

### products.csv
```
product_id, product_name, category, price
```

## 🎨 Design System

### Color Palette
- **Primary Navy**: #1e3c72 (Main theme, buttons)
- **Light Navy**: #2a5298 (Gradients, accents)
- **Risk Red**: #d32f2f (Warning indicators)
- **Success Green**: #4caf50 (Positive metrics)
- **Gray Backgrounds**: #e9ecef, #f8f9fa

### Typography
- **Font**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Metric Values**: 3em, bold
- **Headers**: 1.5em - 2.5em
- **Body/Filters**: 0.85em - 1.1em

## 🚀 Deployment Options

### Local Development
```bash
python API.py
# Access at http://localhost:5000
```

### Share via Ngrok (Fastest)
```bash
start_with_ngrok.bat
# Get public URL in ~30 seconds
```

### Deploy to Cloud (Production)
See `GITHUB_DEPLOY.md` for deploying to:
- PythonAnywhere (Free, recommended)
- Render
- Railway
- Heroku

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

## 📝 License

MIT License - feel free to use for learning and projects.

## 👤 Author

**Pham Thi Quynh Nhu**
- GitHub: [@quynhnhu0407](https://github.com/quynhnhu0407)
- Project: [Final_project_course_1](https://github.com/quynhnhu0407/Final_project_course_1)

## 🙏 Acknowledgments

- MindX Technology School
- Flask & Chart.js Communities
- Ngrok for tunneling solution

---

**Current Ngrok URL**: https://utensil-elite-cornstalk.ngrok-free.dev/

*Note: Ngrok URL changes on each restart (free plan)*
