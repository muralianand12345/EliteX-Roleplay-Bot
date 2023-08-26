//Navigation Bar JS
const navigation = document.querySelector('.navigation');
document.addEventListener('mousemove', (event) => {
    const mouseX = event.clientX;
    if (mouseX <= 100) {
        navigation.style.left = '0';
    } else {
        navigation.style.left = '-100px';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchFileCount();
    const messageForm = document.getElementById('messageForm');
    const messageEditorForm = document.getElementById('messageEditorForm');
    const roleForm = document.getElementById('roleForm');

    messageForm.addEventListener('submit', submitMessageForm);
    messageEditorForm.addEventListener('submit', submitMessageEditorForm);
    messageEditorForm.addEventListener('input', updateEditedMessage);
    roleForm.addEventListener('submit', fetchDiscordData);

    fetchInitialData();
    fetchProfileInfo();
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

//Functions =============================================================

async function submitMessageForm(event) {
    event.preventDefault();

    const channelIdInput = document.getElementById('channelSelect');
    const manualChannelInput = document.getElementById('manualChannelInput');
    const channelId = channelIdInput.value || manualChannelInput.value;
    const message = document.getElementById('message').value;

    try {
        const response = await fetch('/sendmessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channelId, message })
        });

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
        const channelSelectEditor = document.getElementById('channelSelectEditor');

        // Clear existing options
        channelSelect.innerHTML = '';
        channelSelectEditor.innerHTML = '';

        // Create an option for typing manually
        const manualOption = document.createElement('option');
        manualOption.value = '';
        manualOption.text = 'Type Channel ID';
        channelSelect.appendChild(manualOption);
        channelSelectEditor.appendChild(manualOption.cloneNode(true));

        channels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.id;
            option.text = channel.name;
            channelSelect.appendChild(option);

            const optionEditor = document.createElement('option');
            optionEditor.value = channel.id;
            optionEditor.text = channel.name;
            channelSelectEditor.appendChild(optionEditor);
        });
    } catch (error) {
        console.error('Error fetching channels:', error);
    }
}

async function fetchChannels() {
    try {
        const response = await fetch('/getchannels');
        const channels = await response.json();

        availableChannels.length = 0;
        channels.forEach(channel => {
            availableChannels.push({ id: channel.id, name: channel.name });
        });
    } catch (error) {
        console.error('Error fetching channels:', error);
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

async function submitMessageEditorForm(event) {
    event.preventDefault();

    const channelIdInput = document.getElementById('channelSelectEditor');
    const manualChannelInput = document.getElementById('manualChannelEditorInput');
    const channelId = channelIdInput.value || manualChannelInput.value;
    const messageId = document.getElementById('messageId').value;
    const editedMessage = document.getElementById('editedMessage').value;

    const editedMessageTextarea = document.getElementById('editedMessage');

    if (!channelId || !messageId) {
        editedMessageTextarea.value = 'Please provide both channel and message ID.';
        return;
    }

    try {
        const response = await fetch('/editmessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channelId, messageId, editedMessage })
        });

        if (response.ok) {
            alert('Message edited successfully!');
        } else {
            alert('Failed to edit message. Please try again.');
        }
    } catch (error) {
        console.error('Error editing message:', error);
        alert('An error occurred while editing the message. Please try again later.');
    }
}

let previousMessageId = '';

function updateEditedMessage() {

    const channelIdInput = document.getElementById('channelSelectEditor');
    const manualChannelInput = document.getElementById('manualChannelEditorInput');
    const channelId = channelIdInput.value || manualChannelInput.value;
    const messageId = document.getElementById('messageId').value;

    const editedMessageTextarea = document.getElementById('editedMessage');

    if (!messageId || !channelId) {
        editedMessageTextarea.value = 'Please provide channel and message ID.';
        return;
    }

    if (messageId === previousMessageId) {
        return;
    }

    fetch(`/getmessage/${messageId}?channelId=${channelId}`)
        .then(response => response.json())
        .then(data => {
            editedMessageTextarea.value = data.messageContent;
            previousMessageId = messageId;
        })
        .catch(error => {
            console.error('Error fetching message content:', error);
            editedMessageTextarea.value = 'An error occurred while fetching the message content.';
        });
}

async function fetchDiscordData(event) {
    event.preventDefault();
    const userId = document.getElementById('userId').value;
    const roleId = document.getElementById('roleSelect').value;
    const action = document.getElementById('actionSelect').value;

    try {
        const response = await fetch('/getdiscorddata', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, roleId, action })
        });
        
        const result = await response.json();
        if (response.ok) {
            if (result.success) {
                alert(`Success: ${result.message}`);
            } else {
                alert(`Failed: ${result.message}`);
            }
        } else {
            alert(`Failed: ${result.message}`);
        }
    } catch (error) {
        console.error('Error fetching Discord data:', error);
        alert('An error occurred while fetching Discord data. Please try again later.');
    }
}

async function populateRoleDropdown() {
    try {
        const response = await fetch('/getroles');
        const data = await response.json();

        if (response.ok) {
            const roleSelect = document.getElementById('roleSelect');
            roleSelect.innerHTML = ''; 

            data.roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name;
                roleSelect.appendChild(option);
            });
        } else {
            console.error('Failed to fetch role data:', data.error);
        }
    } catch (error) {
        console.error('Error fetching role data:', error);
    }
}

function viewTicketLog() {
    window.location.href = '/ticket';
}

function embedRedirect() {
    window.location.href = '/embed';
}

//Helper Functions =============================================================

function getChannelIdFromName(channelName) {
    const channel = availableChannels.find(channel => channel.name.toLowerCase() === channelName.toLowerCase());
    return channel ? channel.id : null;
}

async function fetchInitialData() {
    try {
        await fetchChannels();
        await populateRoleDropdown();
        await fetchChannelsOption();
    } catch (error) {
        console.error('Error fetching initial data:', error);
    }
}

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
        await fetch('/filecount');
    } catch (error) {
        console.error('Error fetching file count:', error);
    }
}