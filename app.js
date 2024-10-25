let consultationType = 'ai';
let userName = '访客' + Math.floor(Math.random() * 1000);
let userColor = getRandomColor();

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function setConsultationType(type) {
    consultationType = type;
}

function loadChatHistory() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.innerHTML = '';
    chatHistory.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = message.sender === userName ? 'chat-message user-message' : 'chat-message ai-message';
        // 对 AI 消息应用 Markdown 解析
        messageElement.innerHTML = message.sender === userName ? message.content : parseMarkdown(message.content);
        chatWindow.appendChild(messageElement);
    });
}

function saveChatHistory(sender, content) {
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.push({ sender, content });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function parseMarkdown(text) {
    // 首先移除 Python 的 print 语句
    text = text.replace(/print\((.*?)\)\n?/g, '');

    // 移除重复的段落
    let lines = text.split('\n');
    let uniqueLines = [];
    for (let line of lines) {
        if (!uniqueLines.includes(line)) {
            uniqueLines.push(line);
        }
    }
    text = uniqueLines.join('\n');

    // 转义所有 HTML 特殊字符
    text = text.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });

    // 解析加粗文本
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 解析代码块
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, function(match, language, code) {
        return '<pre><code class="language-' + language + '">' + code.trim() + '</code></pre>';
    });
    
    // 解析内联代码
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return text;
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const chatWindow = document.getElementById('chatWindow');
    
    if (messageInput.value.trim() === '') return;
    
    // 添加用户消息
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user-message';
    userMessage.textContent = messageInput.value;
    chatWindow.appendChild(userMessage);
    
    // 保存用户消息
    saveChatHistory(userName, messageInput.value);

    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';

    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: messageInput.value }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        loadingIndicator.style.display = 'none';

        // 显示AI回复
        const replyMessage = document.createElement('div');
        replyMessage.className = 'chat-message ai-message';
        // 使用 innerHTML 而不是 textContent，并应用 parseMarkdown 函数
        replyMessage.innerHTML = parseMarkdown(data.reply.replace(/<\/?div[^>]*>/g, ''));
        chatWindow.appendChild(replyMessage);
        
        // 保存回复消息
        saveChatHistory('律师', data.reply);

        // 滚动到最新消息
        scrollToBottom();
        
    } catch (error) {
        console.error('Error in sendMessage:', error);
        const errorMessage = document.createElement('div');
        errorMessage.textContent = `抱歉，发生了错误：${error.message}`;
        errorMessage.style.color = 'red';
        chatWindow.appendChild(errorMessage);
        loadingIndicator.style.display = 'none';
    }

    // 清空输入框
    messageInput.value = '';
}

function scrollToBottom() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// 初始化
window.onload = function() {
    document.getElementById('userName').textContent = userName;
    document.getElementById('userAvatar').style.backgroundColor = userColor;
    loadChatHistory();
    scrollToBottom();
}

document.addEventListener('DOMContentLoaded', (event) => {
    const sendButton = document.querySelector('button.btn-primary');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});
