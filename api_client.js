const axios = require('axios');
const jwt = require('jsonwebtoken');

// 从环境变量中获取API Key
const API_KEY = process.env.ZHIPUAI_API_KEY;

// 生成JWT令牌
function generateToken(apiKey, expSeconds = 3600) {
    if (!apiKey || !apiKey.includes('.')) {
        throw new Error('Invalid API Key format. It should be in the format of "id.secret"');
    }
    const [id, secret] = apiKey.split('.');
    if (!id || !secret) {
        throw new Error('API Key is missing id or secret part');
    }
    const payload = {
        api_key: id,
        exp: Math.floor(Date.now() / 1000) + expSeconds,
        timestamp: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, secret, {
        algorithm: 'HS256',
        header: { alg: 'HS256', sign_type: 'SIGN' }
    });
}

// 创建一个带有认证的axios实例
const api = axios.create({
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    headers: {
        'Content-Type': 'application/json'
    }
});

// 添加请求拦截器来设置认证头
api.interceptors.request.use((config) => {
    if (!API_KEY) {
        throw new Error('API Key is not set. Please set the ZHIPUAI_API_KEY environment variable.');
    }
    const token = generateToken(API_KEY);
    config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

// 示例：发送聊天请求
async function sendChatRequest(message) {
    try {
        console.log('Sending request to API with message:', message);

        // 检查是否是问候语
        const greetings = ['你好', '您好', 'hello', 'hi', '嗨', '哈喽'];
        if (greetings.some(greeting => message.toLowerCase().includes(greeting))) {
            return {
                choices: [{
                    message: {
                        content: "尊敬的用户您好！我是您的ai律师，可以和您聊天，基于法条回答您一些简单的问题，您也可以咨询我们的专业律师，以获得更为准确和详细的法律建议。"
                    }
                }]
            };
        }

        const response = await api.post('/chat/completions', {
            model: 'glm-4',
            messages: [
                {
                    role: 'system',
                    content: '你是一位精通中国法律条文的律师。你的回答应该基于最新的法律法规，并提供准确、专业的法律建议。如果遇到不确定的情况，你应该建议咨询其他专业律师或相关部门。'
                },
                {
                    role: 'user',
                    content: message
                }
            ]
        });
        console.log('Received API response:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('Error in sendChatRequest:', error);
        if (error.response) {
            console.error('API response error:', error.response.data);
            console.error('API response status:', error.response.status);
            console.error('API response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw error;
    }
}

// 使用示例
// async function main() {
//     if (!API_KEY) {
//         console.error('API Key is not set. Please set the ZHIPUAI_API_KEY environment variable.');
//         return;
//     }
//     console.log('API Key format:', API_KEY.split('.').map(part => part.length).join('.'));
//     try {
//         const result = await sendChatRequest('你好');
//         console.log('AI回复:', result.choices[0].message.content);
//     } catch (error) {
//         console.error('请求失败:', error);
//     }
// }

// main();

// 添加这行来导出 sendChatRequest 函数
module.exports = { sendChatRequest };
