import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const VOTE_LABELS = { up: '👍 Up', down: '👎 Down', neutral: '➖ Neutral' }

export default function ReviewerProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [pitches, setPitches] = useState({})

  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).single()
      setProfile(prof)
      if (!prof) return
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', id)
        .order('created_at', { ascending: false })
      setReviews(reviewsData || [])
      const pitchIds = [...new Set((reviewsData || []).map((r) => r.pitch_id))]
      if (pitchIds.length) {
        const { data: pitchesData } = await supabase.from('pitches').select('*').in('id', pitchIds)
        const byId = {}
        ;(pitchesData || []).forEach((p) => { byId[p.id] = p })
        setPitches(byId)
      }
    }
    load()
  }, [id])

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-stone-500">Loading…</div>
    )
  }

  if (profile.role !== 'reviewer') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-stone-500">Not a reviewer profile.</div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-stone-900">{profile.name || 'Reviewer'}</h1>
        {profile.university && (
          <p className="text-stone-600 mt-1">{profile.university}</p>
        )}
        <p className="text-stone-500 text-sm mt-2">Total pitches reviewed: {reviews.length}</p>
      </div>
      <h2 className="font-semibold text-stone-800 mb-4">Pitches reviewed</h2>
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="bg-white rounded-lg border border-stone-200 p-4">
            <Link to={`/pitch/${r.pitch_id}`} className="font-medium text-fish-pond hover:underline">
              {pitches[r.pitch_id]?.title || 'Pitch'}
            </Link>
            <span className="ml-2 text-sm text-stone-500">— {VOTE_LABELS[r.vote] || r.vote}</span>
            {r.comment && (
              <p className="text-sm text-stone-600 mt-1 line-clamp-2">{r.comment}</p>
            )}
          </li>
        ))}
      </ul>
      {reviews.length === 0 && (
        <p className="text-stone-500 text-sm">No reviews yet.</p>
      )}
    </div>
  )
}
