export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { transcript } = req.body;

  const prompt = `حلّل هذه الخطبة أو الكلام وأعطني تقييماً دقيقاً بالتنسيق التالي (JSON فقط بدون أي نص إضافي):

{
  "speed": <رقم من 0 إلى 100 يمثل مناسبة سرعة الكلام>,
  "clarity": <رقم من 0 إلى 100 يمثل وضوح الأفكار>,
  "confidence": <رقم من 0 إلى 100 يمثل مستوى الثقة في الأسلوب>,
  "overall": <رقم من 0 إلى 100 التقييم الكلي>,
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "improvements": ["اقتراح تحسين 1", "اقتراح تحسين 2"],
  "summary": "جملة واحدة تلخص مستوى الخطبة"
}

النص المراد تحليله:
"${transcript}"`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.AIzaSyCqfrxBXx9UxE3efeB0owEtpu8neudHD7w}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 512 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const cleaned = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);
    res.status(200).json(result);
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(200).json({ error: "فشل التحليل", overall: 0 });
  }
}
