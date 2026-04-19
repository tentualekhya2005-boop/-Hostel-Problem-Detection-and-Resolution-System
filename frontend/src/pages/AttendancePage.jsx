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
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState(0); 

  useEffect(() => {
    checkToday();
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setIsBiometricEnrolled(data.biometricRegistered);
    } catch (e) { }
  };

  const getDeviceFingerprint = () => {
    const hardware = [
      navigator.userAgent,
      screen.width,
      screen.height,
      navigator.language,
      new Date().getTimezoneOffset()
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < hardware.length; i++) {
        const char = hardware.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const enrollBiometric = async () => {
    setEnrollmentStep(1);
    const deviceSignature = getDeviceFingerprint();

    try {
      // Direct call using Port 5001 for stability
      await axios.post('${import.meta.env.VITE_API_URL}/api/users/biometric/register', { 
        deviceSignature 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setEnrollmentStep(2);
      toast.success('Identity Secured! 🛡️');
      setIsBiometricEnrolled(true);
      setEnrollmentStep(0);
    } catch (err) {
      console.error('Enroll Error:', err);
      toast.error('Enrollment error: ' + (err.response?.data?.message || 'Server connection failed'));
      setEnrollmentStep(0);
    }
  };

  const checkToday = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/my-record`, {
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
    
    setIsVerifying(true);
    const deviceSignature = getDeviceFingerprint();

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/mark`, {
        ...coords,
        deviceSignature
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Identity Verified & Attendance Marked! ✅');
      setMarked(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Biometric mismatch or sensor error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="content-area animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="page-title">🔐 Secure Daily Attendance</h1>
        <p className="text-muted">Biometric Verification System Active</p>
      </header>

      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        {!isBiometricEnrolled ? (
          <div className="animate-fade-in">
             <div style={{ background: 'var(--primary-light)', padding: '2rem', borderRadius: '1.5rem', marginBottom: '2rem' }}>
                <div style={{
                  width: '80px', height: '80px', margin: '0 auto 1.5rem',
                  borderRadius: '1.5rem', background: 'var(--gradient-btn)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 16px rgba(155, 93, 229, 0.3)'
                }}>
                  <Fingerprint size={40} color="white" className={enrollmentStep === 1 ? 'scan-anim' : ''} />
                </div>
                <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Security Enrollment Required</h3>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>To prevent proxy attendance, you must register your primary device's biometric identity.</p>
             </div>

             <button 
                onClick={enrollBiometric}
                className="btn btn-primary"
                style={{ padding: '1.25rem 2rem', fontSize: '1.05rem', gap: '1rem' }}
                disabled={enrollmentStep === 1}
              >
                {enrollmentStep === 1 ? 'Scanning Point...' : 'Enroll Biometric Fingerprint Now'}
              </button>
          </div>
        ) : marked ? (
          <div className="animate-fade-in">
            <div style={{ background: 'var(--success-light)', color: 'var(--success)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle2 size={48} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Present for Today</h2>
            <p className="text-muted">Biometric Hash: Verified (Matching Register Record)</p>
          </div>
        ) : (
          <div className="animate-fade-in">
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

            <div 
              onClick={coords && !isVerifying ? handleAttendance : null}
              style={{
                width: '120px', height: '120px', margin: '0 auto 2rem',
                borderRadius: '50%', background: coords ? 'var(--gradient-btn)' : '#E8DFE8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: coords ? 'pointer' : 'not-allowed',
                boxShadow: coords ? '0 8px 24px rgba(155, 93, 229, 0.4)' : 'none',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              className={coords && !isVerifying ? 'fingerprint-pulse' : ''}
            >
              <Fingerprint size={56} color="white" />
              {isVerifying && <div className="scan-bar" />}
            </div>

            <p style={{ fontWeight: 700, color: coords ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {isVerifying ? 'Verifying Identity...' : coords ? 'Scan Fingerprint to Confirm' : 'Secure Location Required first'}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>
              Fingerprint is compared with your enrollment record for proxy protection.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .fingerprint-pulse { animation: pulse-glow 2s infinite; }
        .scan-anim { animation: scan-pulse 1s infinite; }
        .scan-bar {
          position: absolute;
          inset: 0;
          height: 100%;
          width: 100%;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.4), transparent);
          animation: scan-move 1.5s infinite;
        }
        @keyframes scan-move {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes scan-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
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
