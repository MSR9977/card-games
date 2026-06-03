import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_STUDIO_API;

  let body: {
    dealerScore: number;
    playerScore: number;
    dealerCards: string[];
    playerCards: string[];
    round?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { dealerScore, playerScore, dealerCards, playerCards, round = 1 } = body;

  // Standard Blackjack dealer rule: always enforced regardless of AI
  // Dealer MUST hit below 17, MUST stand at 17+
  const standardAction = dealerScore < 17 ? "hit" : "stand";

  // If no API key or score is already decided by rules, return immediately
  if (!apiKey) {
    const comments: Record<string, string[]> = {
      hit: [
        "يجب أن أسحب بطاقة أخرى",
        "مجموعي منخفض جداً",
        "القواعد تُلزمني بالسحب",
        "أحتاج بطاقة للمضي قدماً",
      ],
      stand: [
        "أقف بهذا المجموع",
        "المجموع كافٍ للوقوف",
        "17 أو أكثر — أقف",
        "لن أخاطر بالسحب",
      ],
    };
    const list = comments[standardAction];
    const comment = list[Math.floor(Math.random() * list.length)];
    return NextResponse.json({ action: standardAction, comment, fallback: true });
  }

  // Build a natural Arabic prompt
  const prompt = `أنت ديلر بلاك جاك محترف. القواعد: الديلر يسحب (hit) دائماً إذا المجموع أقل من 17، ويقف (stand) إذا 17 أو أكثر.

الجولة الحالية #${round}:
- بطاقات الديلر: ${dealerCards.join(", ")} → المجموع: ${dealerScore}
- بطاقات اللاعب: ${playerCards.join(", ")} → المجموع: ${playerScore}

القرار الواجب: ${standardAction === "hit" ? "سحب بطاقة (مجموعك ${dealerScore} < 17)" : "الوقوف (مجموعك ${dealerScore} ≥ 17)"}

اكتب تعليقاً قصيراً بالعربية (جملة واحدة فقط، 5-10 كلمات) يعبر عن قرار الديلر بطريقة تشعبية وكازينو.
أجب بـ JSON فقط: {"action":"${standardAction}","comment":"تعليقك هنا"}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(8000), // 8-second timeout
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed: { action?: string; comment?: string } = {};
    try {
      // Strip markdown code fences if present
      const clean = rawText.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean || "{}");
    } catch {
      parsed = {};
    }

    // Always enforce the standard rule — AI only provides the comment
    const dealerComments: Record<string, string[]> = {
      hit: ["أسحب بطاقة!", "مجموعي منخفض", "أحتاج المزيد", "القواعد تقول اسحب"],
      stand: ["أقف هنا", "مجموعي كافٍ", "17 أو أكثر — أقف", "الوقوف أفضل"],
    };
    const fallbackComments = dealerComments[standardAction];
    const comment =
      parsed.comment && parsed.comment.length > 2
        ? parsed.comment
        : fallbackComments[Math.floor(Math.random() * fallbackComments.length)];

    return NextResponse.json({ action: standardAction, comment });
  } catch {
    // Fallback with varied comments
    const variedComments: Record<string, string[]> = {
      hit: [
        "مجموعي ${dealerScore}، أحتاج بطاقة",
        "القواعد تُلزمني بالسحب",
        "أواصل السحب!",
      ],
      stand: [
        "مجموع ${dealerScore} — أقف!",
        "17 يكفيني للوقوف",
        "لن أخاطر بالسحب",
      ],
    };
    const list = variedComments[standardAction];
    const comment = list[Math.floor(Math.random() * list.length)]
      .replace("${dealerScore}", String(dealerScore));

    return NextResponse.json({ action: standardAction, comment, fallback: true });
  }
}
