document.addEventListener('DOMContentLoaded', () => {
    fetchFileCount();
    TypeWriter();
});

async function TypeWriter() {
    return new Typed('.type', {
        strings: ['Iconic Roleplay', 'Rage Multiplayer', 'Tamil Roleplay', 'Iconic Ticket Bot', 'Grand Theft Auto V', 'Waiting for GTA VI RP?'],
        typeSpeed: 100,
        backSpeed: 70,
        loop: true,
    });
}

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

async function LoginButton(event) {
    event.preventDefault();
    try {
        window.location.href = "https://discord.com/api/oauth2/authorize?client_id=905841414401851404&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A6969%2Fauth%2Fdiscordauth&scope=identify+email+guilds+connections";
    } catch (error) {
        client.logger.error('Error during login:', error);
        alert('An error occurred during login. Please try again later.');
    }
} 