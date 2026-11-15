import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import UpdatePrompt from './components/UpdatePrompt.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { FishMasterProvider } from './context/FishMasterContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <FishMasterProvider>
        <App />
        <UpdatePrompt />
      </FishMasterProvider>
    </AuthProvider>
  </StrictMode>,
)
