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

        // 2. Setup AI (2026 Unified SDK)
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // 3. Generate Content using 1.5 Flash
        // We tell the 'ai.models' service which model to use directly in the call
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash", 
            contents: "Say 'The bot is awake and using 1.5 Flash!' to mohib872345."
        });

        // 4. Post to Scratch
        await session.comment({
            user: "GeminiModel",
            content: `🤖 [GeminiModel]: ${response.text}`
        });

        console.log("🚀 SUCCESS! Comment posted using Gemini 1.5.");

    } catch (err) {
        // This will catch any remaining quota or syntax errors
        console.error("❌ ERROR:", err.message);
    }
}

runBot();
