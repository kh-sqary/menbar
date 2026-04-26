export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, topic } = req.body;

  const prompt = `أنت كاتب خطب إسلامية محترف ومتمرس، تتقن فنون البلاغة العربية (البيان والمعاني والبديع) وأساليب الإقناع المنبري.

الموضوع: ${topic || "غير محدد"}
النص الأصلي:
"${text}"

المطلوب:
1. أعد كتابة النص بأسلوب خطابي منبري قوي ومؤثر
2. رتّب البنية: افتتاحية قوية ← عرض بأدلة ← موعظة ← خاتمة ودعاء
3. أضف آيات قرآنية وأحاديث صحيحة مناسبة إن لم تكن موجودة
4. استخدم البلاغة (السجع غير المتكلف، الطباق، الاستعارة) بما يليق بالمنبر
5. اجعل في النص لحظات وعظية تلامس القلوب بتوازن بين الترغيب والترهيب
6. اجعل اللغة فصيحة ورصينة لكنها مفهومة وقريبة من الناس
7. ضع علامات ترقيم دقيقة تساعد الخطيب على الإلقاء

أعطني النص المحسّن فقط بدون شرح أو تعليق.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
