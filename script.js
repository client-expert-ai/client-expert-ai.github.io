// DOM Elements
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const welcomeScreen = document.getElementById('welcome-screen');
const newChatBtn = document.getElementById('new-chat-btn');
const newChatBtnSidebar = document.getElementById('new-chat-btn-sidebar');
const attachmentBtn = document.getElementById('attachment-btn');
const fileInput = document.getElementById('file-input');
const themeToggle = document.getElementById('theme-toggle');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const historyList = document.getElementById('history-list');
let activeChatId = null;
let chatHistoryGroups = [];

// Webhook URL
const WEBHOOK_URL = 'https://yilmazta.app.n8n.cloud/webhook/aa440e2f-ca98-4892-a4d8-6446b7977aa7';

// Theme management
let currentTheme = localStorage.getItem('theme') || 'light';

// Initialize theme
function initializeTheme() {
    if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Toggle theme
function toggleTheme() {
    const root = document.documentElement;
    root.classList.add('disable-theme-transition');
    if (currentTheme === 'light') {
        currentTheme = 'dark';
        root.classList.add('dark');
    } else {
        currentTheme = 'light';
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', currentTheme);
    window.requestAnimationFrame(() => {
        root.classList.remove('disable-theme-transition');
    });
}

// Initialize theme on load
initializeTheme();

// Event Listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

newChatBtn.addEventListener('click', () => {
    resetChat();
});

if (newChatBtnSidebar) {
    newChatBtnSidebar.addEventListener('click', () => {
        resetChat();
    });
}

themeToggle.addEventListener('click', toggleTheme);

if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-is-open');
    });
}

attachmentBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleFileUpload);

document.addEventListener('DOMContentLoaded', () => {
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            const suggestion = card.getAttribute('data-suggestion');
            if (suggestion) {
                userInput.value = suggestion;
                sendMessage();
            }
        });
    });
});

window.addEventListener('load', () => {
    userInput.focus();
    if (historyList) {
        chatHistoryGroups = seedDemoHistory();
        activeChatId = chatHistoryGroups[1]?.items?.[1]?.id || null;
        renderHistoryList(chatHistoryGroups, activeChatId);
    }
});

function seedDemoHistory() {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const fmt = (d) => d.toISOString().slice(0, 10);

    return [
        {
            dateKey: fmt(today),
            label: 'Today',
            items: [
                { id: 'c1', title: "Github commit related to authentication" },
                { id: 'c2', title: 'n8n and workflow automation' },
                { id: 'c3', title: 'Slack and Google Sheets integration' },
            ],
        },
        {
            dateKey: fmt(yesterday),
            label: 'Yesterday',
            items: [
                { id: 'c4', title: 'How to create an AI agent?' }
            ],
        },
    ];
}

function renderHistoryList(groups, currentId) {
    historyList.innerHTML = '';
    document.addEventListener('click', handleGlobalClickForContextMenu);
    groups.forEach((group, groupIdx) => {
        const title = document.createElement('div');
        title.className = 'history-group-title';
        title.textContent = group.label || group.dateKey;
        historyList.appendChild(title);

        group.items.forEach((item) => {
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'history-item';
            if (item.id === currentId) a.classList.add('active');
            a.dataset.chatId = item.id;

            const spanTitle = document.createElement('span');
            spanTitle.className = 'history-item-title';
            spanTitle.textContent = item.title;

            const spanActions = document.createElement('span');
            spanActions.className = 'history-item-actions';
            spanActions.innerHTML = svgEllipsisIcon();
            spanActions.tabIndex = 0;
            spanActions.setAttribute('role', 'button');
            spanActions.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (openContextMenu && openContextMenu.__anchor === spanActions) {
                    closeContextMenu();
                    return;
                }
                openContextMenuForItem(spanActions, item);
            });

            a.appendChild(spanTitle);
a.appendChild(spanActions);

            a.addEventListener('click', (e) => {
                e.preventDefault();
                const prev = document.querySelector('.history-item.active');
                if (prev && prev !== a) prev.classList.remove('active');
                a.classList.add('active');
                setActiveHistoryItem(item.id);
            });

            historyList.appendChild(a);
        });

        if (groupIdx < groups.length - 1) {
            const spacer = document.createElement('div');
            spacer.style.height = '8px';
            historyList.appendChild(spacer);
        }
    });

    const end = document.createElement('div');
    end.className = 'history-end';
    end.textContent = 'You have reached the end of your chat history.';
    historyList.appendChild(end);
}

function setActiveHistoryItem(id) {
    activeChatId = id;
    const items = historyList.querySelectorAll('.history-item');
    items.forEach((el) => {
        if (el.dataset.chatId === id) el.classList.add('active');
        else el.classList.remove('active');
    });
}

function svgEllipsisIcon() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
}

let openContextMenu = null;
function openContextMenuForItem(anchorEl, item) {
    closeContextMenu();
    const rect = anchorEl.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'context-menu';

    const share = document.createElement('div');
    share.className = 'context-menu-item';
    share.innerHTML = svgShareIcon() + '<span>Share</span>';
    share.addEventListener('click', (e) => {
        e.stopPropagation();
        closeContextMenu();
        console.log('Share chat', item.id);
    });

    const del = document.createElement('div');
    del.className = 'context-menu-item delete-item';
    del.innerHTML = svgTrashIcon() + '<span>Delete</span>';
    del.addEventListener('click', (e) => {
        e.stopPropagation();
        chatHistoryGroups.forEach((group) => {
            group.items = group.items.filter((it) => it.id !== item.id);
        });
        chatHistoryGroups = chatHistoryGroups.filter((g) => g.items.length > 0);
        renderHistoryList(chatHistoryGroups, activeChatId === item.id ? null : activeChatId);
        closeContextMenu();
    });

    menu.appendChild(share);
    menu.appendChild(del);

    document.body.appendChild(menu);
    const top = rect.bottom + window.scrollY + 6;
    const left = rect.right + window.scrollX - menu.offsetWidth;
    menu.style.top = `${top}px`;
    menu.style.left = `${Math.max(8, left)}px`;
    openContextMenu = menu;
    openContextMenu.__anchor = anchorEl;
}

function closeContextMenu() {
    if (openContextMenu && openContextMenu.parentNode) {
        openContextMenu.parentNode.removeChild(openContextMenu);
    }
    openContextMenu = null;
}

function handleGlobalClickForContextMenu(e) {
    const target = e.target;
    if (openContextMenu && !openContextMenu.contains(target)) {
        closeContextMenu();
    }
}

function svgShareIcon() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';
}

function svgTrashIcon() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>';
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        if (welcomeScreen.style.display !== 'none') {
            showChatWindow();
        }
        displayFileAttachment(files);
        event.target.value = '';
    }
}

function displayFileAttachment(files) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user';
    
    let fileList = '';
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSize = (file.size / 1024).toFixed(1);
        fileList += `
            <div class="file-attachment">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14,2 14,8 20,8"/>
                </svg>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${fileSize} KB)</span>
            </div>
        `;
    }
    
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-text">
                <div class="attachment-header">📎 Attached files:</div>
                ${fileList}
            </div>
        </div>
    `;
    
    chatWindow.appendChild(messageElement);
    scrollToBottom();
    console.log('Files attached:', files);
}

function resetChat() {
    chatWindow.innerHTML = '';
    welcomeScreen.style.display = 'flex';
    chatWindow.style.display = 'none';
    userInput.value = '';
    userInput.focus();
}

function showChatWindow() {
    welcomeScreen.style.display = 'none';
    chatWindow.style.display = 'block';
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    if (welcomeScreen.style.display !== 'none') {
        showChatWindow();
    }
    
    userInput.value = '';
    displayUserMessage(message);
    showTypingIndicator();
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: message,
                question: message,
                message: message,
                input: message,
                text: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let data;
        const responseText = await response.text();
        console.log('Raw n8n Response:', responseText);
        
        try {
            data = JSON.parse(responseText);
            console.log('Parsed JSON data:', data);
        } catch (e) {
            console.log('Failed to parse JSON, treating as string');
            data = responseText;
        }
        
        hideTypingIndicator();
        displayAssistantMessage(data);
        
    } catch (error) {
        console.error('Error sending message:', error);
        hideTypingIndicator();
        displayErrorMessage('Sorry, I encountered an error while processing your request. Please try again.');
    }
}

function displayUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user';
    
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-text">${escapeHtml(message)}</div>
        </div>
    `;
    
    chatWindow.appendChild(messageElement);
    scrollToBottom();
}

function displayAssistantMessage(data) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant';

    let { answer } = normalizeAssistantPayload(data);

    // --- SMART SOURCES FORMATTING LOGIC ---
    let mainAnswer = answer;
    let sourcesMarkdown = '';

    const sourcesSeparator = '\n---\nSources:';
    if (answer.includes(sourcesSeparator)) {
        const parts = answer.split(sourcesSeparator);
        mainAnswer = parts[0];
        let sourcesRaw = parts[1].trim();
        
        const sourceLines = sourcesRaw.split('\n').filter(line => line.trim() !== '');
        
        // Ensure each source line becomes a Markdown list item
        sourcesMarkdown = '\n\n---\n\n**Sources:**\n' + sourceLines.map(line => {
            // If the line already starts with a list marker, keep it. Otherwise, add it.
            return line.trim().startsWith('* ') ? line.trim() : `* ${line.trim()}`;
        }).join('\n');
    }
    // --- END OF FORMATTING LOGIC ---

    const finalMarkdownToRender = mainAnswer + sourcesMarkdown;

    const avatar = document.createElement('div');
    avatar.className = 'assistant-avatar';
    avatar.innerHTML = svgSparklesIcon();

    const content = document.createElement('div');
    content.className = 'message-content';

    const textContainer = document.createElement('div');
    textContainer.className = 'message-text';
    textContainer.innerHTML = renderRichMessage(finalMarkdownToRender);
    content.appendChild(textContainer);

    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'message-action-btn';
    copyBtn.type = 'button';
    copyBtn.innerHTML = svgCopyIcon();
    copyBtn.title = 'Copy';
    copyBtn.addEventListener('click', async () => {
        const text = getPlainTextFromMessage(content);
        if (!text || !text.trim()) return;
        try {
            await navigator.clipboard.writeText(text);
            copyBtn.classList.add('is-active');
            const previous = copyBtn.innerHTML;
            copyBtn.innerHTML = svgCheckIcon();
            setTimeout(() => { copyBtn.classList.remove('is-active'); copyBtn.innerHTML = previous; }, 1200);
        } catch (e) {
            console.warn('Copy failed', e);
        }
    });

    const likeBtn = document.createElement('button');
    likeBtn.className = 'message-action-btn';
    likeBtn.type = 'button';
    likeBtn.innerHTML = svgThumbUpIcon();
    likeBtn.title = 'Like';
    likeBtn.addEventListener('click', () => {
        likeBtn.classList.add('is-active');
        dislikeBtn.classList.remove('is-active');
    });

    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'message-action-btn';
    dislikeBtn.type = 'button';
    dislikeBtn.innerHTML = svgThumbDownIcon();
    dislikeBtn.title = 'Dislike';
    dislikeBtn.addEventListener('click', () => {
        dislikeBtn.classList.add('is-active');
        likeBtn.classList.remove('is-active');
    });

    actions.appendChild(copyBtn);
    actions.appendChild(likeBtn);
    actions.appendChild(dislikeBtn);

    content.appendChild(actions);
    messageElement.appendChild(avatar);
    messageElement.appendChild(content);
    chatWindow.appendChild(messageElement);
    scrollToBottom();
}


function normalizeAssistantPayload(data) {
    if (typeof data === 'string') return { answer: data, sources: [] };
    const answer = data?.output || data?.answer || data?.response || data?.message || data?.text || data?.content || 'I apologize, but I couldn\'t generate a response.';
    const sources = Array.isArray(data?.sources) ? data.sources : [];
    return { answer, sources };
}

function renderRichMessage(text) {
    if (!text) return '';
    if (window.marked) {
        return window.marked.parse(text);
    } else {
        console.error('Marked.js library not loaded. Falling back to basic formatting.');
        return text.replace(/\n/g, '<br>');
    }
}

function svgSparklesIcon() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.546 4.454L18 9l-4.454 1.546L12 15l-1.546-4.454L6 9l4.454-1.546L12 3z"/><path d="M5 16l.773 2.227L8 19l-2.227.773L5 22l-.773-2.227L2 19l2.227-.773L5 16z"/><path d="M19 13l.773 2.227L22 16l-2.227.773L19 19l-.773-2.227L16 16l2.227-.773L19 13z"/></svg>';
}

function svgCopyIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
}

function svgThumbUpIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h9.28a2 2 0 0 0 2-1.72l1.38-9A2 2 0 0 0 17.68 9z"></path><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
}

function svgThumbDownIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H7.72a2 2 0 0 0-2 1.72L4.34 13a2 2 0 0 0 1.94 2H10z"></path><path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>';
}

function svgCheckIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
}

function getPlainTextFromMessage(container) {
    const clone = container.querySelector('.message-text')?.cloneNode(true);
    if (!clone) return '';
    
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null);
    let acc = '';
    let node;
    while ((node = walker.nextNode())) {
        acc += node.nodeValue + '\n';
    }
    return acc.trim();
}

function displayErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    chatWindow.appendChild(errorElement);
    scrollToBottom();
}

function showTypingIndicator() {
    const typingElement = document.createElement('div');
    typingElement.className = 'message assistant typing-indicator';
    typingElement.id = 'typing-indicator';
    
    typingElement.innerHTML = `
        <div class="message-content">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    chatWindow.appendChild(typingElement);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}