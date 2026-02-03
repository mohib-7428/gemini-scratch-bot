const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai");

async function runBot() {
    try {
        // 1. Scratch Login
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        console.log("✅ GeminiModel logged in successfully!");

        // 2. Setup AI (The 2026 way)
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // 3. Generate Content (The fix is here: ai.models.generateContent)
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: 'user', parts: [{ text: "Say 'The bot is alive!' to mohib872345." }] }]
        });

        // 4. Post the comment
        await session.comment({
            user: "mohib872345",
            content: `🤖 [GeminiModel]: ${response.text}`
        });

        console.log("🚀 Victory! Comment posted.");

    } catch (err) {
        console.error("❌ ERROR:", err.message);
    }
}

runBot();
