# Project History & Changelog

This document tracks all changes, feature implementations, and architectural decisions made throughout the development of the Financial Intelligence Platform.

## [2026-01-22] Production ML Integration & Resilience

### Summary
Exposed ML inference as a clean, production-grade API and fully integrated it with the MERN stack. The new architecture ensures 24/7 reliability through self-healing mechanisms, background model loading, and graceful error handling.

### 1. Microservices Architecture
- **ML Service (`ML/src/api.py`)**: Replaced basic inference scripts with a robust FastAPI implementation.
    - **Features**: Background model loading, feature padding for shape synchronization, and 503 "Service Unavailable" handling to prevent blocking.
- **Backend (`intelligenceController.js`)**: Implemented the **Internal Service Abstraction** pattern. The Backend proxies requests to the ML service (`http://ml:8001`), using a 30-attempt retry mechanism to bridge the gap during ML cold starts. It also implements a MongoDB-based caching layer for fallback.
- **Frontend (`InvestorDashboard.jsx`)**: Updated UI to handle "Model Initializing" states gracefully without crashing, offering auto-refresh capabilities.

### 2. Docker & Networking
- **Internal API**: The ML service is configured as an internal node on `turing_network`, inaccessible to the public internet, satisfying security best practices.
- **Volume Management**: Configured persistence for `mlruns` to ensure model checkpoints survive container restarts.

### 3. Verification
- **Integration Tests**: Confirmed end-to-end data flow: `Frontend -> Backend Proxy -> ML Service (Inference)`.
- **Self-Healing**: Triggered feature mismatches and verified that the system automatically sliced/padded inputs to prevent crashes.

---

## [2026-01-21] ML Pipeline Robustness & Dynamic Data Synchronization

### Summary
Enhanced the ML service to handle dynamic dataset changes and resolved critical model-loading issues. Implemented a self-healing data pipeline that synchronizes feature dimensions between training and inference automatically.

### 1. Multimodal Dataset Architecture
- **Dataset Composition**: The system utilizes a multimodal approach combining three distinct data streams:
  - **Temporal Branch**: Sequential market data (OHLCV + Technical Indicators: RSI, MACD, ATR, EMA_20) processed in 5-day sliding windows.
  - **Tabular Branch**: High-dimensional snapshot features including sector identifiers and financial ratios (P/E Ratio, Debt/Equity, Quick Ratio, Market Cap).
  - **Textual Branch**: Sentiment and narrative analysis from `narratives.json` processed via FinBERT.
- **Dynamic Feature Extraction**: Implemented logic to automatically determine the `tabular_dim` based on available columns in `market_data.csv`. This allows for adding or removing indicators in the CSV without manually updating model hyperparameters.
- **Normalization**: Standardized raw data using Z-score normalization (Mean/Std) calculated across the entire dataset to ensure stable training.

### 2. Operational Stability & Self-Healing
- **Robust Loading (`api.py`)**: Developed a shape-filtering logic for `load_state_dict`. The system now compares the checkpoint's parameter shapes against the active model architecture, discarding mismatches with a warning instead of a `RuntimeError`.
- **Auto-Reset Checkpoints**: Added logic to verify version compatibility. If the input dimensions have changed significantly since the last training session, the system automatically purges the old `mlruns/` directory and triggers a fresh training job.
- **Background Retraining**: Configured the FastAPI lifespan to trigger training as a non-blocking background process (`subprocess.Popen`). This ensures the API remains available (returning a 503 "Model not loaded" or similar) rather than crashing the entire container.

### 3. Verification & Sync
- **Unified Logic**: Synchronized the exclusion lists across `train.py`, `api.py`, and `datamodule.py` to ensure identical feature mapping between training and production inference.
- **Local MongoDB Migration**: Finalized the switch to a local containerized MongoDB for consistent local development, resolving connectivity issues with cloud-based Atlas clusters.

---

## [2026-01-19] Agentic RAG Chatbot & Full Stack Integration

### Summary
Developed and integrated an autonomous "Agentic RAG" chatbot service capable of intelligent financial analysis. The system routes user queries to specialized tools for data comparison, consistency checks, and document retrieval. Fully integrated into the MERN stack with a secure backend proxy and a floating UI widget.

### 1. AI Microservice (`llm/`)
- **LangGraph Agent**: Implemented a stateful graph-based agent in `llm/src/agent.py` with specific nodes for Routing, Tool Execution, and Response Generation.
- **Custom Tools (`llm/src/tools.py`)**:
  - `FinancialComparatorTool`: Uses Pandas DataFrame Agent to compare metrics between tickers.
  - `DiagnosticTool`: Checks for alignment inconsistencies between financial growth and narrative sentiment.
  - `DocumentRAGTool`: Vector search over `narratives.json` using FAISS.
- **API**: Exposed the agent via FastAPI on port 8002 (`llm/src/api.py`).

### 2. Full Stack Integration
- **Backend Proxy (`backend/`)**:
  - Implemented `chat.routes.js` to securely proxy requests from the frontend to the Python AI service.
  - Used Docker networking (`host.docker.internal`) to bridge communication between the Node container and the host-based Python service.
- **Frontend Chatbot (`frontend/`)**:
  - Created `Chatbot.jsx`: A floating action widget with a chat interface.
  - **Auth Integration**: Widget only appears for logged-in users.
  - **State Management**: Handles loading states, message history (User/Bot), and auto-scrolling.

### 3. Stability & Hardening
- **Strict Context Enforcement**: Configured system prompts to strictly refuse general knowledge questions (e.g., about celebrities) and focus solely on financial data.
- **Infrastructure Fixes**:
  - Resolved port conflict (Moved Python service from 8000 to 8002).
  - Fixed `.env` loading issues by explicitly resolving the project root path.
  - Fixed `UnicodeDecodeError` in environment files.

---
## [2026-01-18] Full Stack ML Integration & Docker Orchestration

### Summary
Connected the Python machine learning service to the MERN stack application, establishing a complete data pipeline from raw synthetic data to the frontend dashboard. Containerized the entire solution with Docker Compose and fixed production routing issues.

### 1. Python ML Service (`ml/`)
- **API Implementation**: Created `ml/src/api.py`, a FastAPI server that loads `market_data.csv` and `narratives.json` into memory on startup.
- **Data Endpoint**: Implemented `GET /predict/{ticker}` to serve reliability scores and narrative analysis.
- **Containerization**: Updated `ml/Dockerfile` to run the FastAPI server using `uvicorn` on port 8001.

### 2. Backend Bridge (`backend/`)
- **Intelligence Controller**: Created `intelligenceController.js` to act as a proxy between the Frontend and the ML service.
- **Internal Networking**: Configured the backend to communicate with the ML container via the internal Docker network (`http://ml:8001`).
- **Dependencies**: Added `axios` for internal service-to-service communication.

### 3. Frontend Intelligence Features (`frontend/`)
- **Investor Dashboard**: Updated with real ticker symbols (ALPHA, BETA, GAMMA, etc.) linking to detailed reports.
- **Company Details Page**: Created a new "Deep Dive" page (`CompanyDetails.jsx`) featuring:
  - **Reliability Score**: Visualized with a circular progress indicator.
  - **Narrative Analysis**: Displaying the AI-generated textual analysis.
  - **Consistency Alerts**: UI warning cards triggered when narrative sentiment mismatches market data.
- **Routing Fix**: Implemented `nginx.conf` with `try_files` directive to resolve 404 errors on deep links (`/company/:ticker`) in the Dockerized environment.

### 4. Docker Orchestraion
- **Unified Stack**: Updated `docker-compose.yml` to spin up all services (Frontend, Backend, ML, MongoDB) with a single `docker compose up --build` command.
- **Verification**: Verified data flow by modifying `narratives.json` and observing changes on the frontend, confirming the end-to-end pipeline.

---

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

---

## [2026-01-17] Authentication System Integration & Deployment Hardening

### Summary
Fully integrated the backend JWT authentication with the React frontend, implemented role-based access control, secured the application with proper CORS configuration, and migrated the database to MongoDB Atlas for cloud persistence.

### 1. Frontend Authentication Implementation
- **Centralized API Client (`src/lib/axios.js`)**:
  - Implemented automatic token injection (`Authorization: Bearer ...`).
  - Added smart response interceptors to handle `401 Unauthorized` errors by automatically refreshing the access token via HttpOnly cookies and retrying the failed request.
- **Global Auth Store (`src/context/AuthContext.jsx`)**:
  - Replaced mock auth with real API integration for Login, Signup, and Logout.
  - Implemented session restoration on page reload by verifying the refresh token.
  - Added JWT decoding to extract user roles (`founder` vs `investor`) and metadata.
- **Route Protection**:
  - **Public Routes (`src/components/PublicRoute.jsx`)**: New wrapper to redirect authenticated users away from Login/Signup pages.
  - **Protected Routes**: Enhanced to handle role-based redirection (Founders -> Startup Dashboard, Investors -> Investor Dashboard).

### 2. UI/UX Enhancements
- **Real-Time Feedback**: Updated `LoginPage` and `SignupPage` to display actual backend error messages.
- **Role & Data Mapping**:
  - Mapped frontend roles ("Startup", "Investor") to backend enums ("founder", "investor").
  - Added conditional "Company Name" field for Founders during signup.
  - Updated Navbar to display the authenticated user's real username.

### 3. Backend & DevOps Improvements
- **CORS Configuration**:
  - Fixed `backend/src/app.js` to explicitly allow credentials from Docker frontend (`http://localhost:3001`) and Vite dev server (`http://localhost:5173`).
- **Database Migration**:
  - Transitioned from ephemeral local Docker MongoDB to **MongoDB Atlas**.
  - Updated `docker-compose.yml` to respect `MONGODB_URI` from `.env`.
  - Configured environment variables to point to the production-grade cloud database `turing_pg`.

### 4. Feature: Google OAuth2 Integration
- **Backend Implementation**:
  - Updated `User` model to support optional passwords and store `googleId`.
  - Added `googleAuth` controller to verify Google ID Tokens using `google-auth-library`.
  - Implemented logic to automatically create new accounts or link existing ones based on email.
- **Frontend Integration**:
  - Configured `GoogleOAuthProvider` with `VITE_GOOGLE_CLIENT_ID`.
  - Updated `LoginPage` and `SignupPage` with "Sign in with Google" buttons using `@react-oauth/google`.
  - Integrated Google login flow into `AuthContext` to handle token storage and redirection.
- **Infrastructure**:
  - Injected `GOOGLE_CLIENT_ID` into both frontend (via build args) and backend (via runtime env) containers.
