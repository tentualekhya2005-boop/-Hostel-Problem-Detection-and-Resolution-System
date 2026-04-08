import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { AlertCircle, Calendar, PlusCircle, Megaphone, BarChart3, Star, Grid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StudentDashboard = ({ filterStatus }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [menu, setMenu] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  const [userFavorites, setUserFavorites] = useState([]);
  const [myRatings, setMyRatings] = useState({});
  
  // New Complaint Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('electrical');
  const [year, setYear] = useState('1st Year');
  const [block, setBlock] = useState('Nagavalli');
  const [floor, setFloor] = useState('');
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.toLowerCase().startsWith('http')) return trimmed;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/['"]/g, '').replace(/\/$/, '');
    return `${baseUrl}/${trimmed.replace(/^\//, '')}`;
  };

  useEffect(() => {
    fetchTodayMenu();
    fetchMyComplaints();
    fetchAnnouncements();
    fetchStats();
    fetchUserFavorites();
    fetchMyTodayRating();
  }, []);

  const fetchMyTodayRating = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/my-rating/${today}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMyRatings(data);
    } catch (e) { }
  };

  const handleRate = async (meal, rating, itemName) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/rate`, { date: today, meal, rating, itemName }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      const newRatings = myRatings ? { ...myRatings } : {};
      const items = [...(newRatings.itemRatings || [])];
      const idx = items.findIndex(i => i.itemName === itemName);
      if (idx > -1) items[idx].rating = rating;
      else items.push({ itemName, category: meal, rating });
      newRatings.itemRatings = items;
      newRatings[meal] = rating;

      setMyRatings(newRatings);
      toast.success(`${itemName} rated ${rating}★`, { position: 'bottom-right' });
    } catch (e) { toast.error("Rating failed"); }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/announcements`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAnnouncements(data);
    } catch (error) {
       console.log("No announcements found");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Announcement deleted');
      setAnnouncements(prev => prev.filter(a => a._id !== id));
    } catch (error) { toast.error('Failed to delete announcement'); }
  };

  const fetchTodayMenu = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/today`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMenu(data);
    } catch (error) {
       console.log("No menu found for today");
    }
  };

  const toggleFavorite = async (item) => {
    if (!item) return;
    try {
      const { data } = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/favorites`, { item }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUserFavorites(data);
      const isNowFav = data.includes(item);
      toast.info(isNowFav ? `${item} added to Favourites!` : `${item} removed`, { 
        icon: isNowFav ? "❤️" : "🗑️",
        position: 'bottom-right' 
      });
    } catch (e) { toast.error("Action failed"); }
  };

  const fetchUserFavorites = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUserFavorites(data.favorites || []);
    } catch (e) {
      console.log("Failed to load favorites");
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

  const fetchMyComplaints = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/student`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setComplaints(data);
    } catch (error) {
      toast.error('Failed to load complaints');
    }
  };

  const handleVerify = async (id, isResolved) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/${id}/verify-resolution`, { isResolved }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success(isResolved ? 'Confirmed as resolved!' : 'Sent back to worker!');
      fetchMyComplaints();
    } catch (error) { toast.error('Failed to verify task status'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Complaint deleted successfully');
      fetchMyComplaints();
    } catch (error) {
      toast.error('Failed to delete complaint');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('year', year);
    formData.append('block', block);
    formData.append('floor', floor);
    if (image) formData.append('image', image);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/complaints`, formData, {
        headers: { 
          Authorization: `Bearer ${user.token}`
        }
      });
      toast.success('Complaint submitted successfully');
      setTitle('');
      setDescription('');
      setYear('1st Year');
      setBlock('Nagavalli');
      setFloor('');
      setImage(null);
      fetchMyComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {filterStatus ? (
            <>
              <AlertCircle size={28} color="var(--primary)" />
              {filterStatus} Complaints
            </>
          ) : (
            <>
              <PlusCircle size={32} color="var(--primary)" />
              Raise a New Complaint
            </>
          )}
        </h1>
        <p className="text-muted">
          {filterStatus 
            ? `Viewing your ${filterStatus.toLowerCase()} issues and their progress.` 
            : 'Fill out the form below to report a problem in your hostel room or floor.'}
        </p>
      </header>

      {!filterStatus ? (
        /* ─── RAISE COMPLAINT FORM (PRIMARY VIEW) ─── */
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem' }}>
              <PlusCircle size={22} /> Tell us what's wrong
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('title')}</label>
                <input type="text" className="form-input" placeholder="e.g. Fan not working" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="grid-responsive" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('category')}</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="electrical">⚡ Electrical</option>
                    <option value="plumbing">🔧 Plumbing</option>
                    <option value="carpentry">🪵 Carpentry</option>
                    <option value="cleaning">🧹 Cleaning</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Year</label>
                  <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid-responsive" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Block / Hostel</label>
                  <select className="form-select" value={block} onChange={(e) => setBlock(e.target.value)}>
                    <option value="Nagavalli">🏢 Nagavalli</option>
                    <option value="Vamsadara">🏢 Vamsadara</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Floor Number</label>
                  <select className="form-select" value={floor} onChange={(e) => setFloor(e.target.value)}>
                    <option value="">-- Select Floor --</option>
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('description')}</label>
                <textarea className="form-textarea" rows="4" placeholder="Describe the issue in detail..." value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Attached Image (Optional)</label>
                <div style={{ 
                  border: '2px dashed var(--border)', 
                  borderRadius: '12px', 
                  padding: '1rem', 
                  textAlign: 'center',
                  background: 'var(--bg-main)'
                }}>
                  <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} style={{ width: '100%', fontSize: '0.85rem' }} />
                  {image && <p style={{ marginTop: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem' }}>✓ File selected: {image.name}</p>}
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={submitting}>
                {submitting ? 'Submitting...' : '🚀 ' + t('submit')}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ─── COMPLAINTS LIST (FILTERED VIEW) ─── */
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontWeight: 700, fontSize: '1.2rem' }}>
            <AlertCircle size={22} color="var(--primary)" /> {filterStatus} History
          </div>
          <div className="grid-responsive">
            {complaints.filter(c => {
              if (filterStatus === 'Pending') return c.status === 'Pending';
              if (filterStatus === 'Assigned') return c.status === 'Assigned';
              if (filterStatus === 'Resolved') return ['Resolved', 'Student Verified', 'Needs Verification', 'Student Rejected'].includes(c.status);
              return c.status === filterStatus;
            }).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                <p className="text-muted">No {filterStatus?.toLowerCase()} complaints found.</p>
              </div>
            ) : (
              complaints.filter(c => {
                if (filterStatus === 'Pending') return c.status === 'Pending';
                if (filterStatus === 'Assigned') return c.status === 'Assigned';
                if (filterStatus === 'Resolved') return ['Resolved', 'Student Verified', 'Needs Verification', 'Student Rejected'].includes(c.status);
                return c.status === filterStatus;
              }).map((comp) => (
                <div key={comp._id} className="complaint-card" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{comp.title}</strong>
                    <span className={`badge badge-${comp.status.toLowerCase().replace(/ /g, '-')}`}>{comp.status}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{comp.description}</p>
                  
                  {comp.imageUrl && (
                    <div style={{ marginBottom: '1rem' }}>
                      <a href={getFullImageUrl(comp.imageUrl)} target="_blank" rel="noopener noreferrer">
                        <img src={getFullImageUrl(comp.imageUrl)} alt="Issue" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '0.75rem', border: '2px solid var(--border)' }} />
                      </a>
                    </div>
                  )}
                  
                  {comp.status === 'Needs Verification' && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.75rem', border: '1px solid var(--primary-light)' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary-dark)' }}>Maintenance worker marked this as fixed. Is it resolved?</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', flex: 1, fontSize: '0.85rem' }} onClick={() => handleVerify(comp._id, true)}>✅ Yes</button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', flex: 1, fontSize: '0.85rem' }} onClick={() => handleVerify(comp._id, false)}>❌ No</button>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                       <Calendar size={14} /> {new Date(comp.createdAt).toLocaleDateString()}
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fee2e2' }} 
                      onClick={() => handleDelete(comp._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
