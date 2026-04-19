import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { LogIn } from 'lucide-react';
import { useUser, useAuth, SignInButton } from '@clerk/clerk-react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    // If Clerk successfully signs them in with Google, register/login them to our local DB!
    const syncClerkToLocal = async () => {
      if (isSignedIn && user) {
        setLoading(true);
        try {
          const email = user.primaryEmailAddress.emailAddress;
          const clerkToken = await getToken();
          
          const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001';
          const { data } = await axios.post(`${baseUrl}/api/auth/google-login`, { 
            email, 
            name: user.fullName,
            clerkToken 
          });

          // Hacky way to inject it directly into the AuthContext locally since it expects a JWT
          localStorage.setItem('user', JSON.stringify(data));
          window.location.href = '/'; // Hard reload to pick up context
        } catch (err) {
          toast.error("Failed to map Google login to local server!");
          setLoading(false);
        }
      }
    };
    syncClerkToLocal();
  }, [isSignedIn, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    if (res.success) {
      toast.success('Logged in successfully');
      navigate('/');
    } else {
      toast.error(res.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '1rem' }}>
            <LogIn size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Sign in to continue to the portal</p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              autoComplete="nope" // "off" is sometimes ignored by browsers
              className="form-input" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Forgot Password?</Link>
            </div>
            <input 
              type="password" 
              autoComplete="new-password" // standard way to prevent password autofill
              className="form-input" 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0' }}>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'var(--bg-secondary)', padding: '0 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>OR</span>
        </div>

        {!isSignedIn && (
          <SignInButton mode="modal">
            <button className="btn" style={{ width: '100%', backgroundColor: 'white', color: '#333', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <img src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA" alt="Google" style={{ width: '18px', height: '18px' }} />
              Continue with Google
            </button>
          </SignInButton>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: 500 }}>Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
