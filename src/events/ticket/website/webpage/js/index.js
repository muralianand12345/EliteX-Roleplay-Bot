document.addEventListener('DOMContentLoaded', () => {
    fetchFileCount();
});

async function fetchFileCount() {
    const response = await fetch('/filecount');
    const data = await response.json();
    const fileCount = data.fileCount;
    updateFileCount(fileCount);
}

function updateFileCount(count) {
    const fileCountBox = document.getElementById('fileCountBox');
    fileCountBox.textContent = count;
}

function openLoginBox() {
    const loginBox = document.getElementById('loginBox');
    loginBox.style.display = 'block';
}

function closeLoginBox() {
    const loginBox = document.getElementById('loginBox');
    loginBox.style.display = 'none';
}

async function submitLoginForm(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = '/admin';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again later.');
    }
}