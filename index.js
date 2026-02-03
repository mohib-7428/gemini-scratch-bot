const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai"); // The 2026 package

async function runBot() {
    try {
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        
        // 2026 Client Setup
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // New method signature for 2026 SDK
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite', // The current stable model
            contents: [{ role: 'user', parts: [{ text: 'Say hi to mohib872345' }] }]
        });

        console.log(`✅ GeminiModel: ${response.text}`);
        
        await session.comment({
            user: "GeminiModel",
            content: response.text
        });

    } catch (err) {
        console.error("❌ Fatal Error:", err.message);
    }
}
runBot();
