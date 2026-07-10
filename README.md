# Farmer2Gov 🌱
> **A Digital Public Infrastructure (DPI) web application streamlining pre-harvest crop registration, computer vision quality assessment, slot booking, and government procurement for farmers.**

Farmer2Gov bridges the gap between farmers and government agencies. It digitizes the procurement journey, starting from crop registration, automated quality verification via computer vision, slot booking coordinates, and direct benefit transfer (DBT) payments.

---

## 🏛️ Project Architecture

The project has a decoupled architecture, with a FastAPI backend and a React (Vite) + Tailwind CSS frontend.

```text
Farmer2Gov/
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI routes, schemas, and controllers
│   │   ├── database.py    # Database connection with PostgreSQL-to-SQLite fallback
│   │   ├── models.py      # SQLAlchemy database models (14 tables)
│   │   ├── schemas.py     # Pydantic schemas for request/response validation
│   │   ├── auth.py        # JWT auth and bcrypt OTP verification
│   │   └── ai.py          # OpenCV crop quality analyzer (moisture, impurities)
│   ├── requirements.txt   # Python dependencies
│   ├── seed.py            # Autoseeding script (100 Farmers, 20 Officers, 1 Admin)
│   ├── migrate.py         # SQLite migrations (adds custom columns and tables)
│   └── farmer2gov.db      # SQLite database file (created after seeding/migration)
├── frontend/
│   ├── src/
│   │   ├── contexts/      # Auth & Language React contexts
│   │   ├── components/    # Route guards & shared UI components
│   │   ├── pages/         # Landing, Auth, and role-based Dashboards
│   │   ├── App.tsx        # React routes
│   │   └── index.css      # Custom animations & Tailwind configurations
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── package.json       # Frontend dependencies & npm scripts
└── README.md              # Master guide
```

---

## 🚀 Setup & Execution Guide (Step-by-Step)

Follow these steps to set up and run the application on your computer.

### 📋 Prerequisites
Make sure you have the following installed:
1. **Python 3.10+** (Download from [python.org](https://www.python.org/downloads/))
2. **Node.js v18+** (Download from [nodejs.org](https://nodejs.org/))

---

### 🐍 Step 1: Backend Setup

Open a terminal or command prompt and run the following commands:

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   * **Windows:**
     ```powershell
     python -m venv venv
     ```
   * **macOS/Linux:**
     ```bash
     python3 -m venv venv
     ```

3. **Activate the virtual environment:**
   * **Windows (Command Prompt):**
     ```cmd
     venv\Scripts\activate.bat
     ```
   * **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
     *(If you get a script execution policy error, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first, then run the activation script.)*
   * **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Initialize and Seed the Database:**
   This creates the tables and seeds 100 farmers, 20 officers, and 1 admin.
   ```bash
   python seed.py
   ```

6. **Apply SQLite Migrations:**
   Add required additional columns and verification tables to the database.
   ```bash
   python migrate.py
   ```

7. **Start the FastAPI Server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   * The API server will be available at [http://localhost:8000](http://localhost:8000).
   * Interactive API docs (Swagger UI) will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 🎨 Step 2: Frontend Setup

Open a **new** terminal window (keep the backend terminal running) and run the following commands:

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install npm dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm run dev
   ```
   * The application will open in your browser at [http://localhost:5173](http://localhost:5173).

---

## 🔑 Demo Access Credentials

The database seeder pre-loads multiple test roles with preset configurations:

| Role | Username / Phone | Password / OTP | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Farmer** | Any 10-digit number (e.g., `9812345678`, `9876543201`) | `123456` | Register crops, upload photos for AI analysis, book slots, publish marketplace listings, manage customer orders, and view sales charts. |
| **Customer** | `customer@farmer2gov.gov.in` (Password) or `9876543211` (OTP) | `customer123` or `123456` | Browse fresh farm produce, search by categories, apply coupons, add items to cart, checkout, complete simulated payments, download tax invoices, and track orders. |
| **Procurement Officer** | `officer_1@farmer2gov.gov.in` | `officer123` | Inspect crop samples, weigh grains, approve status, and print receipts. |
| **Administrator** | `admin@farmer2gov.gov.in` | `admin123` | View statistics, track state-level metrics, and view forecasts. |

---

## 💡 Demo Walkthrough Journeys

To experience the full capability of the application, follow these user journeys:

### 🌾 Journey 1: The Farmer Flow
1. Open [http://localhost:5173](http://localhost:5173).
2. Choose your preferred language (English, తెలుగు, or हिंदी) on the welcome screen.
3. Log in by entering any 10-digit phone number (e.g., `9812345678`) and entering the OTP `123456`.
4. Go to **"Register New Crop"** and enter details (Crop Name, Quantity, Harvest Month).
5. Click **"AI Crop Quality Check"**: Take a photo or upload a crop sample. The computer vision backend estimates moisture, Impurities, and Uniformity.
6. Once analyzed, click **"Schedule Slot Booking"** to book a coordinate date and time at a nearby Procurement Center.

### 👮 Journey 2: The Procurement Officer Flow
1. Log out of the farmer account and log in using an officer's email (e.g., `officer_1@farmer2gov.gov.in`) and password `officer123`.
2. View the **Center Dashboard** showing upcoming scheduled farmer drop-offs.
3. Select a farmer registration, perform the **Weigh-in & Moisture check**, and mark it as **Approved**.
4. Generate the **Procurement Receipt** and click **Print** to see a print-formatted official receipt layout.

### 📊 Journey 3: The Admin Analytics Flow
1. Log out and log in as the Administrator with `admin@farmer2gov.gov.in` and password `admin123`.
2. Review the **Analytics Dashboard** showcasing crop distribution pie charts, state-wide registration metrics, and interactive timeline forecasts.

### 🏪 Journey 4: The Direct-to-Customer (D2C) Marketplace Flow
1. **Register/Login as a Customer**: Log out and log in using customer credentials (email `customer@farmer2gov.gov.in`, password `customer123`, or phone `9876543211` + OTP `123456`).
2. **Browse the Marketplace**: View the Swiggy/Amazon style dashboard. Search for products, filter by categories (Grains, Pulses, Fruits, Vegetables, Organic), and bookmark items.
3. **Cart Operations**: Add farm-fresh items to your cart, navigate to `/cart`, apply coupon code `F2G50` or `DIWALI100` to get discounts, and click "Proceed to Checkout".
4. **Place Order**: Confirm your shipping coordinates, select a mock payment option (UPI/Card/COD), and click "Pay & Place Order".
5. **View Invoice & Track Order**: Review your printable tax invoice, click "Track Order Live" to view the interactive Leaflet map showing the delivery courier rider's location and shipping checkpoints.
6. **Farmer Fulfillment**: Log in as a Farmer (phone `9876543201`, OTP `123456`), go to the **"Marketplace Portal"** tab, verify the customer order, and change its status from "Pending" to "Confirmed" and then "Shipped".

---

## 🛠️ Troubleshooting & FAQ

* **Q: The backend fails with "ModuleNotFoundError: No module named 'app'"**
  * **A:** Make sure you ran `python seed.py` and `python migrate.py` from inside the `backend` directory (not the root directory). Also, run `uvicorn app.main:app --reload` from inside `backend`.
* **Q: How does the SQLite fallback work?**
  * **A:** The system automatically checks if a PostgreSQL server is running via the `DATABASE_URL` environment variable. If not found, it creates and falls back to a local SQLite database file `backend/farmer2gov.db` without crashing.
* **Q: The crop analyzer says "Failed to analyze image".**
  * **A:** Make sure the upload directories are writable and OpenCV (`opencv-python-headless`) was successfully installed in your virtual environment.

