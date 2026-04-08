import { Link, useLocation } from 'react-router-dom';
import { 
  Home, List, Utensils, Users, Wrench, User, LogOut, Radio, 
  Fingerprint, Grid, Activity, CheckCircle, Clock, AlertCircle,
  FileText, PieChart, ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ role }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const [openSection, setOpenSection] = useState('complaints');

  const getLinks = () => {
    switch (role) {
      case 'student':
        return [
          { name: t('dashboard'), path: '/', icon: <Home size={20} /> },
          { name: 'Daily Attendance', path: '/attendance', icon: <Fingerprint size={20} /> },
          { name: 'Menu & Feedback', path: '/menu-feedback', icon: <Utensils size={20} /> },
          { 
            name: 'Complaints', 
            icon: <Radio size={20} />, 
            subLinks: [
              { name: 'My Complaints', path: '/complaints', icon: <List size={18} /> },
              { name: 'New Complaint', path: '/complaints/new', icon: <Activity size={18} /> },
            ] 
          },
          { name: 'My Favourites', path: '/favorites', icon: <Heart size={20} /> },
        ];
      case 'admin':
        return [
          { name: 'Dashboard Home', path: '/', icon: <Grid size={20} /> },
          { name: 'Attendance Report', path: '/attendance-report', icon: <Fingerprint size={20} /> },
          { name: 'Manage Menu', path: '/manage-menu', icon: <Utensils size={20} /> },
          { name: 'Food Satisfaction', path: '/food-analytics', icon: <PieChart size={20} /> },
          { 
            name: 'Complaints Hub', 
            id: 'admin-complaints',
            icon: <AlertCircle size={20} />,
            subLinks: [
              { name: 'All Complaints', path: '/admin-complaints', icon: <List size={18} /> },
              { name: 'Pending Review', path: '/admin-complaints/pending', icon: <Clock size={18} /> },
              { name: 'Assigned Tasks', path: '/admin-complaints/assigned', icon: <Wrench size={18} /> },
              { name: 'Resolved & Closed', path: '/admin-complaints/resolved', icon: <CheckCircle size={18} /> },
            ]
          },
          { name: 'User Management', path: '/users', icon: <Users size={20} /> },
          { name: 'Hostel Occupancy', path: '/hostel-stats', icon: <Activity size={20} /> },
          { name: 'Executive Reports', path: '/reports', icon: <FileText size={20} /> },
        ];
      case 'worker':
        return [
          { name: 'Task Dashboard', path: '/', icon: <Home size={20} /> },
          { 
            name: 'My Assignments', 
            id: 'worker-complaints',
            icon: <Wrench size={20} />,
            subLinks: [
              { name: 'Pending Tasks', path: '/worker-tasks/pending', icon: <Clock size={18} /> },
              { name: 'Resolved Tasks', path: '/worker-tasks/resolved', icon: <CheckCircle size={18} /> },
            ]
          },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="sidebar">
      {/* Brand Section */}
      <div className="sidebar-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '2rem 1.7rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ 
            background: 'var(--gradient-btn)', padding: '8px', 
            borderRadius: '12px', boxShadow: '0 4px 12px rgba(155, 93, 229, 0.3)' 
          }}>
            <Activity size={22} color="white" />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>HostelCare</span>
        </div>
      </div>

      <div className="sidebar-nav">
        {links.map((link) => (
          <div key={link.name || link.id}>
            {link.subLinks ? (
              <div className="nav-group">
                <button 
                  onClick={() => toggleSection(link.id || link.name)}
                  className={`nav-link ${location.pathname.includes(link.id || link.name) ? 'active' : ''}`}
                  style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  {link.icon}
                  <span style={{ flex: 1 }}>{link.name}</span>
                  <ChevronRight size={16} style={{ 
                    transition: 'transform 0.3s', 
                    transform: openSection === (link.id || link.name) ? 'rotate(90deg)' : 'none' 
                  }} />
                </button>
                {(openSection === (link.id || link.name) || location.pathname.includes(link.id || link.name)) && (
                  <div className="sub-nav" style={{ paddingLeft: '1.5rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {link.subLinks.map((sub) => (
                      <Link
                        key={sub.name}
                        to={sub.path}
                        className={`nav-link sub-link ${location.pathname === sub.path ? 'active' : ''}`}
                        style={{ fontSize: '0.85rem', padding: '0.7rem 1rem' }}
                      >
                        {sub.icon}
                        <span>{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Profile Section */}
      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '12px', 
            background: 'rgba(255,255,255,0.05)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <User size={20} color="var(--accent)" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {role}
            </div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="nav-link"
          style={{ 
            width: '100%', border: 'none', background: 'rgba(239, 68, 68, 0.1)', 
            color: '#FCA5A5', cursor: 'pointer', justifyContent: 'center'
          }}
        >
          <LogOut size={18} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
