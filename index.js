// Loop every 2 minutes
        setInterval(async () => {
            try {
                console.log("😴 Checking for new !ask comments...");
                
                const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/${process.env.BOT_USERNAME}/?count=5`);
                const html = await response.text();
                
                const match = html.match(/!ask\s+([^<]+)/);
                const commentIdMatch = html.match(/id="comments-(\d+)"/);

                if (match && commentIdMatch) {
                    const question = match[1].trim();
                    const currentId = commentIdMatch[1];

                    if (currentId !== lastCheckedCommentId) {
                        console.log(`💬 New Question: ${question}`);
                        lastCheckedCommentId = currentId;

                        const result = await model.generateContent(question);
                        const answer = result.response.text().substring(0, 400);

                        await session.comment({
                            user: process.env.BOT_USERNAME,
                            content: `🤖 @${process.env.BOT_USERNAME} ${answer}`,
                            parent: currentId
                        });
                        console.log("✉️ Reply posted!");
                    }
                }
            } catch (err) {
                console.error("⚠️ Loop Error:", err.message);
            }
        }, 120000); // The comma belongs INSIDE the function call, not after a stray bracket!

    } catch (error) {
        console.error("❌ Fatal Error:", error.message);
    }
}

runBot();
