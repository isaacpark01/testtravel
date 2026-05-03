exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers: cors, body: 'Invalid JSON' }; }

  const { cityName, numDays = 3, budget, interests = 'Mix of everything', cityContext = '' } = body;
  if (!cityName) return { statusCode: 400, headers: cors, body: 'cityName required' };

  const prompt = `You are an expert travel planner. Create a detailed ${numDays}-day itinerary for ${cityName}.

${budget ? `Daily budget: $${budget} per person` : 'Budget: flexible'}
Travel style: ${interests}
${cityContext ? `\nTop-rated spots in ${cityName} (use these when relevant):\n${cityContext}` : ''}

Return ONLY a JSON object — no markdown, no explanation, just raw JSON:
{
  "days": [
    {
      "label": "Day 1 — Arrival & First Impressions",
      "cards": [
        {
          "name": "Exact place name",
          "category": "activity",
          "price": 15,
          "rating": 4.5,
          "duration": "2h",
          "tip": "One practical insider tip",
          "note": "Why this is worth visiting",
          "startTime": "09:00"
        }
      ]
    }
  ]
}

Rules:
- category must be exactly "activity" or "food"
- 3-4 cards per day, mix of activities and food (aim for 2 activities + 1-2 food per day)
- price is USD integer (0 for free)
- rating is 1-5 with one decimal
- duration format: "1h", "2.5h", "30min"
- startTime in 24h format: "09:00", "13:30", "19:00"
- Prioritize well-known, highly-rated real places
- Use names from the provided city data whenever possible
- Be specific — real restaurant and attraction names only, no generic descriptions`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 502, headers: cors, body: `Anthropic error: ${err}` };
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const plan = JSON.parse(jsonStr.trim());

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: `Error: ${e.message}` };
  }
};
