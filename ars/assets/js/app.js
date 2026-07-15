/* 
  =========================================
  App Coordinator & UI Helpers - app.js
  =========================================
  Manages general visual layout behaviors, sidebar toggles, view-switching inside the portal shell,
  loading state control, and the toast notification display engine.
*/

// Display Toast Notifications
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `app-toast toast-${type}`;
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  else if (type === 'error') icon = 'fa-exclamation-circle';
  else if (type === 'warning') icon = 'fa-exclamation-triangle';

  toast.innerHTML = `
    <i class="fas ${icon} toast-icon"></i>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 50);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Show/Hide page loaders
function showLoader(show) {
  let loader = document.getElementById('app-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.className = 'loader-overlay';
    loader.innerHTML = '<div class="loader-spinner"></div>';
    document.body.appendChild(loader);
  }
  
  if (show) {
    loader.style.visibility = 'visible';
    loader.style.opacity = '1';
  } else {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.visibility = 'hidden';
    }, 500);
  }
}

// Manage Sidebar toggle and view switching
document.addEventListener('DOMContentLoaded', () => {
  // Toggle Sidebar event listeners
  const toggleBtn = document.querySelector('.btn-toggle-sidebar');
  const sidebar = document.querySelector('.portal-sidebar');
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 991.98) {
        sidebar.classList.toggle('show-mobile');
      } else {
        sidebar.classList.toggle('collapsed');
      }
    });
  }

  // Handle view switching inside the portals
  const menuLinks = document.querySelectorAll('.sidebar-menu a[data-view]');
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const viewId = link.getAttribute('data-view');
      switchPortalView(viewId);

      // Close mobile sidebar if open
      if (sidebar) {
        sidebar.classList.remove('show-mobile');
      }
    });
  });
});

// Switches dashboard view-panel tabs
function switchPortalView(viewId) {
  // Update active class on sidebar items
  const menuItems = document.querySelectorAll('.sidebar-item');
  menuItems.forEach(item => {
    const link = item.querySelector('a');
    if (link && link.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch panels
  const panels = document.querySelectorAll('.portal-view');
  let panelFound = false;
  panels.forEach(panel => {
    if (panel.id === `view-${viewId}`) {
      panel.classList.add('active');
      panelFound = true;
    } else {
      panel.classList.remove('active');
    }
  });

  if (!panelFound) return;

  // Fire life-cycle actions based on view loaded
  const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
  if (!currentUser) return;

  if (currentUser.role === 'admin' && window.AdminPortal) {
    window.AdminPortal.onViewLoad(viewId);
  } else if (currentUser.role === 'teacher' && window.TeacherPortal) {
    window.TeacherPortal.onViewLoad(viewId);
  } else if (currentUser.role === 'student' && window.StudentPortal) {
    window.StudentPortal.onViewLoad(viewId);
  }
}

// Date formatter utility
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Global scope bindings
window.showToast = showToast;
window.showLoader = showLoader;
window.switchPortalView = switchPortalView;
window.formatDate = formatDate;
