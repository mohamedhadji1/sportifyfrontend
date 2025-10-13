import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { setupGlobalErrorHandling } from './utils/errorHandler';
import ErrorBoundary from './components/ErrorBoundary';
import { HeroSection } from "./features/home/components/HeroSection";
import { FeaturesSection } from "./features/home/components/FeaturesSection";
import { CategoriesSection } from "./features/home/components/CategoriesSection";
import AccountSettingsPage from "./features/profile/components/AccountSettingsPage";
import DashboardPage from "./features/dashboard/components/DashboardPage";
import PasswordResetPage from "./features/auth/components/PasswordResetPage";
import { ProfilePage } from "./features/profile/components/ProfilePage";
import UserManagement from "./features/admin/components/management/UserManagement";
import ManagerManagement from "./features/admin/components/management/ManagerManagement";
import PlayerManagement from "./features/admin/components/management/PlayerManagement";
import ComplaintManagement from "./features/admin/components/management/ComplaintManagement";
import CompanyManagement from "./features/admin/components/company/CompanyManagement";
import BookingManagement from "./pages/CourtManagementDashboard";
import AdminSignInPage from "./features/admin/components/AdminSignInPage";
import { CourtsPage, CourtDetailsPage } from "./features/home/components/court";
// import MyTeam from "./features/myteam/MyTeamSimple"; // Import the simplified MyTeam component
import CreateTeamPage from "./features/myteam/pages/CreateTeamPage"; // Import the dedicated team creation page
import TeamDetailsPage from "./features/myteam/pages/TeamDetailsPage"; // Import team details page
import TeamsListPage from "./features/myteam/pages/TeamsListPage"; // Import teams list page
import BrowseTeamsPage from "./features/teams/pages/BrowseTeamsPage"; // Import browse teams page
import TeamsPage from "./features/teams/pages/TeamsPage"; // Import simple teams page
import MyBookingsPage from "./features/booking/pages/MyBookingsPage"; // Import booking pages
import CompanyBookingDashboard from "./features/booking/pages/CompanyBookingDashboard"; // Import company booking dashboard
import { MyComplaintsPage, ManagerComplaintsPage, CreateComplaintPage, ComplaintSystemDemo } from "./features/complaints"; // Import complaint pages
import Navbar from "./core/layout/Navbar";
import { Footer } from "./core/layout/Footer";
import FloatingAIAssistants from "./components/ai/FloatingAIAssistants"; // Import AI assistants
import './App.css';
import CourtManagementPage from "./features/dashboard/components/CourtManagementPage";
import CourtSchedulePage from "./pages/CourtSchedulePage";
import TournamentListPage from "./features/tournaments/pages/TournamentListPage";
import TournamentManagerPage from "./features/tournaments/pages/TournamentManagerPage";
import TournamentManager from "./pages/TournamentManager";
import TournamentList from "./features/tournaments/pages/TournamentList";
import TournamentDetails from "./features/tournaments/pages/TournamentDetails";
import TournamentWizard from "./components/tournament/TournamentWizard";
import EquipmentManagement from "./pages/Equipment/EquipmentManagement";

// Import new marketplace components
import MarketplaceApp from "./pages/Equipment/MarketplaceApp";
import OrderHistory from "./pages/Equipment/OrderHistory";

// A simple HomePage component for the main route
const HomePage = () => (
  <>
    <HeroSection />
    <CategoriesSection />
    <FeaturesSection />
  </>
);

function App() {
  // Initialize global error handling
  React.useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          {/* Render Navbar and Footer conditionally or let pages handle them */}
          <Routes>
          <Route path="/" element={<>
            <Navbar />
            <main className="flex-grow">
              <HomePage />
            </main>
            <Footer />
            <FloatingAIAssistants />
          </>} />
          <Route path="/account-settings" element={<AccountSettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-team" element={<>
            <Navbar />
            <main className="flex-grow">
              <TeamsListPage />
            </main>
            <Footer />
            <FloatingAIAssistants />
          </>} />
          <Route path="/create-team" element={<>
            <Navbar />
            <main className="flex-grow">
              <CreateTeamPage />
            </main>
            <Footer />
          </>} />
          <Route path="/team/:teamId" element={<>
            <Navbar />
            <main className="flex-grow">
              <TeamDetailsPage />
            </main>
            <Footer />
          </>} />
          <Route path="/browse-teams" element={<>
            <Navbar />
            <main className="flex-grow">
              <BrowseTeamsPage />
            </main>
            <Footer />
            <FloatingAIAssistants />
          </>} />
          <Route path="/teams" element={<>
            <Navbar />
            <main className="flex-grow">
              <TeamsPage />
            </main>
            <Footer />
          </>} />
          <Route path="/reset-password/:token" element={<PasswordResetPage />} />
          <Route path="/dashboard" element={<DashboardPage />}>
            <Route path="user-management" element={<UserManagement />} />
            <Route path="manager-management" element={<ManagerManagement />} />
            <Route path="player-management" element={<PlayerManagement />} />
            <Route path="complaint-management" element={<ComplaintManagement />} />
            <Route path="company-management" element={<CompanyManagement />} />
            <Route path="booking-management" element={<BookingManagement />} />
            <Route path="court-management" element={<CourtManagementPage />} />
            <Route path="court-schedules" element={<CourtSchedulePage />} />
            <Route path="tournament-management" element={<TournamentWizard />} />
            <Route path="tournament-management-old" element={<TournamentManagerPage />} />
            <Route path="tournament-list" element={<TournamentList />} />
            <Route path="tournament-details/:tournamentId" element={<TournamentDetails />} />
            <Route path="equipment-management" element={<EquipmentManagement />} />
          </Route>
          <Route path="/courts" element={<>
            <Navbar />
            <main className="flex-grow">
              <CourtsPage />
            </main>
            <Footer />
            <FloatingAIAssistants />
          </>} />
          <Route path="/courts/:id" element={<>
            <Navbar />
            <main className="flex-grow">
              <CourtDetailsPage />
            </main>
            <Footer />
          </>} />
          <Route path="/my-bookings" element={<>
            <Navbar />
            <main className="flex-grow">
              <MyBookingsPage />
            </main>
            <Footer />
          </>} />
          <Route path="/my-complaints" element={<>
            <Navbar />
            <main className="flex-grow">
              <MyComplaintsPage />
            </main>
            <Footer />
          </>} />
          <Route path="/complaints/new" element={<>
            <Navbar />
            <main className="flex-grow">
              <CreateComplaintPage />
            </main>
            <Footer />
          </>} />
          <Route path="/manager/complaints" element={<>
            <Navbar />
            <main className="flex-grow">
              <ManagerComplaintsPage />
            </main>
          </>} />
          <Route path="/complaint-demo" element={<>
            <Navbar />
            <main className="flex-grow">
              <ComplaintSystemDemo />
            </main>
            <Footer />
          </>} />
          <Route path="/company/:companyId/bookings" element={<>
            <Navbar />
            <main className="flex-grow">
              <CompanyBookingDashboard />
            </main>
            <Footer />
          </>} />
          <Route path="/sportify-admin" element={<AdminSignInPage />} />
          <Route path="/tournaments" element={<>
            <Navbar />
            <main className="flex-grow">
              <TournamentListPage />
            </main>
            <Footer />
          </>} />
          <Route path="/manager/tournaments" element={<>
            <Navbar />
            <main className="flex-grow">
              <TournamentManagerPage />
            </main>
            <Footer />
          </>} />
          <Route path="/tournament-manager" element={<>
            <Navbar />
            <main className="flex-grow">
              <TournamentWizard />
            </main>
            <Footer />
          </>} />
          <Route path="/tournament-manager-old" element={<>
            <Navbar />
            <main className="flex-grow">
              <TournamentManager />
            </main>
            <Footer />
          </>} />
          <Route path="/equipment" element={<>
            <Navbar />
            <main className="flex-grow">
              <EquipmentManagement />
            </main>
            <Footer />
          </>} />
          
          {/* Marketplace Routes */}
          <Route path="/marketplace/*" element={<MarketplaceApp />} />
          <Route path="/marketplace" element={<MarketplaceApp />} />
          <Route path="/orders" element={<>
            <Navbar />
            <main className="flex-grow">
              <OrderHistory />
            </main>
            <Footer />
          </>} />
          
          {/* Add other routes here */}          
        </Routes>
      </div>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
