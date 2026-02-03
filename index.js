const Scratch = require('scratch3-api');
const { Client } = require("@google/genai"); // Use Client for the unified SDK

async function runBot() {
    try {
        // 1. Login to Scratch
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        
        // 2. Setup the 2026 Unified Client
        const client = new Client({ apiKey: process.env.GEMINI_API_KEY });

        // 3. The 2026 Way to Generate Content
        // Note: No more getGenerativeModel!
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash', // or 'gemini-2.5-flash-lite'
            contents: 'Say hi to mohib872345 in 5 words.'
        });

        console.log(`✅ GeminiModel: ${response.text}`);
        
        // 4. Post to Scratch
        await session.comment({
            user: "mohib872345",
            content: response.text
        });

    } catch (err) {
        console.error("❌ Fatal Error:", err.message);
    }
}

runBot();
