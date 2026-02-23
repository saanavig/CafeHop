import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Coffee, Store } from "lucide-react";

import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Rewards from "./pages/Rewards";
import History from "./pages/History";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import CafeDashboard from "./pages/CafeDashboard";

import Notifications from "./pages/Notifications";
import PaymentMethods from "./pages/PaymentMethods";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Preferences from "./pages/Preferences";

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import Onboarding from "./pages/OnboardingRole";
import OnboardingRole from "./pages/OnboardingRole";
import CustomerOnboarding from "./pages/CustomerOnboarding";
import CafeOnboarding from "./pages/CafeOnboarding";

import { ModeProvider } from "./context/Mode";

const queryClient = new QueryClient();

const App = () => {
  const [role, setRole] = useState<"customer" | "cafe">("customer");

  return (
    <QueryClientProvider client={queryClient}>
      <ModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          {/* Demo role toggle (for UI switching) */}
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setRole(role === "customer" ? "cafe" : "customer")}
              className="p-2 rounded-full bg-caramel text-white shadow-md flex items-center justify-center"
              title={`Switch to ${role === "customer" ? "Cafe" : "Customer"} view`}
            >
              {role === "customer" ? <Coffee className="h-5 w-5" /> : <Store className="h-5 w-5" />}
            </button>
          </div>

          <BrowserRouter>
            <Routes>
              {/* 🌱 Public */}
              <Route path="/splash" element={<Splash />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* 🚀 Onboarding */}
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/onboarding/role" element={<OnboardingRole />} />
              <Route path="/onboarding/customer" element={<CustomerOnboarding />} />
              <Route path="/onboarding/cafe" element={<CafeOnboarding />} />

              {/* ☕ Main App */}
              <Route path="/" element={<Index role={role} />} />
              <Route path="/explore" element={<Explore role={role} />} />
              <Route path="/rewards" element={<Rewards role={role} />} />
              <Route path="/history" element={<History role={role} />} />
              <Route path="/account" element={<Account role={role} />} />
              <Route path="/preferences" element={<Preferences role={role} />} />
              <Route path="/profile" element={<Profile role={role} />} />
              <Route path="/cafedashboard" element={<CafeDashboard />} />

              {/* Account sub-pages */}
              <Route path="/notifications" element={<Notifications role={role} />} />
              <Route path="/payments" element={<PaymentMethods role={role} />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/settings" element={<Settings role={role} />} />
              <Route path="/help" element={<Help role={role} />} />

              {/* Redirect root users to splash (optional) */}
              <Route path="/home" element={<Navigate to="/" replace />} />

              {/* ❌ Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ModeProvider>
    </QueryClientProvider>
  );
};

export default App;
