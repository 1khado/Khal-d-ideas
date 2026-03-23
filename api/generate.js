export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { platform, genre } = req.body;

    const ctx = [platform && `منصة: ${platform}`, genre && `جانر: ${genre}`]
      .filter(Boolean).join(' - ');
    const userPrompt = `ولّد 3 أفكار محتوى جيمنج فيروسية ${ctx ? `(${ctx})` : ''}.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: `رد فقط بـ JSON بدون أي نص خارجه. ولّد 3 أفكار محتوى جيمنج عربية.
{"ideas":[{"emoji":"🎮","genre":"نوع","title":"عنوان","description":"جملتين","why":"جملة","reason":"جملة","successRate":85,"successLabel":"نار 🔥","successType":"hot","proof":["دليل1","دليل2"],"challenges":["تحدي1","تحدي2"]}]}
successType: hot اعلى من 85، good بين 70-85، rising اقل من 70. النصوص عربي ما عدا اسماء الالعاب.`,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error?.message || 'API Error' });
    }

    const text = data.content?.map(i => i.text || '').join('') || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return res.status(200).json(parsed);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
