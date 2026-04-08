import { Link, useLocation } from 'react-router-dom';
import { Home, List, Utensils, Users, Wrench, User, LogOut, Radio, Music, Heart, Menu, Fingerprint, Grid, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ role }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);

  const getLinks = () => {
    switch (role) {
      case 'student':
        return [
          { name: t('dashboard'), path: '/', icon: <Home size={22} /> },
          { name: 'Daily Attendance', path: '/attendance', icon: <Fingerprint size={22} /> },
          { name: t('my_complaints'), path: '/complaints', icon: <Radio size={22} /> },
          { name: t('todays_menu'), path: '/menu-feedback', icon: <Utensils size={22} /> },
          { name: 'My Favourites', path: '/favorites', icon: <Heart size={22} /> },
        ];
      case 'admin':
        return [
          { name: 'Full Dashboard', path: '/', icon: <Grid size={22} /> },
          { name: 'Food Analytics', path: '/food-analytics', icon: <Utensils size={22} /> },
          { name: 'Attendance Report', path: '/attendance-report', icon: <Fingerprint size={22} /> },
          { name: 'Hostel Stats', path: '/hostel-stats', icon: <Activity size={22} /> },
          { name: t('all_complaints'), path: '/admin-complaints', icon: <List size={22} /> },
          { name: t('manage_users'), path: '/users', icon: <Users size={22} /> },
          { name: t('manage_menu'), path: '/manage-menu', icon: <Utensils size={22} /> },
          { name: 'Reports', path: '/reports', icon: <Activity size={22} /> },
        ];
      case 'worker':
        return [
          { name: t('my_tasks'), path: '/', icon: <Wrench size={22} /> },
          { name: 'Completed Tasks', path: '#', icon: <Heart size={22} /> },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="sidebar" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Profile Section as seen in music app */}
      <div style={{ padding: '2.5rem 1.8rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
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

      <div className="sidebar-nav" style={{ flex: 1 }}>
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
          >
            {link.icon}
            {link.name}
          </Link>
        ))}
      </div>

      {/* Logout at bottom */}
      <div style={{ padding: '1.5rem', marginTop: 'auto' }}>
        <button 
          onClick={logout}
          style={{ 
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', 
            display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.2rem',
            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, width: '100%',
            borderRadius: '0.875rem'
          }}
          onMouseOver={(e) => e.target.style.color = 'white'}
          onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
        >
          <LogOut size={20} />
          {t('logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
