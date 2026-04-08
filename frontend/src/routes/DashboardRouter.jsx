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
            <Route path="/complaints" element={<StudentDashboard />} />
            <Route path="/menu" element={<StudentDashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        );
      case 'admin':
        return (
          <>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/attendance-report" element={<AdminDashboard />} />
            <Route path="/food-analytics" element={<FoodAnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/hostel-stats" element={<AdminDashboard />} />
            <Route path="/admin-complaints" element={<AdminDashboard />} />
            <Route path="/admin-complaints/pending" element={<AdminDashboard />} />
            <Route path="/admin-complaints/assigned" element={<AdminDashboard />} />
            <Route path="/admin-complaints/resolved" element={<AdminDashboard />} />
            <Route path="/users" element={<AdminDashboard />} />
            <Route path="/manage-menu" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        );
      case 'worker':
        return (
          <>
            <Route path="/" element={<WorkerDashboard />} />
            <Route path="/worker-tasks/pending" element={<WorkerDashboard />} />
            <Route path="/worker-tasks/resolved" element={<WorkerDashboard />} />
            <Route path="/worker-menu" element={<WorkerDashboard />} />
            <Route path="/worker-attendance" element={<WorkerDashboard />} />
            <Route path="/worker-ratings" element={<WorkerDashboard />} />
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
