import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, UserPlus, AlertTriangle, Calendar, Bell, BarChart3, Download, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  
  // Menu State
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split('T')[0]);
  const [menu, setMenu] = useState({ breakfast: '', lunch: '', snacks: '', dinner: '' });

  // Add Worker State
  const [newWorker, setNewWorker] = useState({ name: '', email: '', password: '', skills: '' });

  // Announcement State
  const [announcement, setAnnouncement] = useState({ title: '', message: '', targetRole: 'all' });

  // Stats State
  const [stats, setStats] = useState({ 
    total: 0, pending: 0, assigned: 0, resolved: 0,
    year1: 0, year2: 0, year3: 0, year4: 0 
  });
  const [attendanceData, setAttendanceData] = useState({ 
    presentCount: 0, totalStudents: 0, presentRecords: [], absentees: [], yearStats: [] 
  });
  const [attendanceSubTab, setAttendanceSubTab] = useState('present'); // 'present' or 'absent'
  const [menuRatings, setMenuRatings] = useState([]);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.toLowerCase().startsWith('http')) return trimmed;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/['"]/g, '').replace(/\/$/, '');
    return `${baseUrl}/${trimmed.replace(/^\//, '')}`;
  };

  useEffect(() => {
    fetchComplaints();
    fetchStats();
    fetchWorkers();
    fetchMenuRatings();
    if (location.pathname === '/attendance-report') {
      fetchAttendance();
    }
  }, [location.pathname]);

  const fetchMenuRatings = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/ratings/today`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMenuRatings(data);
    } catch (e) { console.log('No ratings yet'); }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/attendance/daily-report`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAttendanceData(data);
    } catch (e) {
      toast.error('Failed to load attendance report');
    }
  };

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

  const cardStats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    assigned: complaints.filter(c => c.status === 'Assigned').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    needsVerification: complaints.filter(c => c.status === 'Needs Verification').length
  };

  const categoryData = complaints.reduce((acc, comp) => {
    const cat = comp.category ? comp.category.charAt(0).toUpperCase() + comp.category.slice(1) : 'Other';
    const existing = acc.find(item => item.name === cat);
    if (existing) existing.value += 1;
    else acc.push({ name: cat, value: 1 });
    return acc;
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ef4444'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">{location.pathname === '/attendance-report' ? 'Attendance Report' : 'Admin Dashboard'}</h1>
        {location.pathname !== '/attendance-report' && (
          <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Download size={20} /> Export Report to PDF
          </button>
        )}
      </div>

      {location.pathname === '/attendance-report' ? (
        <div className="animate-fade-in">
          {/* Year-wise summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {(attendanceData.yearStats || []).map(stat => (
              <div key={stat.year} className="card" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid var(--primary)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{stat.year}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  {stat.present} <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500 }}>/ {stat.total}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: `${(stat.present / (stat.total || 1)) * 100}%`, height: '100%', background: 'var(--gradient-btn)' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                    onClick={() => setAttendanceSubTab('present')}
                    className={`btn ${attendanceSubTab === 'present' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '0.75rem', padding: '0.6rem 1.5rem' }}
                >
                    ✅ Present Sheet
                </button>
                <button 
                    onClick={() => setAttendanceSubTab('absent')}
                    className={`btn ${attendanceSubTab === 'absent' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ 
                        borderRadius: '0.75rem', padding: '0.6rem 1.5rem',
                        background: attendanceSubTab === 'absent' ? '#ef4444' : '',
                        color: attendanceSubTab === 'absent' ? 'white' : ''
                    }}
                >
                    ❌ Absent Sheet
                </button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{attendanceData.date}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800 }}>Overall: {attendanceData.presentCount} / {attendanceData.totalStudents}</div>
              </div>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  {attendanceSubTab === 'present' ? (
                    <tr>
                      <th>Student Name</th>
                      <th>Room / Block</th>
                      <th>Year</th>
                      <th>Check-in Time</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Student Name</th>
                      <th>Room / Block</th>
                      <th>Year</th>
                      <th>Contact Email</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {attendanceSubTab === 'present' ? (
                    (attendanceData.presentRecords || []).length > 0 ? (
                      attendanceData.presentRecords.map((r) => (
                        <tr key={r._id}>
                          <td><div style={{ fontWeight: 700 }}>{r.studentId?.name}</div></td>
                          <td>{r.studentId?.roomNumber} / {r.studentId?.block}</td>
                          <td>{r.studentId?.year}</td>
                          <td><div className="badge badge-resolved" style={{fontSize:'0.7rem'}}>{new Date(r.timestamp).toLocaleTimeString()}</div></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>No present students recorded yet today.</td></tr>
                    )
                  ) : (
                    (attendanceData.absentees || []).length > 0 ? (
                      attendanceData.absentees.map((s) => (
                        <tr key={s._id}>
                          <td><div style={{ fontWeight: 700, color: '#ef4444' }}>{s.name}</div></td>
                          <td>{s.roomNumber} / {s.block}</td>
                          <td>{s.year}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.email}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>All students have marked attendance! ✅</td></tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
      <div id="report-content" style={{ padding: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #4F46E5', background: 'white' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Total Complaints</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4F46E5' }}>{cardStats.total}</div>
          </div>
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #F59E0B', background: 'white' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Pending Actions</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B' }}>{cardStats.pending}</div>
          </div>
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #06B6D4', background: 'white' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>In Progress</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#06B6D4' }}>{cardStats.assigned}</div>
          </div>
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #F472B6', background: 'white' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Needs Verification</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F472B6' }}>{cardStats.needsVerification}</div>
          </div>
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10B981', background: 'white' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Closed / Resolved</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981' }}>{cardStats.resolved}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* Complaint Analytics */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 600, fontSize: '1.25rem' }}>
              <PieChartIcon size={24} color="var(--primary)" /> Complaint Analytics
            </div>
            <div style={{ width: '100%', height: 300 }}>
              {complaints.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>No complaints recorded yet.</p>
              )}
            </div>
          </div>

          {/* Menu Ratings Analytics */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '1.25rem' }}>
                <BarChart3 size={24} color="var(--secondary)" /> Menu Satisfaction Score (%)
              </div>
              <button 
                onClick={() => window.location.href='/reports'} 
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '8px' }}
              >
                View Weekly Reports &rarr;
              </button>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              {menuRatings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={menuRatings} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} unit="%" />
                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9B5DE5" />
                        <stop offset="100%" stopColor="#F15BB5" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>
                  <p>No student ratings for today yet.</p>
                  <p style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>Averages will appear once students rate meals.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
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
                  <th style={{ padding: '0.75rem' }}>Student</th>
                  <th style={{ padding: '0.75rem' }}>Room No.</th>
                  <th style={{ padding: '0.75rem' }}>Block</th>
                  <th style={{ padding: '0.75rem' }}>Floor</th>
                  <th style={{ padding: '0.75rem' }}>Year</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem' }}>Photos</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Action / Assignment</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, maxWidth: '130px' }}>{c.title}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 500 }}>{c.studentId?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.studentId?.email || ''}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem' }}>
                        {c.roomNumber || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {c.block
                        ? <span style={{ fontWeight: 600, color: 'var(--plum)', fontSize: '0.85rem' }}>{c.block}</span>
                        : <span style={{ fontSize: '0.75rem', color: '#B0A0B5', fontStyle: 'italic' }}>Not provided</span>
                      }
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {c.floor
                        ? <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{c.floor}</span>
                        : <span style={{ fontSize: '0.75rem', color: '#B0A0B5', fontStyle: 'italic' }}>Not provided</span>
                      }
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {c.year
                        ? <span style={{ fontSize: '0.8rem', background: 'var(--secondary-light)', color: 'var(--secondary-dark)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>{c.year}</span>
                        : <span style={{ fontSize: '0.75rem', color: '#B0A0B5', fontStyle: 'italic' }}>Not provided</span>
                      }
                    </td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{c.category}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {c.imageUrl && (
                        <div style={{ marginBottom: '0.25rem' }}>
                          <a href={getFullImageUrl(c.imageUrl)} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.75rem', color:'var(--primary)'}}>📸 Issue Photo</a>
                        </div>
                      )}
                      {c.resolvedImageUrl && (
                        <div style={{ position: 'relative' }}>
                          <a href={getFullImageUrl(c.resolvedImageUrl)} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.75rem', color:'var(--success)', fontWeight: 600}}>✅ Resolved Photo</a>
                          {c.isSuspicious && (
                            <div title={c.suspicionReason} style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              marginLeft: '8px', padding: '2px 8px', borderRadius: '4px',
                              backgroundColor: '#fee2e2', color: '#ef4444', fontSize: '0.65rem',
                              fontWeight: 800, border: '1px solid #fecaca', cursor: 'help'
                            }}>
                              ⚠️ SUSPICIOUS
                            </div>
                          )}
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
      )}
    </div>
  );
};

export default AdminDashboard;
