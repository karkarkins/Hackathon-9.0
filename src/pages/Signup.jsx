import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const ROLES = [
  { value: 'creator', label: 'Creator' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'sponsor', label: 'Sponsor' },
]

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('creator')
  const [company, setCompany] = useState('')
  const [university, setUniversity] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }
    if (authData?.user) {
      await supabase.from('profiles').upsert(
        {
          id: authData.user.id,
          name: name || email.split('@')[0],
          role,
          company: role === 'sponsor' ? company : null,
          university: role === 'reviewer' ? university : null,
          verified: false,
        },
        { onConflict: 'id' }
      )
    }
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fish-foam to-fish-light/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-fish-light/50">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-fish-pond">Fish Bowl</h1>
          <p className="text-stone-600 text-sm mt-1">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-fish-deep focus:border-fish-deep"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-fish-deep focus:border-fish-deep"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-fish-deep focus:border-fish-deep"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-fish-deep focus:border-fish-deep"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {role === 'sponsor' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Company (optional)</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-fish-deep focus:border-fish-deep"
                placeholder="Your company"
              />
            </div>
          )}
          {role === 'reviewer' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">University (optional)</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-fish-deep focus:border-fish-deep"
                placeholder="Your university"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-fish-pond text-white font-medium rounded-lg hover:bg-fish-deep disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="text-center text-stone-600 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-fish-pond font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
