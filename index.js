setInterval(async () => {
            try {
                console.log("😴 Checking for new !ask comments...");
                
                // We add a timestamp to the URL to bypass Scratch's cache
                const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/${process.env.BOT_USERNAME}/?cachebust=${Date.now()}`);
                const html = await response.text();
                
                // This regex is now more flexible to catch different spacing
                const match = html.match(/!ask\s+([^<]+)/i); 
                const commentIdMatch = html.match(/id="comments-(\d+)"/);

                if (match && commentIdMatch) {
                    const question = match[1].trim();
                    const currentId = commentIdMatch[1];

                    // LOG WHAT WE FOUND
                    console.log(`🔎 Found potential ID: ${currentId}`);

                    if (currentId !== lastCheckedCommentId) {
                        console.log(`💬 New Question Detected: ${question}`);
                        lastCheckedCommentId = currentId;

                        const result = await model.generateContent(question);
                        const answer = result.response.text().substring(0, 400);

                        await session.comment({
                            user: process.env.BOT_USERNAME,
                            content: `🤖 ${answer}`,
                            parent: currentId
                        });
                        console.log("✉️ Reply posted successfully!");
                    } else {
                        console.log("📍 Comment found, but it's the same one as before.");
                    }
                } else {
                    console.log("❓ No '!ask' found in the last 5 comments.");
                }
            } catch (err) {
                console.error("⚠️ Loop Error:", err.message);
            }
        }, 60000); // Lowered to 60 seconds for faster testing
