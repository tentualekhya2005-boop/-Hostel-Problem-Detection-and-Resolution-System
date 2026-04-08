import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Wrench, CheckCircle, Trash2, Clock } from 'lucide-react';

const WorkerDashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
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
      formData.append('image', resolveImages[id]);
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/${id}/resolve`, formData, {
        headers: { Authorization: `Bearer ${user.token}` }
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
      toast.success('Task removed');
      fetchTasks();
    } catch (error) { toast.error('Failed to remove task'); }
  };

  const renderTaskCard = (task) => (
    <div key={task._id} className="card animate-fade-in" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Rm {task.roomNumber}</span>
      </div>
      
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{task.title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{task.description}</p>
      </div>

      <div style={{ background: 'var(--primary-light)', borderRadius: '12px', padding: '0.75rem', fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div><span style={{color:'var(--text-muted)'}}>Block:</span> <strong>{task.block || 'N/A'}</strong></div>
        <div><span style={{color:'var(--text-muted)'}}>Floor:</span> <strong>{task.floor || 'N/A'}</strong></div>
      </div>

      {task.imageUrl && <a href={getFullImageUrl(task.imageUrl)} target="_blank" rel="noopener noreferrer" style={{fontSize: '0.8rem'}}>View Student Photo</a>}
      
      {task.status === 'Assigned' && (
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <input type="file" className="form-input" onChange={(e) => handleImageChange(task._id, e.target.files[0])} style={{fontSize: '0.75rem', padding: '0.4rem'}} />
          <button className="btn btn-primary" onClick={() => handleResolve(task._id)} disabled={!resolveImages[task._id]} style={{width: '100%', opacity: resolveImages[task._id] ? 1 : 0.6}}>
            <CheckCircle size={18} /> Resolve Task
          </button>
        </div>
      )}

      {task.status !== 'Assigned' && (
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <span className="text-success" style={{fontSize: '0.8rem', fontWeight: 700}}>✅ Completed</span>
          <button onClick={() => handleDelete(task._id)} style={{color: '#ef4444', background: 'none', border:'none', cursor:'pointer'}}><Trash2 size={16}/></button>
        </div>
      )}
    </div>
  );

  const filteredTasks = () => {
    if (location.pathname === '/worker-tasks/pending') return tasks.filter(t => t.status === 'Assigned');
    if (location.pathname === '/worker-tasks/resolved') return tasks.filter(t => t.status === 'Resolved' || t.status === 'Needs Verification');
    return tasks;
  };

  const renderContent = () => {
    const currentTasks = filteredTasks();

    return (
      <div className="grid-responsive">
        {currentTasks.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
            <Clock size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
            <p className="text-muted">No tasks found in this section.</p>
          </div>
        ) : (
          currentTasks.map(renderTaskCard)
        )}
      </div>
    );
  };

  return (
    <div>
      <h1 className="page-title" style={{ textTransform: 'capitalize' }}>
        {location.pathname === '/' ? 'Worker Dashboard' : location.pathname.split('/').pop().replace(/-/g, ' ')}
      </h1>
      {renderContent()}
    </div>
  );
};

export default WorkerDashboard;
