import { Link } from 'react-router-dom'

export default function PitchCard({ pitch, creator, upvotes = 0, commentCount = 0, sponsorLikeCount = 0, showSponsorBadge }) {
  const stageLabels = { idea: 'Idea', prototype: 'Prototype', mvp: 'MVP' }
  return (
    <Link
      to={`/pitch/${pitch.id}`}
      className="block bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-fish-light/50 transition-all p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-stone-900 flex-1 line-clamp-2">{pitch.title}</h3>
        {showSponsorBadge && (
          <span className="shrink-0 text-amber-600 text-xs font-medium whitespace-nowrap">Sponsor Interest ⭐</span>
        )}
      </div>
      <p className="text-sm text-stone-500 mt-1">{pitch.industry}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="px-2 py-0.5 rounded-full text-xs bg-fish-foam text-fish-pond">
          {stageLabels[pitch.stage] || pitch.stage}
        </span>
      </div>
      {creator && (
        <p className="text-sm text-stone-600 mt-2">by {creator.name || 'Unknown'}</p>
      )}
      <div className="flex gap-4 mt-3 text-sm text-stone-500">
        <span>👍 {upvotes}</span>
        <span>💬 {commentCount}</span>
        <span>⭐ {sponsorLikeCount}</span>
      </div>
    </Link>
  )
}
