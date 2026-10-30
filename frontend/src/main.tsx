import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
import { AppStateProvider } from './state/AppState.tsx'
import { ToastProvider } from './state/Toasts.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppStateProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppStateProvider>
    </BrowserRouter>
  </StrictMode>,
)
