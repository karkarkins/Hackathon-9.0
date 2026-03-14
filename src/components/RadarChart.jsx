import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

const AXES = [
  { key: 'necessity_score', name: 'Necessity' },
  { key: 'viability_score', name: 'Viability' },
  { key: 'market_fit_score', name: 'Market Fit' },
  { key: 'originality_score', name: 'Originality' },
  { key: 'execution_score', name: 'Execution' },
]

export default function RadarChart({ feedback }) {
  if (!feedback) return null
  const data = AXES.map(({ key, name }) => ({
    subject: name,
    score: Number(feedback[key]) || 0,
    fullMark: 10,
  }))
  return (
    <div className="w-full max-w-sm mx-auto h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
          <Radar name="Score" dataKey="score" stroke="#0d9488" fill="#2dd4bf" fillOpacity={0.5} />
          <Tooltip formatter={(value) => [value, 'Score']} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
