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
    } catch (error) { toast.error('Failed to remove task'); }
  };

  return (
    <div>
      <h1 className="page-title">Worker Dashboard</h1>
      
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '1.25rem' }}>
          <Wrench size={24} /> My Assigned Tasks
        </div>

        {tasks.length === 0 ? (
          <p className="text-muted">You have no assigned tasks right now.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {tasks.map(task => (
              <div key={task._id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Room: <strong>{task.roomNumber}</strong></span>
                </div>
                
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{task.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', flex: 1, marginBottom: '1rem' }}>{task.description}</p>
                
                {task.imageUrl && (
                  <div style={{ marginBottom: '1rem' }}>
                    <a href={getFullImageUrl(task.imageUrl)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>View Student's Attached Image</a>
                  </div>
                )}

                {task.resolvedImageUrl && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--success)', marginBottom: '0.5rem' }}>✅ Your Resolution Photo:</strong>
                    <img 
                      src={getFullImageUrl(task.resolvedImageUrl)} 
                      alt="Resolved" 
                      style={{ width: '100%', maxWidth: '200px', borderRadius: '0.5rem', border: '1px solid var(--border)' }} 
                    />
                  </div>
                )}
                
                {task.status === 'Assigned' && (
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload Completion Photo:</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      accept="image/*" 
                      onChange={(e) => handleImageChange(task._id, e.target.files[0])}
                      style={{ padding: '0.5rem', marginBottom: '0.5rem' }}
                    />
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', gap: '0.5rem', opacity: resolveImages[task._id] && resolvingId !== task._id ? 1 : 0.5, cursor: resolveImages[task._id] && resolvingId !== task._id ? 'pointer' : 'not-allowed' }}
                      disabled={!resolveImages[task._id] || resolvingId === task._id}
                      onClick={() => handleResolve(task._id)}
                    >
                      <CheckCircle size={18} /> {resolvingId === task._id ? 'Uploading...' : 'Mark as Resolved'}
                    </button>
                  </div>
                )}

                {task.status !== 'Assigned' && (
                  <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #f87171', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      onClick={() => handleDelete(task._id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
