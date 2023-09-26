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

    try {
        window.location.href = "https://discord.com/api/oauth2/authorize?client_id=905841414401851404&redirect_uri=http%3A%2F%2Flocalhost%3A5002%2Fdiscordauth&response_type=code&scope=identify";
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again later.');
    }
}