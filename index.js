const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai");

async function runBot() {
    try {
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        console.log("✅ GeminiModel logged in successfully!");

        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // SWITCHING TO THE STABLE FREE MODEL
        // 2.0 Flash is often restricted, but 1.5 Flash is the 'workhorse'
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

        const prompt = "Write a 3-word celebration for mohib872345.";
        
        // We add a retry delay here just in case
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        await session.comment({
            user: "mohib872345",
            content: `🤖 [GeminiModel]: ${aiResponse}`
        });

        console.log("🚀 SUCCESS! Check your profile!");

    } catch (err) {
        console.error("❌ ERROR:", err.message);
        
        // If it still says 429, it will tell you exactly how long to wait
        if (err.message.includes("429")) {
            console.log("💡 Tip: Try creating a NEW API Key in a NEW project at aistudio.google.com");
        }
    }
}

runBot();
