import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PrivacyCenter } from "./pages/PrivacyCenter";

import { AuthCallback } from "./pages/AuthCallback";
import { Auth } from "./pages/Auth";
import { TermsAndConditions } from "./pages/TermsAndConditions";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminRecordings } from "./pages/admin/AdminRecordings";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminLayout } from "./components/admin/AdminLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy-center" element={<PrivacyCenter />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="recordings" element={<AdminRecordings />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
