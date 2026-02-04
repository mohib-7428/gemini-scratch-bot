const http = require('http');
const Scratch = require('scratch3-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Heartbeat for Railway
http.createServer((req, res) => { res.end('Bot Online - Raw Mode'); }).listen(process.env.PORT || 8080);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Model set to 1.5-flash for maximum free-tier compatibility
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

let lastCheckedCommentId = null;

async function runBot() {
    try {
        const session = await Scratch.UserSession.create(process.env.BOT_USERNAME, process.env.BOT_PASSWORD);
        console.log("✅ Scratch Connection: ACTIVE (No internal filters)");

        setInterval(async () => {
            try {
                // Fetching the GeminiModel profile comments
                const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/GeminiModel/?cachebust=${Date.now()}`);
                const html = await response.text();
                const match = /<div id="comments-(\d+)"[\s\S]*?<div class="content">([\s\S]*?)<\/div>/.exec(html);

                if (match) {
                    const [_, commentId, text] = match;
                    if (text.toLowerCase().includes("!ask") && commentId !== lastCheckedCommentId) {
                        lastCheckedCommentId = commentId;
                        console.log(`🎯 New Prompt: ${text.trim()}`);

                        try {
                            const prompt = text.split(/!ask/i)[1].trim();
                            
                            // RAW AI Generation
                            const result = await model.generateContent(prompt);
                            const aiResponse = result.response.text().substring(0, 450);
                            
                            await session.comment({ 
                                user: "GeminiModel", 
                                content: `🤖 ${aiResponse}`, 
                                parent: commentId 
                            });
                            console.log("✨ SUCCESS: Reply posted.");
                        } catch (aiErr) {
                            console.log(`❌ AI ERROR: ${aiErr.message}`);
                        }
                    }
                }
            } catch (e) { /* Loop continue */ }
        }, 35000); 
    } catch (e) { console.log("❌ LOGIN FAILED: Check Scratch credentials."); }
}

runBot();
