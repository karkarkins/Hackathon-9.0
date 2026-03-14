import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AIFeedbackPanel from '../components/AIFeedbackPanel'
import ContactRequestModal from '../components/ContactRequestModal'
import RadarChart from '../components/RadarChart'

const STAGE_LABELS = { idea: 'Idea', prototype: 'Prototype', mvp: 'MVP' }

export default function PitchDetail() {
  const { id } = useParams()
  const [pitch, setPitch] = useState(null)
  const [creator, setCreator] = useState(null)
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewerProfiles, setReviewerProfiles] = useState({})
  const [myVote, setMyVote] = useState(null)
  const [myComment, setMyComment] = useState('')
  const [sponsorLikeCount, setSponsorLikeCount] = useState(0)
  const [mySponsorLike, setMySponsorLike] = useState(false)
  const [aiFeedback, setAiFeedback] = useState(null)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: pitchData } = await supabase.from('pitches').select('*').eq('id', id).single()
      if (!pitchData) {
        setLoading(false)
        return
      }
      setPitch(pitchData)

      if (pitchData.creator_id) {
        const { data: creatorData } = await supabase.from('profiles').select('*').eq('id', pitchData.creator_id).single()
        setCreator(creatorData)
      }

      const { data: reviewsData } = await supabase.from('reviews').select('*').eq('pitch_id', id).order('created_at', { ascending: false })
      setReviews(reviewsData || [])
      const reviewerIds = [...new Set((reviewsData || []).map((r) => r.reviewer_id))]
      if (reviewerIds.length) {
        const { data: revProfs } = await supabase.from('profiles').select('id, name').in('id', reviewerIds)
        const byId = {}
        ;(revProfs || []).forEach((p) => { byId[p.id] = p })
        setReviewerProfiles(byId)
      }

      const myReview = (reviewsData || []).find((r) => r.reviewer_id === user.id)
      setMyVote(myReview?.vote ?? null)
      setMyComment(myReview?.comment ?? '')

      const { count: likeCount } = await supabase.from('sponsor_likes').select('*', { count: 'exact', head: true }).eq('pitch_id', id)
      setSponsorLikeCount(likeCount || 0)
      const { data: myLike } = await supabase.from('sponsor_likes').select('id').eq('pitch_id', id).eq('sponsor_id', user.id).maybeSingle()
      setMySponsorLike(!!myLike)

      const { data: aiData } = await supabase.from('ai_feedback').select('*').eq('pitch_id', id).single()
      setAiFeedback(aiData)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleVote(vote) {
    if (!profile || profile.role !== 'reviewer' || !pitch || pitch.creator_id === profile.id) return
    await supabase.from('reviews').upsert(
      { pitch_id: id, reviewer_id: profile.id, vote, comment: myComment || null },
      { onConflict: 'pitch_id,reviewer_id' }
    )
    setMyVote(vote)
    const { data: reviewsData } = await supabase.from('reviews').select('*').eq('pitch_id', id).order('created_at', { ascending: false })
    setReviews(reviewsData || [])
  }

  async function handleSubmitComment() {
    if (!profile || profile.role !== 'reviewer' || !pitch || pitch.creator_id === profile.id) return
    await supabase.from('reviews').upsert(
      { pitch_id: id, reviewer_id: profile.id, vote: myVote || 'neutral', comment: myComment },
      { onConflict: 'pitch_id,reviewer_id' }
    )
    const { data: reviewsData } = await supabase.from('reviews').select('*').eq('pitch_id', id).order('created_at', { ascending: false })
    setReviews(reviewsData || [])
  }

  async function handleSponsorLike() {
    if (!profile || profile.role !== 'sponsor' || !profile.verified || !pitch) return
    if (mySponsorLike) {
      await supabase.from('sponsor_likes').delete().eq('pitch_id', id).eq('sponsor_id', profile.id)
      setMySponsorLike(false)
      setSponsorLikeCount((c) => c - 1)
    } else {
      await supabase.from('sponsor_likes').insert({ pitch_id: id, sponsor_id: profile.id })
      setMySponsorLike(true)
      setSponsorLikeCount((c) => c + 1)
    }
  }

  async function handleToggleStatus() {
    if (!pitch || profile?.id !== pitch.creator_id) return
    const next = pitch.status === 'public' ? 'draft' : 'public'
    await supabase.from('pitches').update({ status: next }).eq('id', id)
    setPitch((p) => ({ ...p, status: next }))
  }

  async function handleDelete() {
    if (!pitch || profile?.id !== pitch.creator_id) return
    if (!window.confirm('Delete this pitch?')) return
    await supabase.from('pitches').delete().eq('id', id)
    window.location.href = '/my-pitches'
  }

  if (loading || !pitch) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-stone-500">
        {loading ? 'Loading…' : 'Pitch not found.'}
      </div>
    )
  }

  const isCreator = profile?.id === pitch.creator_id
  const isReviewer = profile?.role === 'reviewer' && !isCreator
  const isVerifiedSponsor = profile?.role === 'sponsor' && profile?.verified

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-stone-900">{pitch.title}</h1>
          <p className="text-stone-500 mt-1">{pitch.industry} · {STAGE_LABELS[pitch.stage]}</p>
          {pitch.target_demographic && (
            <p className="text-sm text-stone-600 mt-1">Target: {pitch.target_demographic}</p>
          )}
          <div className="mt-4 prose prose-stone max-w-none">
            <p className="whitespace-pre-wrap text-stone-700">{pitch.description}</p>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap gap-4 text-sm text-stone-500">
            <span>👍 {(reviews.filter((r) => r.vote === 'up')).length}</span>
            <span>💬 {reviews.filter((r) => r.comment).length}</span>
            <span>⭐ {sponsorLikeCount}</span>
          </div>

          {/* Reviewer: vote + comment */}
          {isReviewer && (
            <div className="mt-6 pt-6 border-t border-stone-200">
              <p className="text-sm font-medium text-stone-700 mb-2">Your vote</p>
              <div className="flex gap-2 mb-4">
                {['up', 'neutral', 'down'].map((v) => (
                  <button
                    key={v}
                    onClick={() => handleVote(v)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      myVote === v ? 'bg-fish-pond text-white' : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {v === 'up' ? '👍 Up' : v === 'down' ? '👎 Down' : '➖ Neutral'}
                  </button>
                ))}
              </div>
              <div className="mb-2">
                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  placeholder="Add a comment…"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm resize-none"
                  rows={3}
                />
              </div>
              <button
                onClick={handleSubmitComment}
                className="px-4 py-2 bg-fish-pond text-white text-sm rounded-lg hover:bg-fish-deep"
              >
                Submit comment
              </button>
            </div>
          )}

          {/* Sponsor: like + reach out */}
          {profile?.role === 'sponsor' && (
            <div className="mt-6 pt-6 border-t border-stone-200">
              {!profile.verified && (
                <div className="mb-4 px-4 py-2 bg-amber-50 text-amber-800 text-sm rounded-lg">
                  Pending Verification — you can browse until an admin verifies your sponsor account.
                </div>
              )}
              {isVerifiedSponsor && (
                <div className="flex gap-3">
                  <button
                    onClick={handleSponsorLike}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      mySponsorLike ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    ⭐ {mySponsorLike ? 'Liked' : 'Like This Pitch'}
                  </button>
                  <button
                    onClick={() => setContactModalOpen(true)}
                    className="px-4 py-2 bg-fish-pond text-white text-sm rounded-lg hover:bg-fish-deep"
                  >
                    📩 Reach Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Creator: edit, delete, toggle, AI panel */}
          {isCreator && (
            <div className="mt-6 pt-6 border-t border-stone-200">
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={handleToggleStatus}
                  className="px-3 py-1.5 bg-stone-100 text-stone-700 text-sm rounded-lg hover:bg-stone-200"
                >
                  Set {pitch.status === 'public' ? 'Draft' : 'Public'}
                </button>
                <Link
                  to={`/submit?edit=${id}`}
                  className="px-3 py-1.5 bg-stone-100 text-stone-700 text-sm rounded-lg hover:bg-stone-200"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
              {aiFeedback && (
                <AIFeedbackPanel
                  pitchId={id}
                  pitch={pitch}
                  aiFeedback={aiFeedback}
                  onFeedbackUpdate={setAiFeedback}
                />
              )}
            </div>
          )}

          <footer className="mt-8 pt-4 border-t border-stone-100 text-center text-sm text-stone-400">
            Submitted by @{creator?.name || 'Unknown'} on {pitch.created_at ? new Date(pitch.created_at).toLocaleDateString() : ''} | Fish Bowl
          </footer>
        </div>
      </div>

      {/* Comments list (all users) */}
      <div className="mt-6 bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        <h2 className="font-semibold text-stone-800 mb-4">Comments</h2>
        {reviews.filter((r) => r.comment).length === 0 ? (
          <p className="text-stone-500 text-sm">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.filter((r) => r.comment).map((r) => (
              <li key={r.id} className="text-sm border-b border-stone-100 pb-3 last:border-0">
                <Link to={`/reviewer/${r.reviewer_id}`} className="font-medium text-stone-700 hover:text-fish-pond">{reviewerProfiles[r.reviewer_id]?.name || 'Reviewer'}</Link>
                {' '}
                <span className="text-stone-500">({r.vote})</span>
                <p className="text-stone-600 mt-1">{r.comment}</p>
                <p className="text-stone-400 text-xs mt-1">{new Date(r.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {contactModalOpen && (
        <ContactRequestModal
          pitchId={id}
          creatorId={pitch.creator_id}
          onClose={() => setContactModalOpen(false)}
        />
      )}
    </div>
  )
}
