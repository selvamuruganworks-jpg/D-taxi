/* 
  =========================================
  Website Main JavaScript - main.js
  =========================================
  Coordinates navbar shrinking, fetches and renders public database properties
  (teachers lists, notices, gallery filtering, and dynamic settings placeholders).
*/

document.addEventListener('DOMContentLoaded', async () => {
  // Hide initial loader
  const loader = document.getElementById('app-loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => loader.style.visibility = 'hidden', 500);
    }, 300);
  }

  // Navbar shrink effect on scroll
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        // Only remove if it's not a secondary page requiring scrolled look
        if (window.location.pathname !== '/' && 
            !window.location.pathname.endsWith('index.html') && 
            window.location.pathname !== '') {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    }
  });

  // Check if secondary page needs standard scrolled navbar
  const path = window.location.pathname;
  if (path !== '/' && !path.endsWith('index.html') && path !== '') {
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.add('scrolled');
  }

  // Load and apply global settings dynamically
  try {
    const settings = await window.SchoolDB.getSettings();
    if (settings) {
      // Update school name
      const nameElements = document.querySelectorAll('#nav-school-name, #footer-school-name');
      nameElements.forEach(el => el.textContent = settings.schoolName);
      
      // Update logo if available
      const logo = document.getElementById('nav-logo');
      if (logo && settings.logo) logo.src = settings.logo;

      // Update Contact Information
      const phoneElements = document.querySelectorAll('#footer-phone, #contact-phone');
      phoneElements.forEach(el => el.textContent = settings.phone);
      
      const emailElements = document.querySelectorAll('#footer-email, #contact-email');
      emailElements.forEach(el => el.textContent = settings.email);

      const addressElements = document.querySelectorAll('#footer-address, #contact-address');
      addressElements.forEach(el => el.textContent = settings.address);

      // Leadership names
      const corrEl = document.getElementById('correspondent-name');
      const abtCorrEl = document.getElementById('abt-corr-name');
      if (settings.correspondentName) {
        if (corrEl) corrEl.textContent = settings.correspondentName;
        if (abtCorrEl) abtCorrEl.textContent = settings.correspondentName;
      }

      const prinEl = document.getElementById('principal-name');
      const abtPrinEl = document.getElementById('abt-principal-name');
      if (settings.principalName) {
        if (prinEl) prinEl.textContent = settings.principalName;
        if (abtPrinEl) abtPrinEl.textContent = settings.principalName;
      }
    }
  } catch (err) {
    console.error("Failed to load school settings", err);
  }

  // Page Specific Content Loaders
  if (document.getElementById('home-gallery-preview')) {
    loadHomeGalleryPreview();
  }
  
  if (document.getElementById('home-news-grid')) {
    loadHomeNews();
  }

  if (document.getElementById('about-teachers-grid')) {
    loadTeachersGrid();
  }

  if (document.getElementById('gallery-grid-container')) {
    loadFullGallery();
  }
});

// Load top 3 gallery images to Home Page
async function loadHomeGalleryPreview() {
  const container = document.getElementById('home-gallery-preview');
  if (!container) return;

  try {
    const list = await window.SchoolDB.getGallery();
    const items = list.slice(0, 3);
    
    if (items.length === 0) {
      container.innerHTML = `<div class="col-12 text-center text-muted">No photos available yet.</div>`;
      return;
    }

    container.innerHTML = items.map((item, idx) => `
      <div class="col-md-4" data-aos="zoom-in" data-aos-delay="${idx * 100}">
        <div class="gallery-grid-item" onclick="openLightbox('${item.imageUrl}', '${item.title}')">
          <img src="${item.imageUrl}" alt="${item.title}">
          <div class="gallery-overlay">
            <h5>${item.title}</h5>
            <span>${item.category}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading gallery preview", err);
  }
}

// Load Notices to Home Page
async function loadHomeNews() {
  const container = document.getElementById('home-news-grid');
  if (!container) return;

  try {
    const notices = await window.SchoolDB.getNotices('all');
    const items = notices.slice(0, 3);

    if (items.length === 0) {
      container.innerHTML = `<div class="col-12 text-center text-muted">No news or notices announced.</div>`;
      return;
    }

    container.innerHTML = items.map((notice, idx) => `
      <div class="col-md-4" data-aos="fade-up" data-aos-delay="${idx * 100}">
        <div class="news-card">
          <img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=200&fit=crop" class="news-img" alt="News Image">
          <div class="news-body">
            <span class="news-date">${window.formatDate ? window.formatDate(notice.date) : notice.date}</span>
            <h4>${notice.title}</h4>
            <p>${notice.content.substring(0, 120)}${notice.content.length > 120 ? '...' : ''}</p>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading news feed", err);
  }
}

// Load Teachers list to About page
async function loadTeachersGrid() {
  const container = document.getElementById('about-teachers-grid');
  if (!container) return;

  try {
    const list = await window.SchoolDB.getTeachers();
    
    if (list.length === 0) {
      container.innerHTML = `<div class="col-12 text-center text-muted">Profiles are being compiled. Check back later.</div>`;
      return;
    }

    container.innerHTML = list.map((teacher, idx) => `
      <div class="col-lg-3 col-md-6" data-aos="fade-up" data-aos-delay="${idx * 100}">
        <div class="info-card h-100 p-3">
          <img src="${teacher.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop'}" class="rounded-circle mb-3 border border-light shadow-sm" style="width: 110px; height: 110px; object-fit: cover;" alt="${teacher.name}">
          <h4>${teacher.name}</h4>
          <span class="text-primary small fw-semibold text-uppercase d-block mb-2">${teacher.qualification}</span>
          <p class="small text-muted mb-0">Experience: ${teacher.experience}</p>
          <p class="small text-muted">Class: ${teacher.assignedClasses.map(c => `${c.class} ${c.section}`).join(', ')}</p>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading teachers list", err);
  }
}

// Load filterable photo gallery page
let fullGalleryData = [];

async function loadFullGallery() {
  const container = document.getElementById('gallery-grid-container');
  if (!container) return;

  try {
    fullGalleryData = await window.SchoolDB.getGallery();
    renderGalleryItems(fullGalleryData);

    // Setup filter button interactions
    const filterButtons = document.querySelectorAll('.btn-filter');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.getAttribute('data-category');
        if (category === 'all') {
          renderGalleryItems(fullGalleryData);
        } else {
          const filtered = fullGalleryData.filter(img => img.category === category);
          renderGalleryItems(filtered);
        }
      });
    });
  } catch (err) {
    console.error("Error loading full gallery", err);
  }
}

function renderGalleryItems(items) {
  const container = document.getElementById('gallery-grid-container');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `<div class="col-12 text-center text-muted py-5">No photos found in this category.</div>`;
    return;
  }

  container.innerHTML = items.map((item, idx) => `
    <div class="col-lg-3 col-md-4 col-sm-6" data-aos="zoom-in" data-aos-delay="${(idx % 4) * 100}">
      <div class="gallery-grid-item" onclick="openLightbox('${item.imageUrl}', '${item.title}')">
        <img src="${item.imageUrl}" alt="${item.title}">
        <div class="gallery-overlay">
          <h5>${item.title}</h5>
          <span>${item.category}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Photo lightbox trigger
function openLightbox(url, title) {
  const modalImage = document.getElementById('lightboxImage');
  const modalTitle = document.getElementById('lightboxTitle');
  
  if (modalImage && modalTitle) {
    modalImage.src = url;
    modalTitle.textContent = title;
    
    const lightboxModal = new bootstrap.Modal(document.getElementById('lightboxModal'));
    lightboxModal.show();
  }
}

window.openLightbox = openLightbox;
