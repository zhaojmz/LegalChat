const express = require('express');
const { sendChatRequest } = require('./api_client');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

app.post('/api/chat', (req, res) => {
    try {
        const { message, type } = req.body;
        let reply = '';

        if (type === 'ai') {
            reply = `AI助手: 您的问题是"${message}"。这是一个AI生成的回复示例。`;
        } else {
            reply = `律师: 您的问题是"${message}"。这是一个模拟的律师回复示例。`;
        }

        res.json({ reply });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

app.post('/api/ai-chat', async (req, res) => {
    try {
        const { message } = req.body;
        console.log('Received message:', message);
        
        console.log('Calling sendChatRequest...');
        const result = await sendChatRequest(message);
        console.log('sendChatRequest result:', JSON.stringify(result, null, 2));
        
        if (!result || !result.choices || !result.choices[0] || !result.choices[0].message) {
            throw new Error('Invalid response from AI API');
        }
        
        const reply = result.choices[0].message.content;
        console.log('AI reply:', reply);
        
        res.json({ reply });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ 
            error: 'An error occurred while processing your request',
            details: error.message,
            stack: error.stack
        });
    }
});

// 添加一个通用的错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${server.address().port}`);
});

console.log('ZHIPUAI_API_KEY:', process.env.ZHIPUAI_API_KEY ? 'Set' : 'Not set');
if (!process.env.ZHIPUAI_API_KEY) {
    console.error('ZHIPUAI_API_KEY is not set. Please set the environment variable.');
    process.exit(1);
}

// 如果你想保留测试 API 调用，可以取消下面这行的注释
// sendChatRequest('测试消息').then(console.log).catch(console.error);
