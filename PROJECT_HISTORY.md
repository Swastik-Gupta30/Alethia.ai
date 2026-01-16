# Project History & Changelog

This document tracks all changes, feature implementations, and architectural decisions made throughout the development of the Financial Intelligence Platform.

## [2026-01-16] Docker Containerization & ML Pipeline Integration

### Summary
Complete Docker setup for all services (Frontend, Backend, ML, Database) with optimizations for image size and local development workflow. Fixed database connection issues and removed authentication barriers for streamlined local development.

### 1. Docker Infrastructure Setup
- **Created `.env` file**: Centralized environment variable configuration for all services (ports, database credentials, JWT secrets, CORS settings).
- **ML Container (`ML/Dockerfile`)**:
  - Base image: `python:3.10-slim`
  - Installed system dependencies: `build-essential`
  - **Optimization**: Explicitly installed CPU-only PyTorch (`torch --index-url https://download.pytorch.org/whl/cpu`) to reduce image size from ~800MB to ~150-200MB
  - Removed `torch` from `requirements.txt` to prevent conflicts with manual installation
  - Removed `transformers[torch]` extra to avoid triggering GPU PyTorch downloads
  - Container runs in background with `tail -f /dev/null` for script execution on demand
- **Docker Compose (`docker-compose.yml`)**:
  - Added `ml` service with volume mounts for live code updates
  - Configured all services on `turing_network` bridge network
  - Set up port mappings: Frontend (3001), Backend (8000), MongoDB (27017)

### 2. Database Configuration Fixes
- **Fixed `backend/src/constants.js`**: Changed `DB_NAME` from `"Alethia AI"` (invalid - contains space) to `"turing_pg"`
- **Fixed `backend/src/db/index.js`**: Removed manual `/DB_NAME` concatenation that was causing malformed URIs. Now uses `MONGODB_URI` directly from environment variables.
- **Removed MongoDB Authentication**: Stripped `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` from `docker-compose.yml` for simplified local development (no-auth setup)
- **Updated Connection String**: Changed from `mongodb://admin:secret@mongodb:27017/turing_pg?authSource=admin` to `mongodb://mongodb:27017/turing_pg`

### 3. Build Optimizations
- **Image Size Reduction**: ML Docker image reduced from ~3GB to ~500MB through CPU-only PyTorch
- **Layer Caching**: Used `--no-cache-dir` and `--prefer-binary` flags for faster, smaller builds
- **Volume Cleanup**: Implemented `docker compose down -v` workflow to force clean database initialization

### 4. Issues Resolved
- **Invalid Database Name Error**: Fixed hardcoded `"Alethia AI"` string containing space character
- **Double Database Name Appending**: Corrected connection logic that was concatenating DB name twice
- **Authentication Failures**: Removed MongoDB root user authentication requirement for local dev
- **WSL/Docker Daemon Crashes**: Cleaned up corrupted volumes and stale image references
- **Build Cache Bloat**: Freed ~19GB disk space through aggressive pruning of Docker build cache

### 5. Current Architecture
```
turing_pg_project/
├── frontend/          → Nginx (port 3001)
├── backend/           → Node.js Express API (port 8000)
├── ML/                → Python ML container (CPU-optimized)
└── mongodb_data/      → MongoDB volume (no-auth)
```

**All containers successfully running and connected.** Frontend accessible at `http://localhost:3001`, Backend API at `http://localhost:8000`.

---

## [2026-01-15] Frontend Architecture & Core Features Implementation

### Summary
Initial setup of the frontend application, including project structure, routing, authentication infrastructure, and core role-based dashboards.

### 1. Infrastructure & Dependencies
- **Dependencies Installed**:
  - `react-router-dom`: For client-side routing.
  - `lucide-react`: For UI icons.
  - `clsx`, `tailwind-merge`: For dynamic class name management.
  - `tailwindcss`: configured via Vite plugin.
- **Project Structure Created**:
  - `src/components`: Reusable UI components.
  - `src/pages`: Top-level page components.
  - `src/pages/dashboard`: Role-specific dashboard views.
  - `src/context`: State management (Auth).
  - `src/layouts`: Layout wrappers.
  - `src/lib`: Utility functions.

### 2. Core Components Implemented
- **Navbar (`src/components/Navbar.jsx`)**: Responsive navigation bar with handling for unauthenticated and authenticated states (Startup vs Investor functionality).
- **Layout (`src/layouts/Layout.jsx`)**: Main application wrapper ensuring consistent structure.
- **ProtectedRoute (`src/components/ProtectedRoute.jsx`)**: Higher-order component to separate public routes from protected routes and enforce role-based access control (Startup vs Investor).
- **AuthContext (`src/context/AuthContext.jsx`)**: Context provider managing user session state (login, signup, logout) using `localStorage` for simplified persistence during development.
- **Utils (`src/lib/utils.js`)**: `cn` utility for Tailwind class merging.

### 3. Feature: Authentication
- **Login Page (`src/pages/LoginPage.jsx`)**: User login interface.
- **Signup Page (`src/pages/SignupPage.jsx`)**: Registration interface allowing users to self-select their role (Startup or Investor).

### 4. Feature: Landing Page
- **Landing Page (`src/pages/LandingPage.jsx`)**: Public-facing marketing page explaining the platform's value proposition ("Financial intelligence that tells you when insights can’t be trusted"). Includes "Hero", "Problem Snapshot", "How It Works", and "Who Is It For" sections.

### 5. Feature: Dashboards
- **Startup Dashboard (`src/pages/dashboard/StartupDashboard.jsx`)**:
  - Displays reliability score and submission stats.
  - UI for uploading financial data.
- **Investor Dashboard (`src/pages/dashboard/InvestorDashboard.jsx`)**:
  - Displays market overview with mock companies.
  - Features specific "Trust/Reliability" indicators and regime-shift alerts.

### 6. Routing Configuration
- **App Router (`src/App.jsx`)**: Configured all routes:
  - Public: `/`, `/login`, `/signup`.
  - Protected (Startup): `/dashboard/startup`.
  - Protected (Investor): `/dashboard/investor`.

### 7. UX Improvements
- **Navigation**: Added "Back to Home" buttons to `LoginPage` and `SignupPage` to improve user flow from auth screens back to the landing page.

### 8. UI/UX Redesign - Dark Theme
- **Landing Page Refinement**: Completely redesigned `LandingPage.jsx` with a premium dark theme.
  - Implemented `bg-gray-950` base with custom background gradients.
  - Added glassmorphism effects to cards and sections.
  - Enhanced typography with gradients (`bg-clip-text`) and improved contrast.
  - Modernized "How It Works" and "Who Is It For" sections with hover effects and icons.
- **Navbar Integration**: Updated `Navbar.jsx` to be transparent on the landing page and solid on other pages. Added scroll detection to apply a "frosted glass" effect (`backdrop-blur`) when scrolling down the landing page.
- **Global Dark Theme**: Rolled out the dark theme (`bg-gray-950`) to the entire application.
  - Updated `Layout.jsx` to force dark background globally.
  - Redesigned `LoginPage.jsx` and `SignupPage.jsx` with dark backgrounds, dark input fields, and light text.
  - Themed `StartupDashboard.jsx` and `InvestorDashboard.jsx` with dark cards (`bg-gray-900`), border accents (`border-white/5`), and high-contrast text.

## [2026-01-16] ML Integration & Docker Containerization

### Summary
Integrated the complete Machine Learning pipeline with synthetic data generation and fully containerized the application using Docker for consistent deployment.

### 1. ML Pipeline Architecture
- **New `ML` Core**: Implemented a comprehensive machine learning module in the root `ML/` directory.
- **Data Infrastructure**:
  - `generate_data.py`: Script to generate synthetic financial market data.
  - `market_data.csv`: Initial synthetic dataset.
  - `narratives.json`: Synthetic narrative data for qualitative analysis.
- **Model Components**:
  - `src/models/pipeline.py`: Core ML pipeline logic.
  - `src/models/encoders.py`: Data encoders.
  - `src/data/datamodule.py`: PyTorch Lightning data module for efficient data loading.
  - `src/utils/loss.py`: Custom loss functions.
- **Operations**:
  - `train.py`: Training script for the model.
  - `inference.py`: Inference script for generating predictions.

### 2. DevOps & Infrastructure
- **Docker Implementation**:
  - **Orchestration**: Created `docker-compose.yml` to define and run multi-container applications (Frontend + Backend).
  - **Backend**: Added `Dockerfile` and `.dockerignore` for the Node.js backend.
  - **Frontend**: Added `Dockerfile` and `.dockerignore` for the Vite/React frontend.
- **Configuration**: Updated `backend/src/app.js` to handle environment configuration within the Docker container.
