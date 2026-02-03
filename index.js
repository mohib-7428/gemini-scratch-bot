const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai");

async function runBot() {
    try {
        // 1. LOGIN (Stay logged in)
        const session = await Scratch.UserSession.create(process.env.BOT_USERNAME, process.env.BOT_PASSWORD);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("✅ GeminiModel logged in successfully!");

        // 2. THE LOOP
        setInterval(async () => {
            try {
                // FIX: Use session.getComments directly for the user
                const user = "mohib872345";
                const comments = await session.getComments(user); 
                const latest = comments[0];

                if (latest && latest.content.startsWith("!ask") && latest.author.username !== process.env.BOT_USERNAME) {
                    console.log(`💬 Processing command: ${latest.content}`);
                    
                    const userPrompt = latest.content.replace("!ask", "").trim();
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash-lite",
                        contents: `Reply to: "${userPrompt}" in 15 words.`
                    });

                    // FIX: Use the specific comment's reply method
                    await latest.reply(`🤖 ${response.text}`);
                    console.log("🚀 Reply sent successfully!");
                } else {
                    console.log("😴 Waiting for !ask...");
                }
            } catch (loopErr) {
                // This stops the bot from crashing if Scratch is laggy
                console.error("⚠️ Loop Note:", loopErr.message);
            }
        }, 120000); // 2 Minutes (Safe Zone)

    } catch (loginErr) {
        console.error("❌ Login Failed:", loginErr.message);
    }
}

runBot();
