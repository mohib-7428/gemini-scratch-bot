const http = require('http');
const Scratch = require('scratch3-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Keep Railway alive
http.createServer((req, res) => { res.end('Gemini Bot Running'); }).listen(process.env.PORT || 8080);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// We use 1.5-flash as it's the most likely to have a free quota assigned
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
let lastCheckedCommentId = null;

async function runBot() {
    try {
        const session = await Scratch.UserSession.create(process.env.BOT_USERNAME, process.env.BOT_PASSWORD);
        console.log("✅ SCRATCH: Connected and Logged In.");

        setInterval(async () => {
            try {
                // Scrape the GeminiModel profile
                const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/GeminiModel/?cachebust=${Date.now()}`);
                const html = await response.text();
                
                // Optimized regex to find the most recent comment
                const match = /<div id="comments-(\d+)"[\s\S]*?<div class="content">([\s\S]*?)<\/div>/.exec(html);

                if (match) {
                    const commentId = match[1];
                    const text = match[2].trim();

                    if (text.toLowerCase().includes("!ask") && commentId !== lastCheckedCommentId) {
                        lastCheckedCommentId = commentId;
                        console.log(`🎯 New Trigger: ${text}`);

                        try {
                            const question = text.split(/!ask/i)[1].trim();
                            const result = await model.generateContent(question);
                            const aiResponse = result.response.text().substring(0, 450);
                            
                            await session.comment({ user: "GeminiModel", content: `🤖 ${aiResponse}`, parent: commentId });
                            console.log("✨ SUCCESS: Answer posted to Scratch!");
                        } catch (aiErr) {
                            // This is where the 'Limit 0' error is caught
                            console.log("❌ GOOGLE ERROR: Your API Key has no quota (Limit 0).");
                            await session.comment({ 
                                user: "GeminiModel", 
                                content: "🤖 (System Error: My AI quota is empty. Owner needs to refresh the API Key!)", 
                                parent: commentId 
                            });
                        }
                    }
                }
            } catch (e) { /* Ignore minor fetch skips */ }
        }, 35000); 
    } catch (e) { console.log("❌ LOGIN FAILED: Check BOT_USERNAME and PASSWORD."); }
}

runBot();
