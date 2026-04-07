import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, UserPlus, AlertTriangle, Calendar, Bell, BarChart3, Download, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  // Hostel Stats State
  const [stats, setStats] = useState({ year1: 0, year2: 0, year3: 0, year4: 0 });

  const getFullImageUrl = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.toLowerCase().startsWith('http')) return trimmed;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/['"]/g, '').replace(/\/$/, '');
    return `${baseUrl}/${trimmed.replace(/^\//, '')}`;
  };

  useEffect(() => {
    fetchComplaints();
    fetchWorkers();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stats`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStats(data);
    } catch (error) { console.log('Failed to load stats'); }
  };

  const fetchComplaints = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/all`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setComplaints(data);
    } catch (error) { toast.error('Failed to load complaints'); }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/workers`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setWorkers(data);
    } catch (error) { console.log('Failed to load workers') }
  };

  const handleAssignWorker = async (complaintId, workerId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/${complaintId}/assign`, { workerId }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Worker assigned!');
      fetchComplaints();
    } catch (error) { toast.error('Failed to assign worker'); }
  };

  const handleAdminAction = async (id, action) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/${id}/admin-resolve`, { action }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success(action === 'Resolve' ? 'Complaint finalized and closed!' : 'Re-assigned to worker.');
      fetchComplaints();
    } catch (error) { toast.error('Admin action failed'); }
  };

  const handleAdminDelete = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this complaint from all dashboards?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/admin/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Complaint permanently deleted');
      fetchComplaints();
    } catch (error) { toast.error('Failed to delete complaint'); }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu`, { date: menuDate, ...menu }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Menu updated successfully');
      setMenu({ breakfast: '', lunch: '', snacks: '', dinner: '' });
    } catch (error) { toast.error('Failed to update menu'); }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/worker`, 
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
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/announcements/broadcast`, announcement, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Announcement broadcasted successfully');
      setAnnouncement({ title: '', message: '', targetRole: 'all' });
    } catch (error) { 
      toast.error('Failed to broadcast announcement'); 
    }
  };

  const handleStatsSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stats`, stats, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Hostel occupancy stats updated successfully');
    } catch (error) { toast.error('Failed to update stats'); }
  };

  const generatePDF = async () => {
    const input = document.getElementById('report-content');
    if (!input) return;
    try {
      toast.info('Generating PDF Report...', { autoClose: 1000 });
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.body.classList.contains('dark-theme');
      const canvas = await html2canvas(input, { 
        scale: 4, 
        useCORS: true,
        backgroundColor: isDark ? '#0f172a' : '#f8fafc' 
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFontSize(18);
      pdf.text('Hostel Problem Detection & Notification System', 10, 10);
      pdf.setFontSize(12);
      pdf.text(`Official Executive Report - generated on ${new Date().toLocaleDateString()}`, 10, 18);
      
      pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);
      pdf.save(`Hostel_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Downloaded successfully!');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  const categoryData = complaints.reduce((acc, comp) => {
    const cat = comp.category ? comp.category.charAt(0).toUpperCase() + comp.category.slice(1) : 'Other';
    const existing = acc.find(item => item.name === cat);
    if (existing) existing.value += 1;
    else acc.push({ name: cat, value: 1 });
    return acc;
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ef4444'];

  const generateInsights = () => {
    if (complaints.length === 0) return ["No data available for insights."];
    const insights = [];
    
    const rooms = complaints.reduce((acc, c) => { acc[c.roomNumber] = (acc[c.roomNumber] || 0) + 1; return acc; }, {});
    const mostCommonRoom = Object.keys(rooms).reduce((a, b) => rooms[a] > rooms[b] ? a : b, '');
    if (mostCommonRoom && rooms[mostCommonRoom] > 1) {
      insights.push(`🔥 Most issues reported from Room ${mostCommonRoom} (${rooms[mostCommonRoom]} complaints)`);
    }

    const delayedCount = complaints.filter(c => c.isDelayed && c.status === 'Delayed').length;
    if (delayedCount > 0) insights.push(`⚠️ ${delayedCount} tasks have exceeded their SLA limits (Delayed).`);

    const highSev = complaints.filter(c => c.severity === 'High' && c.status !== 'Resolved').length;
    if (highSev > 0) insights.push(`🚨 ${highSev} High Severity complaints require immediate attention.`);

    return insights.length ? insights : ["All systems operating normally. No critical issues detected."];
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Overview of all hostel operations</p>
        </div>
        <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderRadius: '2rem' }}>
          <Download size={20} /> Export Report
        </button>
      </div>

      <div id="report-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Admin AI Insights Panel */}
      <div className="card card-gradient" style={{ border: 'none', borderRadius: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontWeight: 600, fontSize: '1.25rem', color: 'white' }}>
          ✨ AI System Insights
        </div>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          {generateInsights().map((insight, i) => (
             <li key={i} style={{ fontSize: '1.1rem' }}>{insight}</li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Visual Analytics Widget */}
        <div className="card" style={{ gridColumn: '1 / -1', border: 'none', borderRadius: '1.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '1.25rem' }}>
              <PieChartIcon size={24} color="var(--primary)" /> Complaint Analytics
            </div>
            <div className="segmented-control">
              <div className="segment-item active">This Week</div>
              <div className="segment-item">This Month</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
            {complaints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>No complaints recorded yet.</p>
            )}
          </div>
        </div>
        
        {/* Manage Complaints Widget */}
        <div className="card" style={{ gridColumn: '1 / -1', border: 'none', borderRadius: '1.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '2rem 2rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 600, fontSize: '1.25rem' }}>
            <AlertTriangle size={24} color="var(--primary)" /> All Complaints
          </div>
          
          <div style={{ overflowX: 'auto', padding: '0 2rem 2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Title</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Student / Room</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Category</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Photos</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Status</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Action / Assignment</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                       {c.title}
                       <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          {c.severity && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: c.severity === 'High' ? '#fee2e2' : c.severity === 'Low' ? '#f0fdf4' : '#fff7ed', color: c.severity === 'High' ? '#ef4444' : c.severity === 'Low' ? '#22c55e' : '#f97316' }}>{c.severity}</span>}
                          {c.isDelayed && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>SLA BREACHED</span>}
                       </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{c.studentId?.name} ({c.roomNumber})</td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{c.category}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {c.imageUrl && (
                        <div style={{ marginBottom: '0.25rem' }}>
                          <a href={getFullImageUrl(c.imageUrl)} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.75rem', color:'var(--primary)'}}>📸 Issue Photo</a>
                        </div>
                      )}
                      {c.resolvedImageUrl && (
                        <div>
                          <a href={getFullImageUrl(c.resolvedImageUrl)} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.75rem', color:'var(--success)'}}>✅ Resolved Photo</a>
                        </div>
                      )}
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

        {/* Update Hostel Occupancy Stats Widget */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 600, fontSize: '1.25rem' }}>
            <BarChart3 size={24} color="var(--primary)" /> Update Hostel Occupancy
          </div>
          <form onSubmit={handleStatsSubmit}>
            <div className="form-group">
              <label className="form-label">1st Year Students (Occupied / Capacity)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" className="form-input" min="0" placeholder="Occupied" value={stats.year1} onChange={(e) => setStats({...stats, year1: Number(e.target.value)})} required />
                <span style={{ display: 'flex', alignItems: 'center' }}>/</span>
                <input type="number" className="form-input" min="0" placeholder="Capacity" value={stats.year1Total} onChange={(e) => setStats({...stats, year1Total: Number(e.target.value)})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">2nd Year Students (Occupied / Capacity)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" className="form-input" min="0" placeholder="Occupied" value={stats.year2} onChange={(e) => setStats({...stats, year2: Number(e.target.value)})} required />
                <span style={{ display: 'flex', alignItems: 'center' }}>/</span>
                <input type="number" className="form-input" min="0" placeholder="Capacity" value={stats.year2Total} onChange={(e) => setStats({...stats, year2Total: Number(e.target.value)})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">3rd Year Students (Occupied / Capacity)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" className="form-input" min="0" placeholder="Occupied" value={stats.year3} onChange={(e) => setStats({...stats, year3: Number(e.target.value)})} required />
                <span style={{ display: 'flex', alignItems: 'center' }}>/</span>
                <input type="number" className="form-input" min="0" placeholder="Capacity" value={stats.year3Total} onChange={(e) => setStats({...stats, year3Total: Number(e.target.value)})} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">4th Year Students (Occupied / Capacity)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" className="form-input" min="0" placeholder="Occupied" value={stats.year4} onChange={(e) => setStats({...stats, year4: Number(e.target.value)})} required />
                <span style={{ display: 'flex', alignItems: 'center' }}>/</span>
                <input type="number" className="form-input" min="0" placeholder="Capacity" value={stats.year4Total} onChange={(e) => setStats({...stats, year4Total: Number(e.target.value)})} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Stats</button>
          </form>
        </div>

        {/* Send Announcement Widget */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 600, fontSize: '1.25rem' }}>
            <Bell size={24} color="var(--primary)" /> Send Announcement
          </div>
          <form onSubmit={handleSendAnnouncement}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
    </div>
  );
};

export default AdminDashboard;
