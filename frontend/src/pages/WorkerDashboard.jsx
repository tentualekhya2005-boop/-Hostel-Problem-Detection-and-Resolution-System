import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Wrench, CheckCircle, Trash2 } from 'lucide-react';

const WorkerDashboard = ({ filterStatus }) => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [resolveImages, setResolveImages] = useState({});

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

    try {
      const formData = new FormData();
      if (resolveImages[id]) {
        formData.append('image', resolveImages[id]);
      }

      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/${id}/resolve`, formData, {
        headers: { 
          Authorization: `Bearer ${user.token}`
        }
      });
      toast.success('Task marked as resolved!');
      fetchTasks();
    } catch (error) { toast.error('Failed to resolve task'); }
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
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="page-title">{filterStatus ? `${filterStatus} Tasks` : 'Worker Dashboard'}</h1>
        <p className="text-muted">{filterStatus ? `Showing all ${filterStatus.toLowerCase()} tasks.` : 'Manage your assigned maintenance tasks.'}</p>
      </header>
      
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '1.25rem' }}>
          <Wrench size={24} /> {filterStatus ? `${filterStatus} Tasks` : 'My Assigned Tasks'}
        </div>

        {tasks.filter(t => {
            if (!filterStatus) return true;
            if (filterStatus === 'Pending') return t.status === 'Assigned';
            if (filterStatus === 'Assigned') return t.status === 'Assigned';
            if (filterStatus === 'Resolved') return ['Resolved', 'Student Verified', 'Needs Verification'].includes(t.status);
            return t.status === filterStatus;
        }).length === 0 ? (
          <p className="text-muted">No {filterStatus?.toLowerCase() || ''} tasks found.</p>
        ) : (
          <div className="grid-responsive">
            {tasks.filter(t => {
                if (!filterStatus) return true;
                if (filterStatus === 'Pending') return t.status === 'Assigned';
                if (filterStatus === 'Assigned') return t.status === 'Assigned';
                if (filterStatus === 'Resolved') return ['Resolved', 'Student Verified', 'Needs Verification'].includes(t.status);
                return t.status === filterStatus;
            }).map(task => (
              <div key={task._id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Room: <strong>{task.roomNumber}</strong></span>
                </div>
                
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{task.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', flex: 1, marginBottom: '1rem' }}>{task.description}</p>

                {/* Location Details */}
                <div style={{ 
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem', 
                  backgroundColor: 'var(--primary-light)', borderRadius: '0.65rem',
                  padding: '0.85rem', marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Room No.</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{task.roomNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Block</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--plum)' }}>{task.block || <span style={{ color: '#B0A0B5', fontStyle: 'italic', fontWeight: 400, fontSize: '0.8rem' }}>Not provided</span>}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Year</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary-dark)' }}>{task.year || <span style={{ color: '#B0A0B5', fontStyle: 'italic', fontWeight: 400, fontSize: '0.8rem' }}>Not provided</span>}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Floor</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{task.floor || <span style={{ color: '#B0A0B5', fontStyle: 'italic', fontWeight: 400, fontSize: '0.8rem' }}>Not provided</span>}</div>
                  </div>
                </div>
                
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
                      style={{ width: '100%', gap: '0.5rem', opacity: resolveImages[task._id] ? 1 : 0.5, cursor: resolveImages[task._id] ? 'pointer' : 'not-allowed' }}
                      disabled={!resolveImages[task._id]}
                      onClick={() => handleResolve(task._id)}
                    >
                      <CheckCircle size={18} /> Mark as Resolved
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
