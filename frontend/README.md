# Farmer2Gov Frontend 💻
> **A React + TypeScript + Vite web application built with interactive maps, rich charts, and responsive role-based dashboards.**

This directory contains the client-side code of the Farmer2Gov Digital Public Infrastructure (DPI) application. 

---

## 🎨 Tech Stack & Libraries

- **Core**: React 19, TypeScript, and Vite 8
- **Styling**: Tailwind CSS v4 & PostCSS
- **Animations**: Framer Motion
- **Charts & Data Viz**: Recharts (interactive SVGs)
- **Maps**: Leaflet & React-Leaflet
- **Icons**: Lucide React
- **Celebration Effects**: Canvas Confetti

---

## 📁 Directory Structure

```text
frontend/
├── src/
│   ├── assets/        # Static logos, icons, and image assets
│   ├── components/    # Reusable UI controls and Router Guards (e.g. ProtectedRoute.tsx)
│   ├── contexts/      # Auth (session status) and Language (translation) state providers
│   ├── pages/         # Core pages and role-based portals:
│   │   ├── LanguageSelector.tsx # Welcome / initial language screen
│   │   ├── LandingPage.tsx      # Core informational portal
│   │   ├── Login.tsx            # Unified login with password/OTP option
│   │   ├── Register.tsx         # Farmer registration dashboard
│   │   ├── FarmerDashboard.tsx  # Register crops, upload photo, schedule drop-offs
│   │   ├── OfficerDashboard.tsx # Verify weight, record moisture, print receipts
│   │   └── AdminDashboard.tsx   # Visualize state analytics, Recharts curves, forecasts
│   ├── App.tsx        # Application entry routing configuration
│   └── index.css      # Core styles, glassmorphism, transitions, and Tailwind directives
├── tailwind.config.js # Custom theme configurations
├── package.json       # App scripts, versions, and libraries
└── tsconfig.json      # TypeScript specifications
```

---

## 🚀 Setup & Commands

To get the frontend up and running locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run dev
   ```
   *The application will launch on [http://localhost:5173](http://localhost:5173).*

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Lint code:**
   ```bash
   npm run lint
   ```

---

## 🔌 Connecting to the Backend API

By default, the client is configured to connect to the backend running at:
`http://localhost:8000`

If your backend is running on a different port or server, update the following variables:
- `API_BASE` in `src/pages/Login.tsx`
- `API_BASE` in `src/pages/Register.tsx`
- `API_BASE_URL` in `src/contexts/AuthContext.tsx`

