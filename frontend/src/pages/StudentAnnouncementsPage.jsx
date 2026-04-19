import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Megaphone, Calendar, Info, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const StudentAnnouncementsPage = () => {
  const { user } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/announcements`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAnnouncements(data);
    } catch (error) {
      console.log("No announcements found");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (confirmingId !== id) {
      setConfirmingId(id);
      setTimeout(() => setConfirmingId(prev => prev === id ? null : prev), 3000);
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Announcement removed');
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      setConfirmingId(null);
    } catch (error) {
      toast.error('Failed to remove announcement');
      setConfirmingId(null);
    }
  };

  if (loading) return <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>Loading announcements...</div>;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Megaphone size={32} color="var(--primary)" /> Circulars & Announcements
        </h1>
        <p className="text-muted">Stay updated with the latest notices from the hostel management.</p>
      </header>

      {announcements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Info size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>No New Announcements</h3>
          <p className="text-muted">We'll notify you when there's an update from the office.</p>
        </div>
      ) : (
        <div className="grid-responsive" style={{ gap: '1.5rem' }}>
          {announcements.map((ann, idx) => (
            <div key={ann._id || idx} className="card" style={{ padding: '1.5rem', borderLeft: '5px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {new Date(ann.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <button 
                  onClick={() => handleDelete(ann._id)}
                  style={{ 
                    background: confirmingId === ann._id ? '#ef4444' : 'rgba(239, 68, 68, 0.1)', 
                    border: 'none', 
                    color: confirmingId === ann._id ? 'white' : '#ef4444', 
                    cursor: 'pointer', 
                    padding: '0.4rem 0.8rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s ease'
                  }}
                  title="Remove from view"
                >
                  <Trash2 size={14} /> {confirmingId === ann._id ? 'Confirm?' : 'Delete'}
                </button>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{ann.title}</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{ann.message}</p>
              
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  background: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  padding: '0.2rem 0.75rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.7rem', 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Official Notice
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncementsPage;
