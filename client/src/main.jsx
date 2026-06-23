import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './auth.jsx';
import App from './App.jsx';
import './index.css';

// Single source of truth for the Google Client ID is the server's .env (exposed via /api/config).
// Falls back to a Vite env var if you prefer to set it client-side.
async function bootstrap() {
  let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  try {
    const cfg = await fetch('/api/config').then((r) => r.json());
    if (cfg.googleClientId) clientId = cfg.googleClientId;
  } catch { /* API not reachable yet; render anyway */ }

  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={clientId || 'not-configured'}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
}
bootstrap();
