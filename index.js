const Scratch = require('scratch3-api');
const { GoogleGenAI } = require("@google/genai");

async function runBot() {
    try {
        const session = await Scratch.UserSession.create(process.env.BOT_USERNAME, process.env.BOT_PASSWORD);
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // Using 1.5-Flash because it has the most reliable Free Tier quota
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 1. Get the latest comment on your profile
        const user = "mohib872345";
        const profile = await session.getUser(user);
        const comments = await profile.getComments();
        const latestComment = comments[0];

        // 2. Check if the bot already replied (to avoid infinite loops!)
        if (latestComment.author.username === process.env.BOT_USERNAME) {
            console.log("😴 No new messages to answer.");
            return;
        }

        console.log(`💬 New message from ${latestComment.author.username}: "${latestComment.content}"`);

        // 3. Generate a reply
        const prompt = `You are GeminiModel, a helpful Scratch bot. 
                        A user named ${latestComment.author.username} said: "${latestComment.content}". 
                        Reply to them in under 20 words.`;
        
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        // 4. Post the reply
        await latestComment.reply(`🤖 ${aiResponse}`);
        console.log("🚀 Reply posted!");

    } catch (err) {
        console.error("❌ ERROR:", err.message);
    }
}

// Check for new messages every 60 seconds
setInterval(runBot, 60000);
runBot();
