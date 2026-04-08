import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { AlertCircle, Calendar, PlusCircle, Megaphone, BarChart3, Heart, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StudentDashboard = () => {
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
    <div>
      <h1 className="page-title">{t('dashboard')}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', fontSize: '0.8rem' }}>
                {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => (
                  <div key={meal} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.15)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', opacity: 0.9 }}>{meal}</div>
                    
                    {(menu[meal] || '').split(',').map((item, idx, arr) => {
                      const itemName = item.trim();
                      if (!itemName) return null;
                      
                      const itemRatingObj = (myRatings?.itemRatings || []).find(ir => ir.itemName === itemName);
                      const currentRating = itemRatingObj ? itemRatingObj.rating : (myRatings?.[meal] || 0);

                      return (
                        <div key={idx} style={{ borderBottom: idx < arr.length - 1 ? '1px dashed rgba(255,255,255,0.2)' : 'none', paddingBottom: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{itemName}</span>
                            <Heart 
                              size={14} 
                              style={{ cursor: 'pointer', fill: userFavorites.includes(itemName) ? 'white' : 'transparent', transition: 'all 0.2s' }}
                              onClick={() => toggleFavorite(itemName)}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1,2,3,4,5].map(star => (
                              <Star 
                                key={star} 
                                size={12} 
                                fill={star <= currentRating ? '#FFD700' : 'transparent'}
                                stroke={star <= currentRating ? '#FFD700' : 'rgba(255,255,255,0.4)'}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleRate(meal, star, itemName)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <p>Menu has not been updated for today.</p>
            )}
          </div>

          {/* Announcements Widget */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white', border: 'none', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontWeight: 600, fontSize: '1.25rem' }}>
              <Megaphone size={24} /> {t('announcements') || 'Notice Board'}
            </div>
            {announcements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {announcements.map((ann, idx) => (
                  <div key={idx} style={{ 
                    padding: '1rem', 
                    backgroundColor: idx === 0 ? 'rgba(255, 255, 255, 0.2)' : 'transparent', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    borderRadius: '0.5rem' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{ann.title}</div>
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann._id)}
                        style={{ background: 'rgba(239, 68, 68, 0.8)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{ann.message}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ opacity: 0.8, fontSize: '0.875rem' }}>No new announcements.</p>
            )}
          </div>

          {/* Hostel Occupancy Widget */}
          {stats && (
             <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white', border: 'none', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontWeight: 600, fontSize: '1.25rem' }}>
                 <BarChart3 size={24} /> B.Tech Students in Hostel
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.15)', borderRadius: '0.5rem' }}>
                   <span>1st Year Students:</span> <strong>{stats.year1} out of {stats.year1Total || 0}</strong>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.15)', borderRadius: '0.5rem' }}>
                   <span>2nd Year Students:</span> <strong>{stats.year2} out of {stats.year2Total || 0}</strong>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.15)', borderRadius: '0.5rem' }}>
                   <span>3rd Year Students:</span> <strong>{stats.year3} out of {stats.year3Total || 0}</strong>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.15)', borderRadius: '0.5rem' }}>
                   <span>4th Year Students:</span> <strong>{stats.year4} out of {stats.year4Total || 0}</strong>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.3)', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                   <strong>Total Students:</strong> <strong>{stats.year1 + stats.year2 + stats.year3 + stats.year4} out of {(stats.year1Total||0) + (stats.year2Total||0) + (stats.year3Total||0) + (stats.year4Total||0)}</strong>
                 </div>
               </div>
             </div>
          )}

        </div>
      </div>

      {/* Recent Complaints Widget (Full Width) */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.25rem' }}>
          <AlertCircle size={24} /> {t('recent_complaints')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {complaints.length === 0 ? (
                <p className="text-muted">No complaints submitted yet.</p>
              ) : (
                complaints.slice(0, 6).map((comp, idx) => (
                  <div key={comp._id} style={{ 
                    display: 'flex', flexDirection: 'column', padding: '1.25rem', 
                    border: idx === 0 ? '2px solid var(--primary)' : '1px solid var(--border)', 
                    borderRadius: '0.75rem', 
                    backgroundColor: idx === 0 ? '#f0f9ff' : 'var(--glass-bg)', 
                    height: '100%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{comp.title}</strong>
                      <span className={`badge badge-${comp.status.toLowerCase()}`}>{comp.status}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{comp.description}</p>
                    
                    {comp.imageUrl && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>📸 Your Original Issue Photo:</strong>
                        <img 
                          src={getFullImageUrl(comp.imageUrl)} 
                          alt="Issue" 
                          style={{ width: '100%', maxWidth: '200px', borderRadius: '0.5rem', border: '1px solid var(--border)' }} 
                        />
                      </div>
                    )}

                    {comp.resolvedImageUrl && ['Needs Verification', 'Student Verified', 'Student Rejected', 'Resolved'].includes(comp.status) && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--success)', marginBottom: '0.5rem' }}>✅ Worker's Resolution Photo:</strong>
                        <img 
                          src={getFullImageUrl(comp.resolvedImageUrl)} 
                          alt="Resolution Proof" 
                          style={{ width: '100%', maxWidth: '200px', borderRadius: '0.5rem', border: '1px solid var(--border)' }} 
                        />
                      </div>
                    )}

                    {comp.status === 'Needs Verification' && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                        <p style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: 500, marginBottom: '0.5rem' }}>Has this problem been fixed?</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', flex: 1 }}
                            onClick={() => handleVerify(comp._id, true)}
                          >
                            Yes
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', flex: 1, backgroundColor: '#fecaca', color: '#991b1b', border: 'none' }}
                            onClick={() => handleVerify(comp._id, false)}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(comp.createdAt).toLocaleDateString()}
                        </div>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #f87171' }}
                          onClick={() => handleDelete(comp._id)}
                        >
                          Delete
                        </button>
                      </div>
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
