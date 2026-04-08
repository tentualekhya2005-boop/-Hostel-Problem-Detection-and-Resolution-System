import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Moon, Sun, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { useTranslation } from 'react-i18next';

const Header = ({ user }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [isDark, setIsDark] = useState(
    localStorage.getItem('theme') === 'dark' || false
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        
        {/* Language Toggler */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Globe size={16} color="var(--text-main)" className="hide-mobile" />
          <select 
            onChange={changeLanguage} 
            defaultValue={i18n.language || 'en'}
            style={{ 
              padding: '0.25rem 0.6rem', 
              fontSize: '0.75rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-main)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="hi">HI</option>
            <option value="te">TE</option>
          </select>
        </div>

        {/* Theme Toggler */}
        <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 500, borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <User size={16} />
          </div>
          <span className="header-user-text" style={{ fontSize: '0.85rem' }}>
            {user.name}
          </span>
        </div>
        
        {user && <NotificationBell />}
        
        <button onClick={handleLogout} className="btn" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '0.75rem' }}>
          <LogOut size={14} />
          <span className="hide-mobile">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
