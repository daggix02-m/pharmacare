import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// DIAGNOSTIC: Check for service worker registration
if ('serviceWorker' in navigator) {
  console.log('[SERVICE WORKER] Service Worker API is available');
  
  // Check for existing service worker registrations
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    console.log('[SERVICE WORKER] Active registrations:', registrations.length);
    registrations.forEach((registration) => {
      console.log('[SERVICE WORKER] Registration:', {
        scope: registration.scope,
        active: registration.active?.state,
        waiting: registration.waiting?.state,
        installing: registration.installing?.state,
      });
    });
    
    // FIX: Unregister stale service workers to prevent PWA errors
    if (registrations.length > 0) {
      console.log('[SERVICE WORKER] Unregistering stale service workers...');
      const unregisterPromises = registrations.map((registration) => {
        return registration.unregister().then((success) => {
          console.log('[SERVICE WORKER] Unregistered:', registration.scope, success ? 'Success' : 'Failed');
          return success;
        });
      });
      
      Promise.all(unregisterPromises).then((results) => {
        const successCount = results.filter(Boolean).length;
        console.log('[SERVICE WORKER] Unregistered', successCount, 'of', registrations.length, 'service workers');
      });
    }
  }).catch((error) => {
    console.error('[SERVICE WORKER] Error getting registrations:', error);
  });

  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[SERVICE WORKER] Message received:', event.data);
  });
} else {
  console.log('[SERVICE WORKER] Service Worker API is NOT available');
}

// DIAGNOSTIC: Check for PWA manifest
if ('manifest' in document.documentElement) {
  console.log('[PWA] Manifest link found:', document.documentElement.getAttribute('manifest'));
} else {
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    console.log('[PWA] Manifest link found:', manifestLink.href);
  } else {
    console.log('[PWA] No manifest link found in document');
  }
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
