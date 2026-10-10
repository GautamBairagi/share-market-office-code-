import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { MarketProvider } from './context/MarketContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MarketProvider>
          <App />
        </MarketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
