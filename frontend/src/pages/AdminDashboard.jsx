import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, UserPlus, AlertTriangle, Calendar, Bell } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  
  // Menu State
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split('T')[0]);
  const [menu, setMenu] = useState({ breakfast: '', lunch: '', snacks: '', dinner: '' });

  // Add Worker State
  const [newWorker, setNewWorker] = useState({ name: '', email: '', password: '', skills: '' });

  // Announcement State
  const [announcement, setAnnouncement] = useState({ title: '', message: '', targetRole: 'all' });

  useEffect(() => {
    fetchComplaints();
    fetchWorkers();
  }, []);

  const fetchComplaints = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/complaints/all', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setComplaints(data);
    } catch (error) { toast.error('Failed to load complaints'); }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/users/workers', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setWorkers(data);
    } catch (error) { console.log('Failed to load workers') }
  };

  const handleAssignWorker = async (complaintId, workerId) => {
    try {
      await axios.put(`http://localhost:5000/api/complaints/${complaintId}/assign`, { workerId }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Worker assigned!');
      fetchComplaints();
    } catch (error) { toast.error('Failed to assign worker'); }
  };

  const handleAdminAction = async (id, action) => {
    try {
      await axios.put(`http://localhost:5000/api/complaints/${id}/admin-resolve`, { action }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success(action === 'Resolve' ? 'Complaint finalized and closed!' : 'Re-assigned to worker.');
      fetchComplaints();
    } catch (error) { toast.error('Admin action failed'); }
  };

  const handleAdminDelete = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this complaint from all dashboards?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/complaints/admin/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Complaint permanently deleted');
      fetchComplaints();
    } catch (error) { toast.error('Failed to delete complaint'); }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/menu', { date: menuDate, ...menu }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Menu updated successfully');
      setMenu({ breakfast: '', lunch: '', snacks: '', dinner: '' });
    } catch (error) { toast.error('Failed to update menu'); }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/worker', 
        { ...newWorker, skills: newWorker.skills.split(',').map(s=>s.trim()) }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Worker registered successfully');
      setNewWorker({ name: '', email: '', password: '', skills: '' });
      fetchWorkers();
    } catch (error) { toast.error('Failed to register worker'); }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/announcements/broadcast', announcement, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Announcement broadcasted successfully');
      setAnnouncement({ title: '', message: '', targetRole: 'all' });
    } catch (error) { 
      toast.error('Failed to broadcast announcement'); 
    }
  };

  return (
    <div>
      <h1 className="page-title">Admin Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Manage Complaints Widget */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 600, fontSize: '1.25rem' }}>
            <AlertTriangle size={24} color="var(--primary)" /> All Complaints
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Title</th>
                  <th style={{ padding: '0.75rem' }}>Student / Room</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem' }}>Photos</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Action / Assignment</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{c.title}</td>
                    <td style={{ padding: '0.75rem' }}>{c.studentId?.name} ({c.roomNumber})</td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{c.category}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {c.imageUrl && <div style={{ marginBottom: '0.25rem' }}><a href={`http://localhost:5000${c.imageUrl}`} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.75rem', color:'var(--primary)'}}>📸 Issue Photo</a></div>}
                      {c.resolvedImageUrl && <div><a href={`http://localhost:5000${c.resolvedImageUrl}`} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.75rem', color:'var(--success)'}}>✅ Resolved Photo</a></div>}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${c.status.toLowerCase().replace(/ /g, '-')}`} style={{ textAlign: 'center' }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                        {c.status === 'Pending' ? (
                          <select className="form-select" style={{ padding: '0.25rem' }} value={c.assignedWorkerId?._id || ''} onChange={(e) => handleAssignWorker(c._id, e.target.value)}>
                            <option value="">Select Worker...</option>
                            {workers.map(w => (
                              <option key={w._id} value={w._id}>{w.name} ({w.skills?.join(', ')})</option>
                            ))}
                          </select>
                        ) : c.status === 'Assigned' ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Assigned to {c.assignedWorkerId?.name}</span>
                        ) : c.status === 'Resolved' ? (
                          <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Finalized</span>
                        ) : (
                          <>
                             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned to {c.assignedWorkerId?.name}</span>
                             <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleAdminAction(c._id, 'Resolve')}>✅ Finalize Resolution</button>
                             <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#fecaca', color: '#991b1b', border: 'none' }} onClick={() => handleAdminAction(c._id, 'Reassign')}>❌ Reassign to Worker</button>
                          </>
                        )}
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #f87171', marginTop: 'auto' }} onClick={() => handleAdminDelete(c._id)}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Menu Widget */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 600, fontSize: '1.25rem' }}>
            <Calendar size={24} color="var(--primary)" /> Update Daily Menu
          </div>
          <form onSubmit={handleMenuSubmit}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={menuDate} onChange={(e) => setMenuDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Breakfast</label>
              <input type="text" className="form-input" value={menu.breakfast} onChange={(e) => setMenu({...menu, breakfast: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Lunch</label>
              <input type="text" className="form-input" value={menu.lunch} onChange={(e) => setMenu({...menu, lunch: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Snacks</label>
              <input type="text" className="form-input" value={menu.snacks} onChange={(e) => setMenu({...menu, snacks: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Dinner</label>
              <input type="text" className="form-input" value={menu.dinner} onChange={(e) => setMenu({...menu, dinner: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Menu</button>
          </form>
        </div>

        {/* Register Worker Widget */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 600, fontSize: '1.25rem' }}>
            <UserPlus size={24} color="var(--primary)" /> Register New Worker
          </div>
          <form onSubmit={handleAddWorker} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-input" value={newWorker.name} onChange={e=>setNewWorker({...newWorker, name: e.target.value})} required autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={newWorker.email} onChange={e=>setNewWorker({...newWorker, email: e.target.value})} required autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={newWorker.password} onChange={e=>setNewWorker({...newWorker, password: e.target.value})} required minLength={6} autoComplete="new-password" />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Skills (comma separated)</label>
              <input type="text" className="form-input" value={newWorker.skills} onChange={e=>setNewWorker({...newWorker, skills: e.target.value})} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register Worker</button>
          </form>
        </div>

        {/* Send Announcement Widget */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 600, fontSize: '1.25rem' }}>
            <Bell size={24} color="var(--primary)" /> Send Announcement
          </div>
          <form onSubmit={handleSendAnnouncement}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Target Audience</label>
                <select className="form-select" value={announcement.targetRole} onChange={(e) => setAnnouncement({...announcement, targetRole: e.target.value})} required>
                  <option value="all">Every User (All Roles)</option>
                  <option value="student">Students</option>
                  <option value="worker">Workers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Announcement Title</label>
                <input type="text" className="form-input" value={announcement.title} onChange={(e) => setAnnouncement({...announcement, title: e.target.value})} required placeholder="E.g., System Maintenance" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Message Details</label>
              <textarea className="form-textarea" value={announcement.message} onChange={(e) => setAnnouncement({...announcement, message: e.target.value})} required rows="3" placeholder="Write your announcement message here..."></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Send Notification 🚀</button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
