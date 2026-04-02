import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

// Dashboards
import StudentDashboard from '../pages/StudentDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import WorkerDashboard from '../pages/WorkerDashboard';

const DashboardRouter = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" />;

  const renderDashboard = () => {
    switch (user.role) {
      case 'student':
        return <StudentDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'worker':
        return <WorkerDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role={user.role} />
      <div className="main-content">
        <Header user={user} />
        <div className="content-area">
          <Routes>
            <Route path="/" element={renderDashboard()} />
            {/* Additional shared or specific routes can go here */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardRouter;
