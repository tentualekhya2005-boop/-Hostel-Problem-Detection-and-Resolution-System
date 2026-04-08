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
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="page-title">{filterStatus ? `${filterStatus} Complaints` : 'Student Dashboard'}</h1>
        <p className="text-muted">{filterStatus ? `View all your ${filterStatus.toLowerCase()} issues.` : 'Welcome back to your hostel portal.'}</p>
      </header>

      {!filterStatus && (
        <div className="grid-responsive" style={{ marginBottom: '2rem' }}>
          {/* Submit Complaint Box */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '1.25rem' }}>
              <PlusCircle size={24} /> {t('submit_complaint')}
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
                <textarea className="form-textarea" rows="3" placeholder="Describe the issue in detail..." value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Attached Image (Optional)</label>
                <input type="file" className="form-input" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{t('submit')}</button>
            </form>
          </div>

          {/* Right side widgets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Menu Widget */}
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontWeight: 600, fontSize: '1.25rem' }}>
                <Calendar size={24} /> {t('todays_menu')}
              </div>
              {menu ? (
                <div className="grid-responsive" style={{ gap: '1rem', fontSize: '0.8rem' }}>
                  {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => (
                    <div key={meal} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.15)', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', opacity: 0.9, letterSpacing: '0.05em' }}>{meal}</div>
                      {(menu[meal] || '').split(',').map((item, idx, arr) => {
                        const itemName = item.trim();
                        if (!itemName) return null;
                        const itemRatingObj = (myRatings?.itemRatings || []).find(ir => ir.itemName === itemName);
                        const currentRating = itemRatingObj ? itemRatingObj.rating : (myRatings?.[meal] || 0);
                        return (
                          <div key={idx} style={{ borderBottom: idx < arr.length - 1 ? '1px dashed rgba(255,255,255,0.2)' : 'none', paddingBottom: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{itemName}</span>
                              <Grid size={14} style={{ cursor: 'pointer', color: userFavorites.includes(itemName) ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }} onClick={() => toggleFavorite(itemName)} />
                            </div>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[1,2,3,4,5].map(star => (
                                <Star key={star} size={12} fill={star <= currentRating ? '#FFD700' : 'transparent'} stroke={star <= currentRating ? '#FFD700' : 'rgba(255,255,255,0.4)'} style={{ cursor: 'pointer' }} onClick={() => handleRate(meal, star, itemName)} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : <p>Menu has not been updated.</p>}
            </div>

            {/* Announcements Widget */}
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontWeight: 600, fontSize: '1.25rem' }}>
                <Megaphone size={24} /> {t('announcements')}
              </div>
              {announcements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {announcements.map((ann, idx) => (
                    <div key={idx} style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '0.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{ann.title}</div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{ann.message}</div>
                    </div>
                  ))}
                </div>
              ) : <p>No announcements.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="card" style={{ marginTop: filterStatus ? '0' : '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.25rem' }}>
          <AlertCircle size={24} /> {filterStatus ? `${filterStatus} Complaints` : 'Recent Complaints'}
        </div>
        <div className="grid-responsive">
          {complaints.filter(c => {
            if (!filterStatus) return true;
            if (filterStatus === 'Pending') return c.status === 'Pending';
            if (filterStatus === 'Assigned') return c.status === 'Assigned';
            if (filterStatus === 'Resolved') return ['Resolved', 'Student Verified', 'Needs Verification', 'Student Rejected'].includes(c.status);
            return c.status === filterStatus;
          }).length === 0 ? (
            <p className="text-muted">No {filterStatus?.toLowerCase() || ''} complaints found.</p>
          ) : (
            complaints.filter(c => {
              if (!filterStatus) return true;
              if (filterStatus === 'Pending') return c.status === 'Pending';
              if (filterStatus === 'Assigned') return c.status === 'Assigned';
              if (filterStatus === 'Resolved') return ['Resolved', 'Student Verified', 'Needs Verification', 'Student Rejected'].includes(c.status);
              return c.status === filterStatus;
            }).slice(0, filterStatus ? 100 : 6).map((comp) => (
              <div key={comp._id} className="complaint-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--text-main)' }}>{comp.title}</strong>
                  <span className={`badge badge-${comp.status.toLowerCase().replace(/ /g, '-')}`}>{comp.status}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{comp.description}</p>
                {comp.imageUrl && <div style={{ marginTop: '0.75rem' }}><img src={getFullImageUrl(comp.imageUrl)} alt="Issue" style={{ width: '100%', maxWidth: '200px', borderRadius: '0.5rem' }} /></div>}
                
                {comp.status === 'Needs Verification' && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Has this problem been fixed?</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', flex: 1 }} onClick={() => handleVerify(comp._id, true)}>Yes</button>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', flex: 1 }} onClick={() => handleVerify(comp._id, false)}>No</button>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(comp.createdAt).toLocaleDateString()}</span>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#ef4444' }} onClick={() => handleDelete(comp._id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
