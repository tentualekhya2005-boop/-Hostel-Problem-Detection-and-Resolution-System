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
            <Route path="/admin-complaints" element={<AdminDashboard />} />
            <Route path="/users" element={<AdminDashboard />} />
            <Route path="/manage-menu" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        );
      case 'worker':
        return (
          <>
            <Route path="/" element={<WorkerDashboard />} />
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
