import { Link, useLocation } from 'react-router-dom';
import { Home, List, Utensils, Users, User, LogOut, Radio, Fingerprint, Grid, CheckCircle, Clock, ClipboardList, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ role }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
    }, 800); // Small delay for visual feedback
  };

  const getLinks = () => {
    switch (role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/', icon: <Home size={22} /> },
          { name: 'Submitted Complaints', path: '/complaints/pending', icon: <Clock size={22} /> },
          { name: 'Assigned Complaints', path: '/complaints/assigned', icon: <ClipboardList size={22} /> },
          { name: 'Resolved Complaints', path: '/complaints/resolved', icon: <CheckCircle size={22} /> },
          { name: 'Daily Attendance', path: '/attendance', icon: <Fingerprint size={22} /> },
          { name: 'Announcements', path: '/announcements', icon: <Radio size={22} /> },
          { name: "Today's Menu", path: '/menu-feedback', icon: <Utensils size={22} /> },
          { name: 'My Favourites', path: '/favorites', icon: <Grid size={22} /> },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/', icon: <Home size={22} /> },
          { name: 'Pending Complaints', path: '/admin/complaints/pending', icon: <Clock size={22} /> },
          { name: 'Assigned Complaints', path: '/admin/complaints/assigned', icon: <ClipboardList size={22} /> },
          { name: 'Resolved Complaints', path: '/admin/complaints/resolved', icon: <CheckCircle size={22} /> },
          { name: 'Worker Registration', path: '/admin/workers', icon: <Users size={22} /> },
          { name: 'Announcement', path: '/admin/announcement', icon: <Radio size={22} /> },
          { name: 'Update Data', path: '/admin/update', icon: <RefreshCw size={22} /> },
          { name: 'Attendance Report', path: '/attendance-report', icon: <Fingerprint size={22} /> },
          { name: 'Food Analytics', path: '/food-analytics', icon: <Utensils size={22} /> },
          { name: 'Reports', path: '/reports', icon: <List size={22} /> },
        ];
      case 'worker':
        return [
          { name: 'My Dashboard', path: '/', icon: <Home size={22} /> },
          { name: 'New Tasks', path: '/worker/tasks/pending', icon: <Clock size={22} /> },
          { name: 'My Current Tasks', path: '/worker/tasks/assigned', icon: <ClipboardList size={22} /> },
          { name: 'Completed Tasks', path: '/worker/tasks/resolved', icon: <CheckCircle size={22} /> },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="sidebar">
      {/* Profile Section */}
      <div className="profile-section" style={{ padding: '2.5rem 1.8rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '22px',
          background: 'linear-gradient(45deg, #9B5DE5, #F15BB5)',
          padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '18px',
            background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <User size={30} color="white" />
          </div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>Hi</div>
          <div style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '2px' }}>
            {user?.name || 'User'}
          </div>
        </div>
      </div>

      <div className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.name}</span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="logout-section" style={{ padding: '1.5rem', marginTop: 'auto' }}>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          style={{
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.2rem',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: 600, width: '100%',
            borderRadius: '0.875rem'
          }}
          onMouseOver={(e) => !isLoggingOut && (e.currentTarget.style.color = 'white')}
          onMouseOut={(e) => !isLoggingOut && (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <LogOut size={20} className={isLoggingOut ? 'animate-spin' : ''} />
          {isLoggingOut ? 'Logging out...' : t('logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
