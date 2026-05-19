/* ========== App Core — Navigation, Toast, API Status ========== */

// Toast system
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Navigation
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.dataset.view;

      // Update nav active state
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Show target view
      views.forEach(v => v.classList.remove('active'));
      document.getElementById(targetView).classList.add('active');

      // Load history when switching to history view
      if (targetView === 'history-view') {
        loadHistory();
      }

      // Load API status when switching to settings view
      if (targetView === 'settings-view') {
        checkApiStatus();
      }
    });
  });
}

// Check API status
async function checkApiStatus() {
  try {
    const res = await fetch('/api/quiz/status');
    const status = await res.json();

    const dot = document.querySelector('.status-dot');
    const text = document.querySelector('.status-text');

    if (status.totalConfigured === 0) {
      dot.className = 'status-dot error';
      text.textContent = '0 APIs';
    } else if (status.totalConfigured < 3) {
      dot.className = 'status-dot warning';
      text.textContent = `${status.totalConfigured}/3 APIs`;
    } else {
      dot.className = 'status-dot active';
      text.textContent = '3/3 APIs';
    }

    // Update settings page
    const openaiStatus = document.getElementById('openai-status');
    const anthropicStatus = document.getElementById('anthropic-status');
    const geminiStatus = document.getElementById('gemini-status');

    if (openaiStatus) {
      openaiStatus.className = `setting-status ${status.openai ? 'active' : 'inactive'}`;
      openaiStatus.textContent = status.openai ? '✅' : '⭕';
    }
    if (anthropicStatus) {
      anthropicStatus.className = `setting-status ${status.anthropic ? 'active' : 'inactive'}`;
      anthropicStatus.textContent = status.anthropic ? '✅' : '⭕';
    }
    if (geminiStatus) {
      geminiStatus.className = `setting-status ${status.gemini ? 'active' : 'inactive'}`;
      geminiStatus.textContent = status.gemini ? '✅' : '⭕';
    }

    return status;
  } catch (err) {
    const dot = document.querySelector('.status-dot');
    const text = document.querySelector('.status-text');
    dot.className = 'status-dot error';
    text.textContent = 'Offline';
    return null;
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  checkApiStatus();
  initQuiz();
  loadHistory();
});
