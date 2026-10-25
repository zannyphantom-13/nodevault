import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initRuntimeGuards } from './services/security'

// Initialize Anti-Clickjacking & Runtime Integrity Guards
initRuntimeGuards();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
