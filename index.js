async function runBot() {
    try {
        console.log("🚀 Logging into Scratch...");
        const session = await Scratch.UserSession.create(
            process.env.BOT_USERNAME, 
            process.env.BOT_PASSWORD
        );
        console.log("✅ Logged in!");

        setInterval(async () => {
            try {
                console.log("Checking...");
                
                // Use the library's internal Rest requester
                const url = `https://api.scratch.mit.edu/users/${process.env.BOT_USERNAME}/comments?limit=5&nocache=${Date.now()}`;
                const response = await fetch(url);
                const comments = await response.json();

                if (comments && comments.length > 0) {
                    const latest = comments[0];
                    const text = latest.content;

                    // LOG WHAT WE SEE
                    console.log(`💬 Latest comment: "${text}"`);

                    if (text.toLowerCase().includes("!ask") && String(latest.id) !== String(lastCheckedCommentId)) {
                        console.log(`🎯 Trigger Found!`);
                        lastCheckedCommentId = latest.id;

                        const question = text.split(/!ask/i)[1].trim();
                        const result = await model.generateContent(question);
                        const answer = (await result.response).text().substring(0, 400);

                        // Use the session to comment
                        await session.comment({
                            user: process.env.BOT_USERNAME,
                            content: `🤖 @${latest.author.username} ${answer}`,
                            parent: latest.id
                        });
                        console.log("✅ Reply posted!");
                    }
                } else {
                    console.log("⚠️ Still seeing 0 comments. Check if your profile is set to 'Everyone' can comment.");
                }
            } catch (err) {
                console.error("❌ Loop Error:", err.message);
            }
        }, 30000); 

    } catch (error) {
        console.error("❌ Login Failed:", error.message);
    }
}
