import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TripProvider } from "./context/TripContext";
import { MemberAuthProvider } from "./context/MemberAuthContext";
import { AppHeader } from "./components/layout/AppHeader";
import { DesktopSidebar } from "./components/layout/DesktopSidebar";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { ToastContainer } from "./components/common/Toast";
import { MemberLoginModal } from "./components/auth/MemberLoginModal";
import { EditProfileModal } from "./components/auth/EditProfileModal";

import { DashboardPage } from "./pages/DashboardPage";
import { MembersPage } from "./pages/MembersPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { ChecklistPage } from "./pages/ChecklistPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <TripProvider>
        <MemberAuthProvider>
          <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
            {/* Top Navigation Bar */}
            <AppHeader />

            <div className="flex-1 flex max-w-7xl w-full mx-auto">
              {/* Desktop Left Sidebar */}
              <DesktopSidebar />

              {/* Main Content Area */}
              <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/members" element={<MembersPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/checklist" element={<ChecklistPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />

            {/* Floating Toast Notification Container */}
            <ToastContainer />

            {/* Member Login Modal */}
            <MemberLoginModal />

            {/* Edit Profile Modal */}
            <EditProfileModal />
          </div>
        </MemberAuthProvider>
      </TripProvider>
    </BrowserRouter>
  );
};

export default App;
