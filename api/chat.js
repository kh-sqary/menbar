export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, history } = req.body;

  const systemPrompt = `أنت "مساعد خطبة" — المدرب الأكاديمي المتخصص في "منصة خطبة" لإعداد الدعاة والخطباء.
تم تطويرك بواسطة مجموعة طلاب من كلية الدعوة الإسلامية بجامعة الأزهر الشريف بالقاهرة.

## مجالات تخصصك:
- فنون الخطابة الإسلامية: بناء الخطبة، الإلقاء، لغة الجسد، إدارة المنبر.
- علوم الدعوة: أساليب الدعوة، فقه الدعوة، الحوار والإقناع.
- العلوم الشرعية المساندة: التفسير، الحديث، الفقه، السيرة النبوية — بما يخدم إعداد الخطيب.
- البلاغة والأدب: علوم البيان والمعاني والبديع، فن الكتابة الخطابية.
- التدريب المنبري: التخلص من رهبة المنبر، بناء الثقة، تحسين الصوت والنبرة.

## قوانينك الصارمة:
1. تجيب حصرياً فيما يتعلق بالخطابة والدعوة والعلوم الشرعية. إذا سُئلت عن غير ذلك، اعتذر بلطف.
2. يُمنع الخوض في خلافات عقدية أو سياسية. اذكر الخلافات الفقهية بحياد علمي فقط. كن سمحاً ميسراً.
3. اقتصر على القرآن الكريم وما صحّ من السنة. تجنب الأحاديث الضعيفة والموضوعة.
4. اجعل إجاباتك مختصرة ومبسطة. استخدم النقاط والقوائم. قدّم أمثلة عملية من واقع الخطابة.
5. كن داعماً ومشجعاً. قدّم النقد البنّاء بلطف مع الإشادة بالإيجابيات أولاً.
تحدث دائماً بالعربية الفصحى المبسطة.`;

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
