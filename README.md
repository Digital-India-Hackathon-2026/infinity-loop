# Farmer2Gov 🌱
> **From Pre-Harvest Registration to Transparent Government Procurement.**

Farmer2Gov is an AI-powered, multilingual Digital Public Infrastructure (DPI) web application built to streamline grain and crop procurement coordinates between farmers and government agencies. It digitizes the procurement journey starting from crop pre-registration, quality verification via computer vision, slot booking coordinates, and direct benefit transfer (DBT) payments.

---

## 🏛️ Project Architecture

The workspace is organized into a modular, decoupled architecture:

```
Farmer2Gov/
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI routes, schemas, controllers
│   │   ├── database.py    # Database connection with PostgreSQL-to-SQLite fallback
│   │   ├── models.py      # SQLAlchemy Models (14 Tables)
│   │   ├── schemas.py     # Pydantic data schemas
│   │   ├── auth.py        # JWT & Direct Bcrypt OTP verification
│   │   └── ai.py          # OpenCV crop quality analyzer
│   ├── requirements.txt   # Python packages
│   └── seed.py            # Autoseeding script (100 Farmers, 20 Officers)
├── frontend/
│   ├── src/
│   │   ├── contexts/      # Language & Auth contexts
│   │   ├── components/    # Route Guards
│   │   ├── pages/         # Landing page & User Role Dashboards
│   │   ├── App.tsx        # React Router routes
│   │   └── index.css      # Core styles & custom animations
│   ├── tailwind.config.js # Styling configurations
│   └── index.html         # Portal meta sheets
└── README.md
```

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **PostgreSQL 17** (Optional, falls back to SQLite automatically if database is not configured)

---

### 2. Backend Setup
1. Create a Python virtual environment and activate it:
   ```bash
   python -m venv backend/venv
   # Windows:
   .\backend\venv\Scripts\activate
   # Linux/macOS:
   source backend/venv/bin/activate
   ```
2. Install the backend requirements:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Run the database seeding script to populate metrics and test users:
   ```bash
   python backend/seed.py
   ```
4. Spin up the FastAPI server:
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```
   *The API will be available at [http://localhost:8000](http://localhost:8000). Interactive Swagger documentation can be viewed at [http://localhost:8000/docs](http://localhost:8000/docs).*

---

### 3. Frontend Setup
1. Go to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The app will launch at [http://localhost:5173](http://localhost:5173).*

---

## 🔑 Demo Access Credentials

The database seeder pre-loads multiple test roles with preset configurations:

| Role | Username / Phone | Password / OTP | Notes |
| :--- | :--- | :--- | :--- |
| **Farmer** | Any 10-digit number (e.g., `9812345678`) | `123456` or SMS log | Creates profile on the fly, allows camera scan and booking |
| **Procurement Officer** | `officer_1@farmer2gov.gov.in` | `officer123` | Assigned to Warangal centre, manages weigh-ins and approvals |
| **Administrator** | `admin@farmer2gov.gov.in` | `admin123` | View Recharts dashboards and forecast metrics |

---

## 🛠️ Key Technical Features

1. **Multilingual Voice Assistant:** Supports voice commands in **English, Telugu (తెలుగు), and Hindi (हिंदी)**. Clicking the microphone interprets spoken questions (e.g. *"నా డబ్బులు వచ్చాయా?"* / *"Has my payment arrived?"*) and speaks the status reply aloud using the Web Speech API.
2. **OpenCV AI Pre-Assessment:** The backend contains a computer vision service that processes uploaded crop photos using HSV saturation mapping, contrast analysis, and Canny edge detection. It generates moisture, grain uniformity, and impurity estimations dynamically.
3. **Interactive Maps:** Renders Leaflet Maps mapping the coordinates of farmer produce coordinates and public procurement centres side-by-side.
4. **Interactive Recharts Analytics:** Visualizes line charts of registrations, crop pie distributions, and forecast curves estimating incoming harvest weights.
5. **Printable Receipts:** The Officer weigh-in generates digital invoice receipts styled like government coordinate sheets, ready to be printed straight from the browser.
