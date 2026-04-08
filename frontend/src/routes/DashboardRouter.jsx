import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

// Dashboards
import StudentDashboard from '../pages/StudentDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import WorkerDashboard from '../pages/WorkerDashboard';
import AttendancePage from '../pages/AttendancePage';
import FavoritesPage from '../pages/FavoritesPage';
import MenuFeedbackPage from '../pages/MenuFeedbackPage';
import FoodAnalyticsPage from '../pages/FoodAnalyticsPage';
import ReportsPage from '../pages/ReportsPage';
import WorkerRegistrationPage from '../pages/WorkerRegistrationPage';
import AnnouncementPage from '../pages/AnnouncementPage';
import UpdatePage from '../pages/UpdatePage';
import StudentAnnouncementsPage from '../pages/StudentAnnouncementsPage';

const DashboardRouter = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" />;

  const getRoutes = () => {
    switch (user.role) {
      case 'student':
        return (
          <>
            <Route path="/" element={<StudentDashboard />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/menu-feedback" element={<MenuFeedbackPage />} />
            <Route path="/complaints/pending" element={<StudentDashboard filterStatus="Pending" />} />
            <Route path="/complaints/assigned" element={<StudentDashboard filterStatus="Assigned" />} />
            <Route path="/complaints/resolved" element={<StudentDashboard filterStatus="Resolved" />} />
            <Route path="/announcements" element={<StudentAnnouncementsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        );
      case 'admin':
        return (
          <>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/attendance-report" element={<AdminDashboard />} />
            <Route path="/admin/complaints/pending" element={<AdminDashboard filterStatus="Pending" />} />
            <Route path="/admin/complaints/assigned" element={<AdminDashboard filterStatus="Assigned" />} />
            <Route path="/admin/complaints/resolved" element={<AdminDashboard filterStatus="Resolved" />} />
            <Route path="/admin/workers" element={<WorkerRegistrationPage />} />
            <Route path="/admin/announcement" element={<AnnouncementPage />} />
            <Route path="/admin/update" element={<UpdatePage />} />
            <Route path="/food-analytics" element={<FoodAnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        );
      case 'worker':
        return (
          <>
            <Route path="/" element={<WorkerDashboard />} />
            <Route path="/worker/tasks/pending" element={<WorkerDashboard filterStatus="Pending" />} />
            <Route path="/worker/tasks/assigned" element={<WorkerDashboard filterStatus="Assigned" />} />
            <Route path="/worker/tasks/resolved" element={<WorkerDashboard filterStatus="Resolved" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        );
      default:
        return <Route path="*" element={<div>Invalid role</div>} />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role={user.role} />
      <div className="main-content">
        <Header user={user} />
        <div className="content-area">
          <Routes>
            {getRoutes()}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardRouter;
