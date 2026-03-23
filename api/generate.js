export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { platform, genre } = req.body;

    const ctx = [platform && `منصة: ${platform}`, genre && `جانر: ${genre}`]
      .filter(Boolean).join(' - ');

    const prompt = `رد فقط بـ JSON بدون أي نص خارجه أو markdown. ولّد 3 أفكار محتوى جيمنج عربية ${ctx ? `(${ctx})` : ''}.
الشكل المطلوب:
{"ideas":[{"emoji":"🎮","genre":"نوع","title":"عنوان","description":"جملتين","why":"جملة","reason":"جملة","successRate":85,"successLabel":"نار 🔥","successType":"hot","proof":["دليل1","دليل2"],"challenges":["تحدي1","تحدي2"]}]}
successType: hot اعلى من 85، good بين 70-85، rising اقل من 70. النصوص عربي ما عدا اسماء الالعاب.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 2000 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error?.message || 'Gemini API Error' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(500).json({ error: 'رد فاضي' });

    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
