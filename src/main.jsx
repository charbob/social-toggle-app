import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import './index.css';

console.log('main.jsx is loading...');

try {
  const rootElement = document.getElementById('root');
  console.log('Root element found:', rootElement);
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    console.log('React root created');
    
    root.render(
      <React.StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>
    );
    console.log('React app rendered');
  } else {
    console.error('Root element not found!');
  }
} catch (error) {
  console.error('Error loading React app:', error);
  document.getElementById('root').innerHTML = `
    <h1>Error Loading App</h1>
    <p>There was an error loading the React application.</p>
    <pre>${error.message}</pre>
  `;
}
