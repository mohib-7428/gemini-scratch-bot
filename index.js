const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai");

async function runBot() {
    try {
        // 1. LOGIN ONCE AT THE START
        const session = await Scratch.UserSession.create(process.env.BOT_USERNAME, process.env.BOT_PASSWORD);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("✅ GeminiModel logged in successfully!");

        // 2. THE LOOP (ONLY CHECKS COMMENTS, DOESN'T LOG IN AGAIN)
        setInterval(async () => {
            try {
                const user = "mohib872345";
                const profile = await session.getUser(user);
                const comments = await profile.getComments();
                const latest = comments[0];

                if (latest.content.startsWith("!ask") && latest.author.username !== process.env.BOT_USERNAME) {
                    console.log(`💬 Processing: ${latest.content}`);
                    const userPrompt = latest.content.replace("!ask", "").trim();

                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash-lite",
                        contents: `Reply to: "${userPrompt}" in 15 words.`
                    });

                    await latest.reply(`🤖 ${response.text}`);
                    console.log("🚀 Reply sent!");
                } else {
                    console.log("😴 Waiting...");
                }
            } catch (loopErr) {
                console.error("⚠️ Loop Error (Likely rate limit):", loopErr.message);
            }
        }, 120000); // 2 MINUTES - The safest speed for 2026 bots

    } catch (loginErr) {
        console.error("❌ Login Failed:", loginErr.message);
    }
}

runBot();
