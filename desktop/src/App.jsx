import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp }   from './context/AppContext'
import Sidebar      from './components/Sidebar'
import LoginPage    from './pages/LoginPage'
import Dashboard    from './pages/Dashboard'
import PatientsPage from './pages/PatientsPage'
import AnalysisPage from './pages/AnalysisPage'
import ReportsPage  from './pages/ReportsPage'

function Shell() {
  const { isAuthenticated, loading } = useAuth()
  const { page } = useApp()

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--navy)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'3px solid rgba(255,255,255,.1)', borderTop:'3px solid #0d9488', borderRadius:'50%', animation:'spin .75s linear infinite', margin:'0 auto 1rem' }}/>
        <div style={{ color:'rgba(255,255,255,.4)', fontSize:'.85rem' }}>Loading DivulgeAI…</div>
      </div>
    </div>
  )

  if (!isAuthenticated) return <LoginPage />

  const PAGES = {
    dashboard:     <Dashboard />,
    patients:      <PatientsPage />,
    analysis:      <AnalysisPage />,
    reports:       <ReportsPage />,
    'report-detail': <ReportsPage />,
  }

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
      <Sidebar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--light)' }}>
        {PAGES[page] || <Dashboard />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
          <Shell />
        </div>
      </AppProvider>
    </AuthProvider>
  )
}
