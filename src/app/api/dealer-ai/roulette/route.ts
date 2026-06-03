import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

const getNumberColor = (num: number): "أحمر" | "أسود" | "أخضر" => {
  if (num === 0) return "أخضر";
  return RED_NUMBERS.has(num) ? "أحمر" : "أسود";
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_STUDIO_API;

  let body: {
    event: "placed_bet" | "spinning" | "result";
    betsSummary?: string;
    rolled?: number;
    totalWin?: number;
    totalBet?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, betsSummary = "", rolled = null, totalWin = 0, totalBet = 0 } = body;

  // Build Arabic dealer response templates if there is no API key
  if (!apiKey) {
    let comment = "ضعوا رهاناتكم أيها السادة!";
    if (event === "spinning") {
      comment = "⚠️ لا مزيد من الرهانات! تدور العجلة الآن!";
    } else if (event === "placed_bet") {
      comment = `تم قبول الرهان! مجموع رهاناتكم الحالي $${totalBet}. بالتوفيق!`;
    } else if (event === "result" && rolled !== null) {
      const color = getNumberColor(rolled);
      if (totalWin > 0) {
        comment = `🎉 الرقم الفائز هو ${rolled} (${color})! تهانينا الحارة للفائزين بـ $${totalWin}! 🎉`;
      } else {
        comment = `الرقم الفائز هو ${rolled} (${color}). الكازينو يربح الجولة، حظاً أوفر المرة القادمة!`;
      }
    }
    return NextResponse.json({ comment, fallback: true });
  }

  // Build a highly natural and engaging prompt for Gemini 2.5 Flash
  let prompt = `أنت ديلر روليت محترف ولبق جداً في كازينو فاخر. تتحدث العربية الفصحى الفخمة بأسلوب حماسي ومحفز يليق بكبار الشخصيات.

تفاصيل الجولة الحالية:
`;

  if (event === "placed_bet") {
    prompt += `- الحدث: وضع رهان جديد على الطاولة.
- مجموع الرهان الحالي للاعب: $${totalBet}
- تفاصيل الرهانات الحالية: ${betsSummary}

المطلوب: اكتب تعليقاً حياً وجذاباً كديلر حقيقي يرحب بالرهان ويحمس اللاعب لمواصلة اللعب أو بدء الدوران.`;
  } else if (event === "spinning") {
    prompt += `- الحدث: إعلان بدء دوران العجلة وإيقاف المراهنات (No More Bets).
- مجموع الرهان الإجمالي: $${totalBet}

المطلوب: اكتب تعليقاً كلاسيكياً مهيباً كديلر روليت يعلن وقف الرهانات تماماً ودوران الكرة بحماس.`;
  } else if (event === "result" && rolled !== null) {
    const color = getNumberColor(rolled);
    prompt += `- الحدث: إعلان الرقم الفائز واستقرار الكرة.
- الرقم الفائز: ${rolled} (${color})
- إجمالي أرباح اللاعب: $${totalWin} (مجموع الرهان كان $${totalBet})
- النتيجة المالية: ${totalWin > 0 ? `ربح صافي قدره $${totalWin - totalBet}` : `خسارة الرهان بالكامل $${totalBet}`}

المطلوب: اكتب تعليقاً حياً ومميزاً. إذا فاز اللاعب، هنئه بحماس وفخامة وبأسلوب كازينو حقيقي. إذا خسر، واسِه بوقار وأدب كازينو راقٍ وشجعه على الجولة القادمة.`;
  }

  prompt += `

القواعد الصارمة:
1. اكتب جملة واحدة فقط (من 5 إلى 15 كلمة).
2. يجب أن تتحدث كديلر روليت حقيقي.
3. التزم باللغة العربية الفصحى الراقية.
4. أجب بصيغة JSON فقط: {"comment": "تعليقك الفخم هنا"}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 250,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(6000), // 6-second timeout
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed: { comment?: string } = {};
    try {
      const clean = rawText.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean || "{}");
    } catch {
      parsed = {};
    }

    const comment = parsed.comment || "";
    if (comment.length < 3) {
      throw new Error("Empty comment");
    }

    return NextResponse.json({ comment });

  } catch {
    // Elegant fallback system if API fails
    let comment = "ضعوا رهاناتكم أيها السادة!";
    if (event === "spinning") {
      comment = "⚠️ لا مزيد من الرهانات! تدور العجلة الآن!";
    } else if (event === "placed_bet") {
      const placedBetsList = [
        `تم قبول الرهان بنجاح! مجموع رهاناتكم الآن $${totalBet}.`,
        `رهان رائع على الطاولة! بالتوفيق في هذه الجولة!`,
        `حظاً سعيداً! الطاولة جاهزة لبدء الدوران الآن.`,
      ];
      comment = placedBetsList[Math.floor(Math.random() * placedBetsList.length)];
    } else if (event === "result" && rolled !== null) {
      const color = getNumberColor(rolled);
      if (totalWin > 0) {
        const winList = [
          `🎉 الرقم الفائز هو ${rolled} (${color})! تهانينا الحارة، ربحت $${totalWin}! 🎉`,
          `🎉 استقرت الكرة في الجيب ${rolled}! مبروك الفوز بـ $${totalWin}! 🎉`,
          `🎉 رائع! فوز مستحق بقيمة $${totalWin} على الرقم ${rolled}! 🎉`,
        ];
        comment = winList[Math.floor(Math.random() * winList.length)];
      } else {
        const loseList = [
          `الرقم الفائز هو ${rolled} (${color}). حظاً أوفر في الجولة القادمة!`,
          `استقرت الكرة في الرقم ${rolled} (${color}). الجولات مستمرة والفرص قادمة!`,
          `الرقم الفائز: ${rolled}. الكازينو يتمنى لكم حظاً أفضل الجولة المقبلة!`,
        ];
        comment = loseList[Math.floor(Math.random() * loseList.length)];
      }
    }
    return NextResponse.json({ comment, fallback: true });
  }
}
