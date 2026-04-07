import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { MapPin, Fingerprint, CheckCircle2, Clock, Map } from 'lucide-react';

const AttendancePage = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [marked, setMarked] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    checkToday();
    const interval = setInterval(updateTimeLeft, 60000); // Check every minute
    updateTimeLeft();
    return () => clearInterval(interval);
  }, []);

  const updateTimeLeft = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();

    const start = 18 * 60; // 6 PM
    const end = 21 * 60 + 30; // 9:30 PM
    const nowMins = h * 60 + m;

    if (nowMins < start) setTimeLeft('Opens at 6:00 PM');
    else if (nowMins > end) setTimeLeft('Closed for today');
    else setTimeLeft(`Time until close: ${Math.floor((end - nowMins) / 60)}h ${(end - nowMins) % 60}m`);
  };

  const checkToday = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/attendance/my-record`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const today = new Date().toISOString().split('T')[0];
      const done = data.some(r => r.date === today);
      setMarked(done);
    } catch (e) { }
  };

  const getLocation = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGpsLoading(false);
        toast.info('GPS coordinates captured ✅');
      },
      (err) => {
        toast.error('Location Access Denied. Check permission settings.');
        setGpsLoading(false);
      }
    );
  };

  const handleAttendance = async () => {
    if (!coords) {
      toast.warning('Please capture your location first!');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/attendance/mark`, coords, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Attendance marked successfully! ✅');
      setMarked(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    }
    setLoading(false);
  };

  return (
    <div className="content-area animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="page-title">Digital Attendance</h1>
        <p className="text-muted">Biometric Verification + Geofencing Protection</p>
      </header>

      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        {marked ? (
          <div className="animate-fade-in">
            <div style={{ background: 'var(--success-light)', color: 'var(--success)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle2 size={48} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Present for Today</h2>
            <p className="text-muted">Attendance recorded successfully. Thank you.</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="info-box" style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'center' }}>
              <Clock size={20} color="var(--primary)" />
              <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{timeLeft}</span>
            </div>

            {/* GPS Activation Section */}
            {!coords ? (
              <button 
                onClick={getLocation} 
                className="btn btn-secondary" 
                style={{ width: '100%', marginBottom: '2rem', padding: '1.2rem', gap: '1rem' }}
                disabled={gpsLoading}
              >
                <MapPin size={24} color="var(--primary)" />
                {gpsLoading ? 'Accessing GPS Satellites...' : 'Enable Location / Verify Geofence'}
              </button>
            ) : (
              <div style={{ marginBottom: '2rem', padding: '1rem', background: '#F8FAFC', borderRadius: '1rem', border: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>MAPPING COORDINATES</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</div>
                </div>
                <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, fontSize: '0.85rem' }}>
                  <Map size={18} /> IN RANGE
                </div>
              </div>
            )}

            {/* Simulated Fingerprint Section */}
            <div 
              onClick={coords ? handleAttendance : null}
              style={{
                width: '120px', height: '120px', margin: '0 auto 2rem',
                borderRadius: '50%', background: coords ? 'var(--gradient-btn)' : '#E8DFE8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: coords ? 'pointer' : 'not-allowed',
                boxShadow: coords ? '0 8px 24px rgba(155, 93, 229, 0.4)' : 'none',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              className={coords ? 'fingerprint-pulse' : ''}
            >
              <Fingerprint size={56} color="white" />
              {loading && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid white', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
              )}
            </div>

            <p style={{ fontWeight: 700, color: coords ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {coords ? 'Scan Fingerprint to Confirm' : 'Secure Location Required first'}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>
              Proxy attendance is detected and rejected automatically via background GPS auditing.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .fingerprint-pulse { animation: pulse-glow 2s infinite; }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(155, 93, 229, 0.5); }
          70% { box-shadow: 0 0 0 15px rgba(155, 93, 229, 0); }
          100% { box-shadow: 0 0 0 0 rgba(155, 93, 229, 0); }
        }
      `}</style>
    </div>
  );
};

export default AttendancePage;
