import React from 'react';
import ReactDOM from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App from './App';
import './index.css';
import { installGlobalErrorHandlers } from './lib/monitor';

installGlobalErrorHandlers();
inject();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
