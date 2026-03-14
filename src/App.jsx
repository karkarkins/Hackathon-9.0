import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Feed from './pages/Feed'
import PitchDetail from './pages/PitchDetail'
import SubmitPitch from './pages/SubmitPitch'
import MyPitches from './pages/MyPitches'
import ReviewerProfile from './pages/ReviewerProfile'
import AdminKnowledge from './pages/AdminKnowledge'
import AdminSponsors from './pages/AdminSponsors'

function ProtectedRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getInitial = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
        setProfile(p)
      }
      setLoading(false)
    }
    getInitial()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(p)
      } else {
        setProfile(null)
      }
    })
    return () => subscription?.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-fish-pond">Loading…</p>
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PublicLayout><Feed /></PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pitch/:id"
        element={
          <ProtectedRoute>
            <PublicLayout><PitchDetail /></PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/submit"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <PublicLayout><SubmitPitch /></PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-pitches"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <PublicLayout><MyPitches /></PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/:id"
        element={
          <ProtectedRoute>
            <PublicLayout><ReviewerProfile /></PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/admin/knowledge" element={<PublicLayout><AdminKnowledge /></PublicLayout>} />
      <Route path="/admin/sponsors" element={<PublicLayout><AdminSponsors /></PublicLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export { ProtectedRoute, PublicLayout }
