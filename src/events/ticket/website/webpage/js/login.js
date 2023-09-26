const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    window.location.href = "https://discord.com/api/oauth2/authorize?client_id=905841414401851404&redirect_uri=http%3A%2F%2Flocalhost%3A5002%2Fdiscordauth&response_type=code&scope=identify";
});

function generateRandomString() {
    let randomString = '';
    const randomNumber = Math.floor(Math.random() * 10);
    for (let i = 0; i < 20 + randomNumber; i++) {
        randomString += String.fromCharCode(33 + Math.floor(Math.random() * 94));
    }
    return randomString;
}