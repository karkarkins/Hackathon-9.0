import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { evaluatePitch } from '../lib/claudeApi'

export default function MyPitches() {
  const [pitches, setPitches] = useState([])
  const [counts, setCounts] = useState({ upvotes: {}, comments: {}, likes: {} })
  const [loading, setLoading] = useState(true)
  const [rerunning, setRerunning] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: pitchesData } = await supabase
        .from('pitches')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
      setPitches(pitchesData || [])
      const pitchIds = (pitchesData || []).map((p) => p.id)
      if (pitchIds.length) {
        const [reviewsRes, likesRes] = await Promise.all([
          supabase.from('reviews').select('pitch_id, vote, comment').in('pitch_id', pitchIds),
          supabase.from('sponsor_likes').select('pitch_id').in('pitch_id', pitchIds),
        ])
        const upvotes = {}
        const comments = {}
        const likes = {}
        pitchIds.forEach((id) => {
          upvotes[id] = (reviewsRes.data || []).filter((r) => r.pitch_id === id && r.vote === 'up').length
          comments[id] = (reviewsRes.data || []).filter((r) => r.pitch_id === id && r.comment).length
          likes[id] = (likesRes.data || []).filter((l) => l.pitch_id === id).length
        })
        setCounts({ upvotes, comments, likes })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleToggleStatus(pitch) {
    const next = pitch.status === 'public' ? 'draft' : 'public'
    await supabase.from('pitches').update({ status: next }).eq('id', pitch.id)
    setPitches((prev) => prev.map((p) => (p.id === pitch.id ? { ...p, status: next } : p)))
  }

  async function handleDelete(pitch) {
    if (!window.confirm('Delete this pitch?')) return
    await supabase.from('pitches').delete().eq('id', pitch.id)
    setPitches((prev) => prev.filter((p) => p.id !== pitch.id))
  }

  async function handleRerunAI(pitch) {
    setRerunning(pitch.id)
    try {
      await evaluatePitch(pitch)
    } catch (e) {
      console.error(e)
      alert('AI evaluation failed')
    }
    setRerunning(null)
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-500">Loading…</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-fish-pond mb-6">My Pitches</h1>
      <div className="space-y-4">
        {pitches.map((pitch) => (
          <div
            key={pitch.id}
            className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <Link to={`/pitch/${pitch.id}`} className="font-semibold text-stone-900 hover:text-fish-pond">
                {pitch.title}
              </Link>
              <div className="flex gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs ${pitch.status === 'public' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'}`}>
                  {pitch.status}
                </span>
              </div>
              <p className="text-sm text-stone-500 mt-2">
                👍 {counts.upvotes[pitch.id] || 0} · 💬 {counts.comments[pitch.id] || 0} · ⭐ {counts.likes[pitch.id] || 0}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/submit?edit=${pitch.id}`}
                className="px-3 py-1.5 bg-stone-100 text-stone-700 text-sm rounded-lg hover:bg-stone-200"
              >
                Edit
              </Link>
              <button
                onClick={() => handleToggleStatus(pitch)}
                className="px-3 py-1.5 bg-stone-100 text-stone-700 text-sm rounded-lg hover:bg-stone-200"
              >
                {pitch.status === 'public' ? 'Set Draft' : 'Set Public'}
              </button>
              <button
                onClick={() => handleRerunAI(pitch)}
                disabled={rerunning === pitch.id}
                className="px-3 py-1.5 bg-fish-foam text-fish-pond text-sm rounded-lg hover:bg-fish-light/50 disabled:opacity-50"
              >
                {rerunning === pitch.id ? 'Running…' : 'Re-run AI'}
              </button>
              <button
                onClick={() => handleDelete(pitch)}
                className="px-3 py-1.5 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {pitches.length === 0 && (
        <p className="text-center text-stone-500 py-12">You haven’t submitted any pitches yet. <Link to="/submit" className="text-fish-pond hover:underline">Submit one</Link>.</p>
      )}
    </div>
  )
}
