import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Megaphone, Send } from 'lucide-react';

const AnnouncementPage = () => {
  const { user } = useContext(AuthContext);
  const [announcement, setAnnouncement] = useState({ title: '', message: '', targetRole: 'all' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState([]);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/announcements/broadcast`, announcement, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Announcement broadcasted successfully! 🚀');
      setSent(prev => [{ ...announcement, sentAt: new Date() }, ...prev]);
      setAnnouncement({ title: '', message: '', targetRole: 'all' });
    } catch (error) {
      toast.error('Failed to send announcement');
    } finally { setLoading(false); }
  };

  const targetLabels = { all: 'All Users', student: 'Students Only', worker: 'Workers Only', admin: 'Admins Only' };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Megaphone size={32} color="var(--primary)" /> Send Announcement
        </h1>
        <p className="text-muted">Broadcast important notices to students, workers, or all users.</p>
      </header>

      <div className="grid-responsive">
        {/* Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
            <Send size={22} /> Compose Announcement
          </div>
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select className="form-select" value={announcement.targetRole} onChange={e => setAnnouncement({ ...announcement, targetRole: e.target.value })} required>
                <option value="all">📢 Everyone (All Users)</option>
                <option value="student">🎓 Students Only</option>
                <option value="worker">🔧 Workers Only</option>
                <option value="admin">👤 Admins Only</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Announcement Title</label>
              <input type="text" className="form-input" placeholder="e.g. Water supply disruption on 2nd floor" value={announcement.title} onChange={e => setAnnouncement({ ...announcement, title: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Detailed Message</label>
              <textarea className="form-textarea" rows={5} placeholder="Write the full announcement message here..." value={announcement.message} onChange={e => setAnnouncement({ ...announcement, message: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
              <Send size={18} /> {loading ? 'Sending...' : 'Send Announcement 🚀'}
            </button>
          </form>
        </div>

        {/* Sent history */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '1.25rem' }}>
            📋 Recently Sent (this session)
          </div>
          {sent.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No announcements sent yet in this session.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sent.map((s, i) => (
                <div key={i} style={{ padding: '1rem', borderRadius: '0.65rem', background: 'linear-gradient(135deg, var(--primary-light), transparent)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                    <strong style={{ color: 'var(--text-main)' }}>{s.title}</strong>
                    <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '9999px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      → {targetLabels[s.targetRole] || s.targetRole}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{s.message}</p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Sent at {s.sentAt.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPage;
