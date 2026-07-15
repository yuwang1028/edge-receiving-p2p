import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// P2P-only demo: land directly on the cockpit (the dual-product EntryLogin and
// the O2C workforce live in the upstream ip-p2p; here we sign straight into P2P).
// Sign out still returns to the login screen.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App startSignedIn />
  </StrictMode>,
)
