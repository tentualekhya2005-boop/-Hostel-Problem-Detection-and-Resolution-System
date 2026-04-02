import { Link, useLocation } from 'react-router-dom';
import { Home, List, Utensils, Users, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ role }) => {
  const location = useLocation();
  const { t } = useTranslation();

  const getLinks = () => {
    switch (role) {
      case 'student':
        return [
          { name: t('dashboard'), path: '/', icon: <Home size={20} /> },
          { name: t('my_complaints'), path: '/complaints', icon: <List size={20} /> },
          { name: t('todays_menu'), path: '/menu', icon: <Utensils size={20} /> },
        ];
      case 'admin':
        return [
          { name: t('dashboard'), path: '/', icon: <Home size={20} /> },
          { name: t('all_complaints'), path: '/admin-complaints', icon: <List size={20} /> },
          { name: t('manage_users'), path: '/users', icon: <Users size={20} /> },
          { name: t('manage_menu'), path: '/manage-menu', icon: <Utensils size={20} /> },
        ];
      case 'worker':
        return [
          { name: t('my_tasks'), path: '/', icon: <Wrench size={20} /> },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Home size={24} />
        <span>HostelPortal</span>
      </div>
      <div className="sidebar-nav">
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
    </div>
  );
};

export default Sidebar;
