let fileList = [];
document.addEventListener('DOMContentLoaded', () => {
    fetchFileList();
});

async function fetchFileList() {
    try {
        const response = await fetch('/getfilelist'); // Replace with the actual endpoint
        fileList = await response.json();
        updateFileList();
    } catch (error) {
        console.error('Error fetching file list:', error);
    }
}

function updateFileList(searchText = '') {
    const fileListContainer = document.getElementById('fileList');
    fileListContainer.innerHTML = '';

    if (fileList.length === 0) {
        fileListContainer.innerHTML = '<p>No ticket transcripts available.</p>';
    } else {
        fileList.forEach(file => {
            if (searchText === '' || file.includes(searchText)) {
                const ticketBox = document.createElement('li');
                ticketBox.classList.add('file-list-item');

                const viewLink = document.createElement('a');
                viewLink.classList.add('ticket-link');
                viewLink.textContent = 'View Transcript';
                viewLink.href = `/${file}`;
                viewLink.target = '_blank'; // Open in a new tab

                const fileNameDiv = document.createElement('div');
                fileNameDiv.classList.add('file-name');
                fileNameDiv.textContent = file;

                ticketBox.appendChild(fileNameDiv);
                ticketBox.appendChild(viewLink);

                fileListContainer.appendChild(ticketBox);
            }
        });
    }
}

function handleSearch() {
    const searchText = document.getElementById('searchBar').value;
    updateFileList(searchText);
}

function goToAdminPage() {
    window.location.href = '/admin';
}