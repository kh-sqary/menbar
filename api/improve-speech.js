export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, topic } = req.body;

  const prompt = `أنت خبير في الخطابة الإسلامية. حسّن هذه الخطبة أو المقطع:

الموضوع: ${topic || "غير محدد"}
النص الأصلي:
"${text}"

المطلوب:
1. أعد كتابة النص بأسلوب خطابي أقوى
2. أضف آية قرآنية أو حديث مناسب إن لم يكن موجوداً
3. حسّن الافتتاحية والخاتمة
4. اجعل اللغة فصيحة ومؤثرة

أعطني النص المحسّن فقط بدون شرح أو تعليق.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.AIzaSyCqfrxBXx9UxE3efeB0owEtpu8neudHD7w}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
        })
      }
    );

    const data = await response.json();
    const improved = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
    res.status(200).json({ improved });
  } catch (error) {
    console.error("Improvement Error:", error);
    res.status(500).json({ error: "فشل تحسين النص" });
  }
}
