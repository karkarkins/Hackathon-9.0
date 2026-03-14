import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AdminSponsors() {
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'sponsor').order('created_at', { ascending: false })
      setSponsors(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function verify(id) {
    await supabase.from('profiles').update({ verified: true }).eq('id', id)
    setSponsors((prev) => prev.map((p) => (p.id === id ? { ...p, verified: true } : p)))
  }

  const unverified = sponsors.filter((s) => !s.verified)
  const verified = sponsors.filter((s) => s.verified)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-fish-pond mb-2">Sponsor Verification</h1>
      <p className="text-stone-600 mb-6">Verify sponsor accounts so they can like pitches and reach out to creators.</p>
      {loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : (
        <div className="space-y-6">
          {unverified.length > 0 && (
            <div>
              <h2 className="font-semibold text-stone-800 mb-3">Pending verification</h2>
              <ul className="space-y-2">
                {unverified.map((s) => (
                  <li key={s.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-lg p-4">
                    <div>
                      <p className="font-medium">{s.name || 'No name'}</p>
                      <p className="text-sm text-stone-500">{s.company || '—'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => verify(s.id)}
                      className="px-4 py-2 bg-fish-pond text-white text-sm rounded-lg hover:bg-fish-deep"
                    >
                      Verify
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h2 className="font-semibold text-stone-800 mb-3">All sponsors</h2>
            <ul className="space-y-2">
              {sponsors.map((s) => (
                <li key={s.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-lg p-4">
                  <div>
                    <p className="font-medium">{s.name || 'No name'}</p>
                    <p className="text-sm text-stone-500">{s.company || '—'}</p>
                  </div>
                  {s.verified ? (
                    <span className="text-green-600 text-sm">✓ Verified</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => verify(s.id)}
                      className="px-4 py-2 bg-stone-100 text-stone-700 text-sm rounded-lg hover:bg-stone-200"
                    >
                      Verify
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {!loading && sponsors.length === 0 && (
        <p className="text-stone-500">No sponsor accounts yet.</p>
      )}
    </div>
  )
}
