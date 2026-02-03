const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

async function runBot() {
    try {
        // 1. Login to GeminiModel account
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        console.log("✅ GeminiModel logged in successfully!");

        // 2. Setup the 2026 Unified AI Client
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // 3. Generate content using the stable 2026 Lite model
        // Note: We provide the model name directly in the request.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite", 
            contents: [{ role: 'user', parts: [{ text: "Write a short, friendly 1-sentence greeting for mohib872345." }] }]
        });

        // 4. Post the result to your profile
        // In the new SDK, response.text is a direct property.
        await session.comment({
            user: "mohib872345",
            content: `🤖 [GeminiModel]: ${response.text}`
        });

        console.log("🚀 SUCCESS! Check your Scratch profile.");

    } catch (err) {
        console.error("❌ Fatal Error:", err.message);
        
        // Helpful tip if the quota is still zero
        if (err.message.includes("429")) {
            console.log("💡 Tip: Wait 5 mins or create a fresh API key in a NEW project at AI Studio.");
        }
    }
}

runBot();
