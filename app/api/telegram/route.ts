export const runtime = "nodejs";

import { NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_ID = process.env.ADMIN_ID!;

/* ---------------- helpers ---------------- */

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
    }
}

/* ---------------- main handler ---------------- */

export async function POST(req: Request) {
    const update = await req.json();

    const message = update.message;
    const reply = message?.reply_to_message;

    if (!message) {
        return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text;
    const userId = message.from.id;

    /* ---------------- /start ---------------- */

    if (text === "/start") {
        if (String(userId) === String(ADMIN_ID)) {
            await tg("sendMessage", {
                chat_id: chatId,
                text: "👋 Welcome, you are the ADMIN.",
            });
        } else {
             await tg("sendMessage", {
                chat_id: chatId,
                text: "Welcome to Nova Meridian Support.\n\nHere is how we can help:\n\n1. Deposit verification: send a screenshot of your payment confirmation, your name and the referral code shown on your profile.\n2. Anything else: write your question here and a member of the Nova Meridian team will reply.",
            });
        }

        return NextResponse.json({ ok: true });
    }

    /* ---------------- ADMIN REPLY FLOW ---------------- */

    if (String(userId) === String(ADMIN_ID) && reply) {
        let targetUserId: string | null = null;

        // Extract the user ID directly from the text block being replied to
        if (reply.text) {
            const match = reply.text.match(/User ID:\s*(\d+)/i);
            if (match && match[1]) {
                targetUserId = match[1];
            }
        } 
        // Fallback check for captions if you are replying to an image block the bot built
        else if (reply.caption) {
            const match = reply.caption.match(/User ID:\s*(\d+)/i);
            if (match && match[1]) {
                targetUserId = match[1];
            }
        }

        if (targetUserId) {
            if (text) {
                await tg("sendMessage", {
                    chat_id: targetUserId,
                    text,
                });
            }

            if (message.photo) {
                const fileId = message.photo[message.photo.length - 1].file_id;
                await tg("sendPhoto", {
                    chat_id: targetUserId,
                    photo: fileId,
                    caption: message.caption || "",
                });
            }

            if (message.document) {
                const fileId = message.document.file_id;
                await tg("sendDocument", {
                    chat_id: targetUserId,
                    document: fileId,
                    caption: message.caption || "",
                });
            }

            if (message.voice) {
                await tg("sendVoice", {
                    chat_id: targetUserId,
                    voice: message.voice.file_id,
                });
            }
        } else {
            await tg("sendMessage", {
                chat_id: ADMIN_ID,
                text: "❌ Error: Could not extract User ID from this message structure.",
            });
        }

        return NextResponse.json({ ok: true });
    }

    /* ---------------- USER → ADMIN SINGLE MERGED FLOW ---------------- */
    
    if (String(userId) === String(ADMIN_ID)) {
        return NextResponse.json({ ok: true });
    }

    const userName = message.from.first_name || "Unknown";
    
    // Construct the metadata footer
    const footer = `\n\n— — — — — — — — — — — — —\n👤 <b>Sender:</b> ${userName}\n🆔 <b>User ID:</b> ${userId}`;

    // Handle Text Messages
    if (text) {
        await tg("sendMessage", {
            chat_id: ADMIN_ID,
            text: `${text}${footer}`,
            parse_mode: "HTML",
        });
    }

    // Handle Photos
    if (message.photo) {
        const fileId = message.photo[message.photo.length - 1].file_id;
        const captionText = message.caption ? `${message.caption}${footer}` : `📷 Photo Sent${footer}`;
        await tg("sendPhoto", {
            chat_id: ADMIN_ID,
            photo: fileId,
            caption: captionText,
            parse_mode: "HTML",
        });
    }

    // Handle Documents
    if (message.document) {
        const fileId = message.document.file_id;
        const captionText = message.caption ? `${message.caption}${footer}` : `📄 Document Sent${footer}`;
        await tg("sendDocument", {
            chat_id: ADMIN_ID,
            document: fileId,
            caption: captionText,
            parse_mode: "HTML",
        });
    }

    // Handle Voice Messages
    if (message.voice) {
        // Voice updates don't support custom text captions directly in Telegram, 
        // so we send the voice clip first and immediately thread the user details right under it.
        const voiceRes = await tg("sendVoice", {
            chat_id: ADMIN_ID,
            voice: message.voice.file_id,
        });

        if (voiceRes && voiceRes.ok) {
            await tg("sendMessage", {
                chat_id: ADMIN_ID,
                text: `☝️ Voice Note above from:${footer}`,
                reply_to_message_id: voiceRes.result.message_id,
                parse_mode: "HTML",
            });
        }
    }

    // Confirmation back to user
    await tg("sendMessage", {
        chat_id: chatId,
        text: "✅ Your message has been received! An admin will review it and contact you soon.",
    });

    return NextResponse.json({ ok: true });
}
