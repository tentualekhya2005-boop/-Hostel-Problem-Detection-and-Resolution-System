import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Wrench, CheckCircle, Trash2, Clock, Calendar, Fingerprint } from 'lucide-react';

const WorkerDashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [resolveImages, setResolveImages] = useState({});
  const [menu, setMenu] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.toLowerCase().startsWith('http')) return trimmed;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/['"]/g, '').replace(/\/$/, '');
    return `${baseUrl}/${trimmed.replace(/^\//, '')}`;
  };

  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    fetchTasks();
    if (location.pathname === '/worker-menu') fetchMenu();
    if (location.pathname === '/worker-attendance') fetchAttendance();
    if (location.pathname === '/worker-ratings') fetchRatings();
  }, [location.pathname]);

  const fetchRatings = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/ratings/today`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRatings(data);
    } catch (error) { console.log('Ratings not found'); }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/worker`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTasks(data);
    } catch (error) { toast.error('Failed to load tasks'); }
  };

  const fetchMenu = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/${today}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMenu(data);
    } catch (error) { console.log('Menu not found'); }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/attendance/daily-report`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAttendanceStats(data);
    } catch (error) { console.log('Attendance not found'); }
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
    if (location.pathname === '/worker-menu') {
      return (
        <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>
            <Calendar size={24} /> Today's Hostel Menu
          </div>
          {menu ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => (
                <div key={meal} style={{ padding: '1rem', background: '#F9F5FF', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.25rem' }}>{meal}</div>
                  <div style={{ fontWeight: 600 }}>{menu[meal]}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">Menu hasn't been updated for today yet.</p>
          )}
        </div>
      );
    }

    if (location.pathname === '/worker-attendance') {
      return (
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>
            <Fingerprint size={24} /> Student Attendance Summary
          </div>
          {attendanceStats ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)' }}>{attendanceStats.presentCount}</div>
              <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Students Present Today</div>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Out of total <strong>{attendanceStats.totalStudents}</strong> students</div>
            </div>
          ) : (
            <p className="text-muted">Attendance data not available yet.</p>
          )}
        </div>
      );
    }

    if (location.pathname === '/worker-ratings') {
      return (
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>
            <Wrench size={24} /> Food Item Satisfaction
          </div>
          {ratings.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {ratings.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F9FAFB', borderRadius: '12px' }}>
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100px', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${r.value}%`, height: '100%', background: 'var(--gradient-btn)' }} />
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', minWidth: '40px' }}>{r.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No food ratings recorded today.</p>
          )}
        </div>
      );
    }

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
