import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const getInitial = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
        setProfile(p)
      }
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

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'
  const role = profile?.role

  return (
    <nav className="bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 text-fish-pond font-bold text-lg">
          <span className="text-xl">🐟</span>
          Fish Bowl
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/" className="text-stone-600 hover:text-fish-pond text-sm font-medium">Feed</Link>
              {role === 'creator' && (
                <>
                  <Link to="/my-pitches" className="text-stone-600 hover:text-fish-pond text-sm font-medium">My Pitches</Link>
                  <Link to="/submit" className="text-stone-600 hover:text-fish-pond text-sm font-medium">Submit Pitch</Link>
                </>
              )}
              <div className="border-l border-stone-200 pl-4 flex items-center gap-3">
                <span className="text-stone-600 text-sm">
                  {displayName}
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-fish-foam text-fish-pond capitalize">{role}</span>
                  {role === 'sponsor' && !profile?.verified && (
                    <span className="ml-1 text-amber-600 text-xs">(Pending)</span>
                  )}
                </span>
                <Link to="/admin/knowledge" className="text-xs text-stone-400 hover:text-stone-600">Knowledge</Link>
                <Link to="/admin/sponsors" className="text-xs text-stone-400 hover:text-stone-600">Sponsors</Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-stone-600 hover:text-red-600"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-stone-600 hover:text-fish-pond text-sm font-medium">Login</Link>
              <Link to="/signup" className="text-fish-pond hover:underline text-sm font-medium">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
