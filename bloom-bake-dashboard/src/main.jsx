import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppWrapper from './App.jsx'; // Correctly import the default export 'AppWrapper'

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AppWrapper /> 
  </React.StrictMode>
);