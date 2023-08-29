const roleSelect = document.getElementById('roleSelect');
const roleBulkManagerForm = document.getElementById('roleBulkManager');

document.addEventListener('DOMContentLoaded', () => {
    populateRoleOptions();
});
roleBulkManagerForm.addEventListener('submit', handleRoleBulkChange);

async function populateRoleOptions() {
    try {
        const response = await fetch('/superadmin/getroles');
        const roles = await response.json();

        roleSelect.innerHTML = '';

        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            option.style.backgroundColor = role.color;
            roleSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
    }
}

async function handleRoleBulkChange(event) {
    event.preventDefault();

    const roleId = roleSelect.value;
    const action = document.getElementById('actionSelect').value;
    const userIds = document.getElementById('message').value.split(',');

    try {
        const response = await fetch('/superadmin/rolebulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roleId,
                action,
                userIds,
            }),
        });

        const result = await response.json();

        if (result.message) {
            alert(result.message);
        } else if (result.error) {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error sending role bulk change:', error);
    }
}


// Function ------------------------------

function goToAdminPage() {
    window.location.href = '/admin';
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
