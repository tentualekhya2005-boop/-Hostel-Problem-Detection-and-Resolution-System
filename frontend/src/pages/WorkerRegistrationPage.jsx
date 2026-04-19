import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { UserPlus, Users, Trash2 } from 'lucide-react';

const WorkerRegistrationPage = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [newWorker, setNewWorker] = useState({ name: '', email: '', password: '', skills: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchWorkers(); }, []);

  const fetchWorkers = async () => {
    try {
      const { data } = await axios.get(`http://127.0.0.1:5001/api/users/workers`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setWorkers(data);
    } catch (e) { console.log('Failed to load workers'); }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`http://127.0.0.1:5001/api/users/worker`,
        { ...newWorker, skills: newWorker.skills.split(',').map(s => s.trim()) }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Worker registered successfully!');
      setNewWorker({ name: '', email: '', password: '', skills: '' });
      fetchWorkers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register worker');
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <UserPlus size={32} color="var(--primary)" /> Worker Registration
        </h1>
        <p className="text-muted">Register new maintenance workers and view the current workforce.</p>
      </header>

      <div className="grid-responsive">
        {/* Registration Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
            <UserPlus size={22} /> Register New Worker
          </div>
          <form onSubmit={handleAddWorker} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="e.g. Ravi Kumar" value={newWorker.name} onChange={e => setNewWorker({ ...newWorker, name: e.target.value })} required autoComplete="off" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="worker@example.com" value={newWorker.email} onChange={e => setNewWorker({ ...newWorker, email: e.target.value })} required autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Min. 6 characters" value={newWorker.password} onChange={e => setNewWorker({ ...newWorker, password: e.target.value })} required minLength={6} autoComplete="new-password" />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Skills <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma separated)</span></label>
              <input type="text" className="form-input" placeholder="e.g. electrical, plumbing, carpentry" value={newWorker.skills} onChange={e => setNewWorker({ ...newWorker, skills: e.target.value })} required autoComplete="off" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Registering...' : '+ Register Worker'}
            </button>
          </form>
        </div>

        {/* Worker List */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
            <Users size={22} /> Current Workforce <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.85rem', fontWeight: 700, marginLeft: '0.5rem' }}>{workers.length}</span>
          </div>
          {workers.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No workers registered yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {workers.map((w, i) => (
                <div key={w._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1rem', borderRadius: '0.65rem',
                  background: i % 2 === 0 ? 'var(--bg-main)' : 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>{w.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{w.email}</div>
                    {w.skills?.length > 0 && (
                      <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {w.skills.map((sk, idx) => (
                          <span key={idx} style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 600 }}>{sk}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>Active</span>
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

export default WorkerRegistrationPage;
