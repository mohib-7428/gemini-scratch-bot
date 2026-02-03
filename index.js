const Scratch = require('scratch3-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let lastCommentId = null;

async function fastScan() {
    try {
        const session = await Scratch.UserSession.create(process.env.BOT_USERNAME, process.env.BOT_PASSWORD);
        
        // Use the API to get comments (much faster than loading the whole page)
        const response = await fetch(`https://api.scratch.mit.edu/users/GeminiModel/comments?limit=5`);
        const comments = await response.json();

        if (comments.length > 0) {
            const topComment = comments[0];

            if (topComment.id !== lastCommentId) {
                lastCommentId = topComment.id;
                console.log(`🚀 New Comment: ${topComment.content}`);

                const result = await model.generateContent(`Reply to: "${topComment.content}"`);
                const reply = result.response.text();

                await session.comment({
                    user: "GeminiModel",
                    content: reply,
                    parent: topComment.id
                });
                console.log("⚡ Replied in 'Light Speed' mode.");
            }
        }
    } catch (err) {
        console.error("⚠️ Speed Bump:", err.message);
    }

    // Set a random delay between 15-25 seconds to trick the spam filter
    const randomDelay = Math.floor(Math.random() * (25000 - 15000 + 1)) + 15000;
    setTimeout(fastScan, randomDelay);
}

fastScan();
