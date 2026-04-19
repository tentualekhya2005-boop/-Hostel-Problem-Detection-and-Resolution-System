import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'

import { ClerkProvider } from '@clerk/clerk-react'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const RootApp = () => {
  if (!PUBLISHABLE_KEY) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>
        <h2>⚠️ Configuration Error</h2>
        <p>VITE_CLERK_PUBLISHABLE_KEY is missing from your Vercel Dashboard Environment Variables!</p>
        <p>Go to Vercel Settings → Environment Variables, add the key, and re-deploy.</p>
      </div>
    );
  }

  return (
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </StrictMode>
  );
};

createRoot(document.getElementById('root')).render(<RootApp />);
