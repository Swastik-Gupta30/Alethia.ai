import { Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProtectedRoute from "./components/ProtectedRoute";
import StartupDashboard from "./pages/dashboard/StartupDashboard";
import InvestorDashboard from "./pages/dashboard/InvestorDashboard";
import CompanyDetails from "./pages/CompanyDetails";

import PublicRoute from "./components/PublicRoute";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Protected Startup Routes */}
        <Route element={<ProtectedRoute allowedRoles={["founder"]} />}>
          <Route path="/dashboard/startup" element={<StartupDashboard />} />
        </Route>

        {/* Protected Investor Routes */}
        <Route element={<ProtectedRoute allowedRoles={["investor"]} />}>
          <Route path="/dashboard/investor" element={<InvestorDashboard />} />
          <Route path="/company/:ticker" element={<CompanyDetails />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
