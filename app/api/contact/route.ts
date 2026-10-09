export const runtime = "nodejs";

import { NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_ID = process.env.ADMIN_ID!;

/* ---------------- Telegram helper ---------------- */

async function tg(method: string, data: any) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    return await res.json();
  } catch (err) {
    console.error("Telegram API error:", err);
    return null;
  }
}

/* ---------------- POST /api/contact ---------------- */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    // basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // prevent spam / abuse (simple limit)
    if (message.length > 2000) {
      return NextResponse.json(
        { ok: false, error: "Message too long" },
        { status: 400 }
      );
    }

    const text =
`📩 <b>New Contact Message</b>

👤 <b>Name:</b> ${name}
📧 <b>Email:</b> ${email}

📝 <b>Subject:</b> ${subject || "No subject"}

💬 <b>Message:</b>
${message}

🕒 <b>Time:</b> ${new Date().toISOString()}`;

    const result = await tg("sendMessage", {
      chat_id: ADMIN_ID,
      text,
      parse_mode: "HTML",
    });

    if (!result?.ok) {
      return NextResponse.json(
        { ok: false, error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}