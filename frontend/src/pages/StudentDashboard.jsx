import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { AlertCircle, Calendar, PlusCircle, Megaphone, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [menu, setMenu] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  
  // New Complaint Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('electrical');
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stats`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStats(data);
    } catch (error) { console.log('Failed to load stats'); }
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
      toast.error(`Delete failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported in your browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => {
      toast.error('Error capturing voice');
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
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
      setImage(null);
      fetchMyComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ marginBottom: '2rem' }}>
         <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Good Morning, {user?.name ? user.name.split(' ')[0] : 'Student'}!</h1>
         <p style={{ color: 'var(--text-muted)' }}>Here's a quick look at your day.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Submit Complaint Box */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '1.25rem' }}>
            <PlusCircle size={24} /> {t('submit_complaint')}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('title')}</label>
              <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('category')}</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="carpentry">Carpentry</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>{t('description')}</label>
                <button type="button" onClick={handleVoiceInput} style={{ background: 'transparent', border: 'none', color: isRecording ? 'red' : 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                  🎤 {isRecording ? 'Recording...' : 'Voice Input'}
                </button>
              </div>
              <textarea className="form-textarea" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Attached Image (Optional)</label>
              <input type="file" className="form-input" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : t('submit')}
            </button>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                <div><strong>Breakfast:</strong> <br/>{menu.breakfast}</div>
                <div><strong>Lunch:</strong> <br/>{menu.lunch}</div>
                <div><strong>Snacks:</strong> <br/>{menu.snacks}</div>
                <div><strong>Dinner:</strong> <br/>{menu.dinner}</div>
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

          {/* Student Analytics & Gamification Widget */}
          <div className="card card-gradient" style={{ border: 'none', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.25rem', color: 'white' }}>
               <BarChart3 size={24} /> My Analytics & Badges
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'white' }}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '1.25rem', borderRadius: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{complaints.length}</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>Total Reports</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '1.25rem', borderRadius: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{complaints.filter(c => ['Student Verified', 'Resolved'].includes(c.status)).length}</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>Resolved</div>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Unlocked Badges:</span>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {complaints.length >= 5 ? <span style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>🏆 Active Reporter</span> : <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Report {5 - complaints.length} more issues to get a badge!</span>}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Recent Complaints Widget - Redesigned to match Screenshot 1 */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.25rem' }}>
            <AlertCircle size={24} /> {t('recent_complaints')}
          </div>
          <div className="segmented-control">
            <div className="segment-item active">All Tasks</div>
            <div className="segment-item">Pending</div>
            <div className="segment-item">Resolved</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {complaints.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                   No complaints submitted yet. Add one above!
                </div>
              ) : (
                complaints.map((comp, idx) => (
                  <div key={comp._id} className="card" style={{ 
                    display: 'flex', flexDirection: 'column', padding: '1.25rem 1.5rem',
                    border: 'none',
                    borderRadius: '1.25rem',
                    marginBottom: 0
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '10px', 
                          background: comp.severity === 'High' ? 'var(--danger-light)' : 'var(--warning-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: comp.severity === 'High' ? 'var(--danger)' : 'var(--warning)'
                        }}>
                          ≡
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem', display: 'block' }}>{comp.title}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{comp.category}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {comp.severity && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: comp.severity === 'High' ? 'var(--danger)' : comp.severity === 'Low' ? 'var(--success)' : 'var(--warning)' }}>{comp.severity}</span>}
                        <span className={`badge badge-${comp.status.replace(/\s+/g, '-').toLowerCase()}`}>{comp.status}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{comp.description}</p>
                    {comp.isDelayed && <p style={{ fontSize: '0.75rem', color: 'red', fontWeight: 'bold' }}>⚠️ Delayed past SLA limits</p>}
                    
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
                    
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', paddingLeft: '56px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(comp.createdAt).toLocaleDateString()}
                        </div>
                        <button 
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                          onClick={() => handleDelete(comp._id)}
                        >
                          Clear Complaint ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
        </div>
      </div>

      {/* Floating Pill Nav for Mobile Impression (Image 1) */}
      <div style={{ position: 'fixed', bottom: '2rem', left: '0', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
        <div className="floating-pill" style={{ pointerEvents: 'auto' }}>
           <div className="floating-pill-item"><span style={{fontSize:'1.2rem'}}>⊞</span></div>
           <div className="floating-pill-item active" style={{background: 'var(--primary)'}}><span style={{fontSize:'1.2rem'}}>🛡️</span></div>
           <div className="floating-pill-item"><span style={{fontSize:'1.2rem'}}>📁</span></div>
           <div className="floating-pill-item"><span style={{fontSize:'1.2rem'}}>👤</span></div>
        </div>
      </div>

    </div>
  );
}

export default StudentDashboard;
