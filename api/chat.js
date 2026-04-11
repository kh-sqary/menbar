export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, history } = req.body;

  const systemPrompt = `أنت مساعد ذكي متخصص في مساعدة الدعاة والخطباء المسلمين.
اسمك "مساعد خطبة". تساعد في:
- اقتراح الأدلة من القرآن والسنة
- تحسين أسلوب الخطبة
- الرد على الشبهات
- تقديم نصائح للخطابة
تحدث دائماً بالعربية الفصحى المبسطة. كن ودوداً ومحترفاً.`;

  const contents = [
    ...(history || []),
    { role: "user", parts: [{ text: message }] }
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، حدث خطأ في معالجة الرد.";

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "فشل الاتصال بـ Gemini API" });
  }
}
