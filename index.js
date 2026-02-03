setInterval(async () => {
            try {
                console.log("😴 Checking for new !ask comments...");
                
                // Switch to site-api (Less likely to be blocked by Cloudflare)
                const response = await fetch(`https://scratch.mit.edu/site-api/comments/user/${process.env.BOT_USERNAME}/?cachebust=${Date.now()}`);
                const html = await response.text();
                
                // We parse the HTML manually to find the comments
                // This regex looks for the comment content and the ID
                const commentRegex = /<div id="comments-(\d+)"[\s\S]*?<div class="content">([\s\S]*?)<\/div>/g;
                let match;
                let foundAny = false;

                while ((match = commentRegex.exec(html)) !== null) {
                    foundAny = true;
                    const commentId = match[1];
                    const text = match[2].trim().toLowerCase();

                    // If we find !ask and it's a new ID
                    if (text.includes("!ask") && String(commentId) !== String(lastCheckedCommentId)) {
                        console.log(`🎯 Comment Found: (${text})`);
                        lastCheckedCommentId = commentId;

                        const question = text.split("!ask")[1].trim();
                        console.log(`🤖 Asking Gemini: ${question}`);

                        const result = await model.generateContent(question);
                        const responseAI = await result.response;
                        const answer = responseAI.text().substring(0, 400);

                        await session.comment({
                            user: process.env.BOT_USERNAME,
                            content: `🤖 ${answer}`,
                            parent: commentId
                        });
                        console.log("✅ SUCCESS: Reply posted!");
                        break; // Only handle one comment per loop to be safe
                    }
                }

                if (!foundAny) {
                    console.log("⚠️ Scratch returned empty HTML. Still being blocked or check BOT_USERNAME!");
                }
            } catch (err) {
                console.error("❌ Loop Error:", err.message);
            }
        }, 60000);
