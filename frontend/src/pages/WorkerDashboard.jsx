import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Wrench, CheckCircle, Trash2 } from 'lucide-react';

const WorkerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [resolveImages, setResolveImages] = useState({});
  const [resolvingId, setResolvingId] = useState(null);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.toLowerCase().startsWith('http')) return trimmed;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/['"]/g, '').replace(/\/$/, '');
    return `${baseUrl}/${trimmed.replace(/^\//, '')}`;
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/worker`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTasks(data);
    } catch (error) { toast.error('Failed to load tasks'); }
  };

  const handleImageChange = (taskId, file) => {
    setResolveImages(prev => ({ ...prev, [taskId]: file }));
  };

  const handleResolve = async (id) => {
    if (!resolveImages[id]) {
      toast.error('You must attach a completion photo first!');
      return;
    }

    setResolvingId(id);
    try {
      const formData = new FormData();
      if (resolveImages[id]) {
        formData.append('image', resolveImages[id]);
      }

      // Fake Image Detection (Geolocation)
      if (navigator.geolocation) {
         try {
           const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
           formData.append('latitude', pos.coords.latitude);
           formData.append('longitude', pos.coords.longitude);
           formData.append('timestamp', new Date().toISOString());
         } catch(e) { console.log('Geolocation denied or failed'); }
      }

      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/${id}/resolve`, formData, {
        headers: { 
          Authorization: `Bearer ${user.token}`
        }
      });
      toast.success('Task marked as resolved!');
      fetchTasks();
    } catch (error) { 
      toast.error('Failed to resolve task'); 
    } finally {
      setResolvingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this solved task from your dashboard?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/worker/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Task removed from dashboard');
      fetchTasks();
    } catch (error) { 
      toast.error(`Failed to remove task: ${error.response?.data?.message || error.message}`); 
    }
  };

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
         <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Worker Dashboard</h1>
         <p style={{ color: 'var(--text-muted)' }}>Manage your assigned maintenance tasks</p>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.25rem' }}>
          <Wrench size={24} /> My Assigned Tasks
        </div>
        <div className="segmented-control">
           <div className="segment-item active">In Progress</div>
           <div className="segment-item">Completed</div>
        </div>
      </div>

        {tasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
             You have no assigned tasks right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {tasks.map(task => (
              <div key={task._id} className="card" style={{ 
                border: 'none', 
                borderRadius: '1.5rem', 
                padding: '1.5rem', 
                display: 'flex', 
                flexDirection: 'column',
                marginBottom: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                  <span className={`badge badge-${task.status.replace(/\s+/g, '-').toLowerCase()}`} style={{ fontSize: '0.7rem' }}>{task.status}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--info-light)', padding: '0.2rem 0.6rem', borderRadius: '1rem', color: 'var(--info)' }}>Room {task.roomNumber}</span>
                </div>
                
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-main)' }}>{task.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1, marginBottom: '1.5rem', lineHeight: 1.5 }}>{task.description}</p>
                
                {task.imageUrl && (
                  <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem' }}>
                    <a href={getFullImageUrl(task.imageUrl)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                      📸 View Student's Attached Image
                    </a>
                  </div>
                )}

                {task.resolvedImageUrl && (
                  <div style={{ marginBottom: '1.5rem', background: 'var(--success-light)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--success)', marginBottom: '0.5rem' }}>✅ Your Resolution Photo:</strong>
                    <img 
                      src={getFullImageUrl(task.resolvedImageUrl)} 
                      alt="Resolved" 
                      style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid rgba(16,185,129,0.2)' }} 
                    />
                  </div>
                )}
                
                {task.status === 'Assigned' && (
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upload Completion Photo:</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      accept="image/*" 
                      onChange={(e) => handleImageChange(task._id, e.target.files[0])}
                      style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'white' }}
                    />
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', gap: '0.5rem', opacity: resolveImages[task._id] && resolvingId !== task._id ? 1 : 0.5, cursor: resolveImages[task._id] && resolvingId !== task._id ? 'pointer' : 'not-allowed', borderRadius: '0.75rem' }}
                      disabled={!resolveImages[task._id] || resolvingId === task._id}
                      onClick={() => handleResolve(task._id)}
                    >
                      <CheckCircle size={18} /> {resolvingId === task._id ? 'Uploading Verification...' : 'Mark as Resolved'}
                    </button>
                  </div>
                )}

                {task.status !== 'Assigned' && (
                  <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
                    <button 
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                      onClick={() => handleDelete(task._id)}
                    >
                      <Trash2 size={14} /> Clear Task
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      {/* Floating Pill Nav for Mobile Impression */}
      <div style={{ position: 'fixed', bottom: '2rem', left: '0', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
        <div className="floating-pill" style={{ pointerEvents: 'auto' }}>
           <div className="floating-pill-item"><span style={{fontSize:'1.2rem'}}>⊞</span></div>
           <div className="floating-pill-item active" style={{background: 'var(--primary)'}}><span style={{fontSize:'1.2rem'}}>💼</span></div>
           <div className="floating-pill-item"><span style={{fontSize:'1.2rem'}}>👤</span></div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
