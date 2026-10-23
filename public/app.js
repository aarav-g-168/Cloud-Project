const API_BASE = '/api';

// DOM Elements
const healthStatus = document.getElementById('health-status');
const refreshHealthBtn = document.getElementById('refresh-health');
const userForm = document.getElementById('user-form');
const formMessage = document.getElementById('form-message');
const usersBody = document.getElementById('users-body');
const refreshUsersBtn = document.getElementById('refresh-users');

// Health Check
async function fetchHealth() {
  try {
    healthStatus.innerHTML = '<div class="loading">Checking health...</div>';
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    renderHealth(data);
  } catch (error) {
    healthStatus.innerHTML = `<div class="health-status-badge degraded">Error: ${error.message}</div>`;
  }
}

function renderHealth(data) {
  const badgeClass = data.status === 'healthy' ? 'healthy' : 'degraded';
  healthStatus.innerHTML = `
    <div class="health-status">
      <div class="health-item">
        <h3>Overall Status</h3>
        <span class="health-status-badge ${badgeClass}">${data.status.toUpperCase()}</span>
      </div>
      <div class="health-item">
        <h3>Database</h3>
        <span class="value">${data.database.connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div class="health-item">
        <h3>DB Response Time</h3>
        <span class="value">${data.database.responseTimeMs}ms</span>
      </div>
      <div class="health-item">
        <h3>Server</h3>
        <span class="value">${data.server.hostname}</span>
      </div>
      <div class="health-item">
        <h3>Uptime</h3>
        <span class="value">${Math.floor(data.uptime)}s</span>
      </div>
      <div class="health-item">
        <h3>Node.js</h3>
        <span class="value">${data.server.nodeVersion}</span>
      </div>
    </div>
  `;
}

// Users
async function fetchUsers() {
  try {
    usersBody.innerHTML = '<tr><td colspan="4" class="loading">Loading users...</td></tr>';
    const response = await fetch(`${API_BASE}/users`);
    const data = await response.json();
    renderUsers(data.users);
  } catch (error) {
    usersBody.innerHTML = `<tr><td colspan="4" class="loading">Error: ${error.message}</td></tr>`;
  }
}

function renderUsers(users) {
  if (users.length === 0) {
    usersBody.innerHTML = '<tr><td colspan="4" class="loading">No users yet</td></tr>';
    return;
  }
  usersBody.innerHTML = users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${formatDate(user.created_at)}</td>
    </tr>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Add User
userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage.style.display = 'none';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();

  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    const data = await response.json();

    if (response.ok) {
      showMessage('User added successfully!', 'success');
      userForm.reset();
      fetchUsers();
    } else {
      showMessage(data.error || 'Failed to add user', 'error');
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
  }
});

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = type;
  formMessage.style.display = 'block';
}

// Event Listeners
refreshHealthBtn.addEventListener('click', fetchHealth);
refreshUsersBtn.addEventListener('click', fetchUsers);

// Initial Load
fetchHealth();
fetchUsers();