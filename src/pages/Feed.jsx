import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import PitchCard from '../components/PitchCard'

const SORTS = [
  { id: 'liked', label: 'Most Liked' },
  { id: 'reviewed', label: 'Most Reviewed' },
  { id: 'recent', label: 'Most Recent' },
]

export default function Feed() {
  const [pitches, setPitches] = useState([])
  const [profiles, setProfiles] = useState({})
  const [counts, setCounts] = useState({ upvotes: {}, comments: {}, likes: {} })
  const [sort, setSort] = useState('recent')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: pitchesData } = await supabase
        .from('pitches')
        .select('*')
        .eq('status', 'public')
        .order('created_at', { ascending: false })

      setPitches(pitchesData || [])

      const creatorIds = [...new Set((pitchesData || []).map((p) => p.creator_id).filter(Boolean))]
      if (creatorIds.length) {
        const { data: profs } = await supabase.from('profiles').select('id, name').in('id', creatorIds)
        const byId = {}
        ;(profs || []).forEach((p) => { byId[p.id] = p })
        setProfiles(byId)
      }

      const pitchIds = (pitchesData || []).map((p) => p.id)
      if (pitchIds.length) {
        const [reviewsRes, likesRes] = await Promise.all([
          supabase.from('reviews').select('pitch_id, vote').in('pitch_id', pitchIds),
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

  const sorted = [...pitches].sort((a, b) => {
    if (sort === 'recent') return new Date(b.created_at) - new Date(a.created_at)
    if (sort === 'liked') {
      const la = counts.likes[a.id] || 0
      const lb = counts.likes[b.id] || 0
      if (lb !== la) return lb - la
      return (counts.upvotes[b.id] || 0) - (counts.upvotes[a.id] || 0)
    }
    if (sort === 'reviewed') {
      const ca = (counts.comments[a.id] || 0) + (counts.upvotes[a.id] || 0)
      const cb = (counts.comments[b.id] || 0) + (counts.upvotes[b.id] || 0)
      return cb - ca
    }
    return 0
  })

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-500">Loading feed…</div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-fish-pond mb-2">Feed</h1>
      <p className="text-stone-600 mb-6">Start as a little fish, expand into a bigger pond.</p>
      <div className="flex gap-2 mb-6">
        {SORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              sort === s.id ? 'bg-fish-pond text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((pitch) => (
          <PitchCard
            key={pitch.id}
            pitch={pitch}
            creator={profiles[pitch.creator_id]}
            upvotes={counts.upvotes[pitch.id] || 0}
            commentCount={counts.comments[pitch.id] || 0}
            sponsorLikeCount={counts.likes[pitch.id] || 0}
            showSponsorBadge={(counts.likes[pitch.id] || 0) > 0}
          />
        ))}
      </div>
      {sorted.length === 0 && (
        <p className="text-center text-stone-500 py-12">No public pitches yet. Be the first to submit one!</p>
      )}
    </div>
  )
}
