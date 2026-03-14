import { supabase } from './supabaseClient'

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export async function evaluatePitch(pitch) {
  const { data: kbEntries } = await supabase
    .from('knowledge_base')
    .select('content')
    .eq('active', true)

  const knowledgeContext = kbEntries?.length
    ? `--- KNOWLEDGE BASE START ---\n${kbEntries.map((e) => e.content).join('\n\n')}\n--- KNOWLEDGE BASE END ---`
    : ''

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are a business pitch evaluator trained on successful startups and Shark Tank episodes.
${knowledgeContext ? `Use the following reference material when evaluating:\n${knowledgeContext}` : ''}

Evaluate this pitch and return ONLY valid JSON with no preamble, explanation, or markdown fences.

Pitch Title: ${pitch.title}
Industry: ${pitch.industry}
Target Demographic: ${pitch.target_demographic}
Stage: ${pitch.stage}
Description: ${pitch.description}

Return exactly this JSON structure:
{
  "necessity_score": 5,
  "viability_score": 5,
  "market_fit_score": 5,
  "originality_score": 5,
  "execution_score": 5,
  "summary": "2-3 sentence plain English evaluation of strengths and weaknesses.",
  "similar_stories": [
    { "company": "Example Co", "industry": "Tech", "lesson": "One sentence takeaway." }
  ],
  "refined_pitch": "Full rewritten version of the pitch description, more compelling and investor-ready."
}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error: ${response.status} ${err}`)
  }

  const data = await response.json()
  const raw = (data.content || []).map((i) => i.text || '').join('')
  const clean = raw.replace(/```json|```/g, '').trim()
  const result = JSON.parse(clean)

  await supabase.from('ai_feedback').upsert(
    {
      pitch_id: pitch.id,
      necessity_score: result.necessity_score,
      viability_score: result.viability_score,
      market_fit_score: result.market_fit_score,
      originality_score: result.originality_score,
      execution_score: result.execution_score,
      summary: result.summary,
      similar_stories: result.similar_stories || [],
      refined_pitch: result.refined_pitch || '',
    },
    { onConflict: 'pitch_id' }
  )

  return result
}
