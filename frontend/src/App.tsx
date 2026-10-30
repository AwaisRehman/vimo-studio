import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'

const Home = lazy(() => import('./pages/Home'))
const Studio = lazy(() => import('./pages/Studio'))
const Agent = lazy(() => import('./pages/Agent'))
const Evaluate = lazy(() => import('./pages/Evaluate'))
const HistoryPage = lazy(() => import('./pages/History'))
const Benchmarks = lazy(() => import('./pages/Benchmarks'))
const Settings = lazy(() => import('./pages/Settings'))

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="shimmer h-72 rounded-2xl" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/evaluate" element={<Evaluate />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/benchmarks" element={<Benchmarks />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/playground" element={<Navigate to="/studio" replace />} />
          <Route path="/results" element={<Navigate to="/benchmarks" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
