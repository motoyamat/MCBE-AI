const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a Minecraft Bedrock Edition assistant. 
You ONLY answer questions about Minecraft Bedrock Edition game mechanics, crafting, commands, features, and gameplay.
If asked about Java Edition exclusive features (Hardcore mode, Combat Update, NBT tags, mods), politely refuse.
If asked about anything not related to Minecraft Bedrock, politely decline.
Keep answers concise and helpful for Bedrock players.`;

app.post('/api/chat', async (req, res) => {
    const { userPrompt } = req.body;

    if (!userPrompt || userPrompt.length > 500) {
        return res.status(400).json({ 
            reply: "Please ask a valid question (max 500 characters)." 
        });
    }

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
                topP: 0.9,
            }
        });

        const fullPrompt = `${SYSTEM_PROMPT}\n\nUser question: ${userPrompt}`;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        res.json({ 
            reply: text,
            success: true 
        });

    } catch (error) {
        console.error('Gemini Error:', error);
        res.status(500).json({ 
            reply: "⚠️ AI service temporarily unavailable. Please try again.",
            error: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Bedrock Gemini AI',
        version: '1.0.0'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Bedrock Gemini AI Proxy is running!',
        endpoints: {
            chat: '/api/chat (POST)',
            health: '/health (GET)'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Bedrock Gemini Proxy running on port ${PORT}`);
});