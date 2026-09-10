import React from 'react';
import ReactDOM from 'react-dom/client';
import CloudShell from './components/CloudShell.jsx';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><CloudShell /></React.StrictMode>);
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/kovo/sw.js').catch(error => console.warn('Offline app cache could not initialize:', error.message));
