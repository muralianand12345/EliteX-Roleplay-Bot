document.addEventListener('DOMContentLoaded', () => {
    fetchFileCount();
    const messageForm = document.getElementById('messageForm');
    messageForm.addEventListener('submit', submitMessageForm);
    fetchInitialData();
    fetchProfileInfo();
    setupMessageEditor();
});

const messageTextarea = document.getElementById('message');
const autocompleteSuggestions = document.getElementById('autocomplete-suggestions');
const availableChannels = [];

messageTextarea.addEventListener('input', function () {
    const content = messageTextarea.value;
    const cursorPosition = messageTextarea.selectionStart;
    const typedText = content.substring(0, cursorPosition).split(' ').pop();

    autocompleteSuggestions.innerHTML = '';

    if (typedText.startsWith('#')) {
        showSuggestions(availableChannels, typedText.substring(1));
    }
});

fetchChannelsOption();

//Functions =============================================================

function logout() {
    fetch('/logout')
        .then((response) => {
            window.location.href = '/login';
        })
        .catch((error) => {
            console.error('Error during logout:', error);
            window.location.href = '/login';
        });
}

async function fetchFileCount() {
    try {
        const response = await fetch('/filecount');
        const data = await response.json();
    } catch (error) {
        console.error('Error fetching file count:', error);
    }
}

async function submitMessageForm(event) {
    event.preventDefault();

    const channelId = document.getElementById('channelSelect').value;
    const message = document.getElementById('message').value;

    try {
        const response = await fetch('/sendmessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channelId, message })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Message sent successfully!');
        } else {
            alert('Failed to send message. Please try again.');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('An error occurred while sending the message. Please try again later.');
    }
}

async function fetchChannelsOption() {
    try {
        const response = await fetch('/getchannels');
        const channels = await response.json();
        const channelSelect = document.getElementById('channelSelect');
        channelSelect.innerHTML = '';

        channels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.id;
            option.text = channel.name;
            channelSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching channels:', error);
    }
}

async function fetchChannels() {
    try {
        const response = await fetch('/getchannels');
        const channels = await response.json();

        availableChannels.length = 0; // Clear existing array
        channels.forEach(channel => {
            availableChannels.push({ id: channel.id, name: channel.name });
        });
    } catch (error) {
        console.error('Error fetching channels:', error);
    }
}

async function fetchInitialData() {
    try {
        await fetchChannels();
    } catch (error) {
        console.error('Error fetching initial data:', error);
    }
}

function showSuggestions(availableItems, typedText) {
    const matchedItems = availableItems.filter(item =>
        item.name.toLowerCase().includes(typedText.toLowerCase())
    );

    autocompleteSuggestions.innerHTML = '';

    matchedItems.forEach(matchedItem => {
        const suggestion = document.createElement('div');
        suggestion.className = 'autocomplete-suggestion';
        suggestion.textContent = matchedItem.name;
        autocompleteSuggestions.appendChild(suggestion);
    });

    autocompleteSuggestions.addEventListener('click', (event) => {
        const clickedSuggestion = event.target.textContent;
        const currentContent = messageTextarea.value;
        const cursorPosition = messageTextarea.selectionStart;
        const typedText = currentContent.substring(0, cursorPosition).split(' ').pop();
        const prefix = currentContent.substring(0, cursorPosition - typedText.length);
        const suffix = currentContent.substring(cursorPosition);

        let mentionText = '';

        if (typedText.startsWith('#')) {
            const channelId = getChannelIdFromName(clickedSuggestion);
            if (channelId) {
                mentionText = `<#${channelId}> `;
            }
        }

        messageTextarea.value = prefix + mentionText + suffix;
        messageTextarea.focus();
        autocompleteSuggestions.innerHTML = '';
    });
}

async function fetchProfileInfo() {
    try {
        const response = await fetch('/getprofile');
        const profileInfo = await response.json();

        const profileInfoDiv = document.getElementById('profile-info');
        const avatarUrl = `https://cdn.discordapp.com/avatars/${profileInfo.discordId}/${profileInfo.discordAvatar}.png`;

        profileInfoDiv.innerHTML = `
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="${avatarUrl}" alt="Avatar" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px;">
    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${profileInfo.discordUsername}</span>
</div>`;
    } catch (error) {
        console.error('Error fetching profile information:', error);
    }
}

function setupMessageEditor() {
    const messageIdInput = document.getElementById('messageId');
    const editedMessageTextarea = document.getElementById('editedMessage');

    messageIdInput.addEventListener('input', async () => {
        editedMessageTextarea.value = '';
        const messageId = messageIdInput.value;
        if (!messageId) {
            return;
        }
        await delay(2000);
        const messageContent = await getMessageContent(messageId);
        if (messageContent) {
            editedMessageTextarea.value = messageContent;
        }
    });

    const messageEditorForm = document.getElementById('messageEditorForm');
    messageEditorForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const messageId = messageIdInput.value;
        const editedMessage = editedMessageTextarea.value;
        if (!messageId || !editedMessage) {
            alert('Please enter a message ID and an edited message.');
            return;
        }
        const success = await editAndSendMessage(messageId, editedMessage);
        if (success) {
            alert('Message edited and sent successfully!');
        } else {
            alert('Failed to edit and send message. Please check the message ID and content.');
        }
    });
}

//Helper Functions =============================================================

function getChannelIdFromName(channelName) {
    const channel = availableChannels.find(channel => channel.name.toLowerCase() === channelName.toLowerCase());
    return channel ? channel.id : null;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMessageContent(messageId) {
    try {
        const response = await fetch(`/getmessage/${messageId}`);
        const data = await response.json();
        return response.ok ? data.messageContent : null;
    } catch (error) {
        console.error('Error retrieving message:', error);
        return null;
    }
}

async function editAndSendMessage(messageId, editedMessage) {
    try {
        const response = await fetch(`/editmessage/${messageId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ editedMessage })
        });

        return response.ok;
    } catch (error) {
        console.error('Error editing and sending message:', error);
        return false;
    }
}