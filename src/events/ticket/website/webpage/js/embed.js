document.getElementById('add-field-button').addEventListener('click', function () {
    const fieldsContainer = document.getElementById('fields-container');
    const fieldElement = document.createElement('div');
    fieldElement.classList.add('dynamic-field');
    fieldElement.innerHTML = `
        <input type="text" placeholder="Field Name">
        <input type="text" placeholder="Field Value">
        <button type="button" class="remove-field-button">Remove</button>
    `;
    fieldsContainer.appendChild(fieldElement);

    fieldElement.querySelector('.remove-field-button').addEventListener('click', function () {
        fieldsContainer.removeChild(fieldElement);
    });
});

function sendEmbed() {
    const embedData = {
        webhook: document.getElementById('webhook').value,
        color: document.getElementById('color').value,
        title: document.getElementById('title').value,
        url: document.getElementById('url').value,
        author: document.getElementById('author').value,
        description: document.getElementById('description').value,
        thumbnail: document.getElementById('thumbnail').value,
        fields: getFieldsData(),
        image: document.getElementById('image').value,
        timestamp: document.getElementById('timestamp').checked,
        footer: document.getElementById('footer').value
    };


    if (embedData.image || embedData.thumbnail) {
        if (!isValidUrl(embedData.image) || !isValidUrl(embedData.thumbnail)) {
            alert('Invalid image or thumbnail URL. Please provide valid URLs.');
            return;
        }
    }

    if (!isValidWebhookUrl(embedData.webhook)) {
        alert('Invalid Webhook URL');
        return;
    }

    fetch('/sendembed', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(embedData)
    })
        .then(data => {
            if (data.message) {
                alert(data.message);
            } else if (data.error) {
                alert(data.error);
            }
        })
        .catch(error => {
            console.error('Error sending embed:', error);
        });

}

// Function ------------------------------------------

function isValidUrl(url) {
    const urlPattern = /^(http|https):\/\/.*\.(png|jpeg|jpg)$/i;
    return urlPattern.test(url);
}

function isValidWebhookUrl(url) {
    const webhookPattern = /^(http|https):\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9-_]+$/i;
    return webhookPattern.test(url);
}

function getFieldsData() {
    const fieldsContainer = document.getElementById('fields-container');
    const fieldElements = fieldsContainer.querySelectorAll('.dynamic-field');

    const fieldsData = [];

    fieldElements.forEach(fieldElement => {
        const fieldName = fieldElement.querySelector('input[type="text"]').value;
        const fieldValue = fieldElement.querySelector('input[type="text"]:nth-child(2)').value;

        if (fieldName && fieldValue) {
            fieldsData.push({ name: fieldName, value: fieldValue });
        }
    });

    return fieldsData;
}