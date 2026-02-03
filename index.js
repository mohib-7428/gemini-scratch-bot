const http = require('http');
const Scratch = require('scratch3-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. HEARTBEAT - Keeps Railway from killing the bot
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('GeminiModel Bot is LIVE');
    res.end();
}).listen(process.env.PORT || 8080);

// 2. CONFIG - Use the stable 2026 model name
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// If gemini-2.0-flash fails, change this to "gemini-1.5-flash"
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 
let lastCheckedCommentId = null;
const TARGET_ACCOUNT = "GeminiModel"; 

async function runBot() {
    try {
        console.log(`🚀 Connecting to Scratch as ${process.env.BOT_USERNAME}...`);
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        console.log("✅ Scratch Login Successful!");

        setInterval(async () => {
            try {
                console.log(`🧐 Scanning ${TARGET_ACCOUNT} for !ask comments...`);
                
                // Stealth fetch to bypass Cloudflare blocks
                const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/${TARGET_ACCOUNT}/?cachebust=${Date.now()}`, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
                });
                const html = await response.text();
                
                const commentRegex = /<div id="comments-(\d+)"[\s\S]*?<div class="content">([\s\S]*?)<\/div>/g;
                let match;

                while ((match = commentRegex.exec(html)) !== null) {
                    const commentId = match[1];
                    const fullText = match[2].trim();

                    // Trigger detection
                    if (fullText.toLowerCase().includes("!ask") && commentId !== lastCheckedCommentId) {
                        console.log(`🎯 Trigger Found: "${fullText}"`);
                        lastCheckedCommentId = commentId;

                        const question = fullText.split(/!ask/i)[1].trim();
                        console.log(`🤖 AI is thinking...`);

                        // AI Generation
                        const result = await model.generateContent(question);
                        const aiResponse = result.response.text().substring(0, 450);

                        console.log(`📤 Posting response to Scratch...`);
                        await session.comment({
                            user: TARGET_ACCOUNT,
                            content: `🤖 ${aiResponse}`,
                            parent: commentId
                        });
                        
                        console.log("✨ SUCCESS: Reply posted!");
                        break; 
                    }
                }
            } catch (err) {
                // If the model name is still wrong, this will catch it
                if (err.message.includes("404")) {
                    console.error("❌ MODEL ERROR: Try changing 'gemini-2.0-flash' to 'gemini-1.5-flash' in the code.");
                } else {
                    console.error("❌ Error:", err.message);
                }
            }
        }, 30000); 

    } catch (error) {
        console.error("❌ Critical Setup Failure:", error.message);
    }
}

runBot();
