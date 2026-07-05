
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Unregister any active service workers to prevent api route interception and PWA routing issues
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Successfully unregistered active service worker to fix API routing:', registration);
          window.location.reload();
        }
      });
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        className: '',
        style: {
          background: '#334155',
          color: '#fff',
        },
      }}
    />
  </React.StrictMode>
);
