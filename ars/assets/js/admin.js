/* 
  =========================================
  Admin Portal Controller - admin.js
  =========================================
  Coordinates stats metrics, charts generation, registries CRUD operations (teachers, students),
  class scheduling, configuration bindings, CSV reports, and JSON backups.
*/

const AdminPortal = {
  currentUser: null,
  teachersList: [],
  studentsList: [],
  classesList: [],
  subjectsList: [],
  noticesList: [],
  enquiriesList: [],
  enrollmentChart: null,
  ratioChart: null,

  // Initialize Admin Portal
  init(user) {
    this.currentUser = user;
    
    // Render Admin Specific Sidebar Menu
    const menuContainer = document.getElementById('portal-sidebar-menu');
    menuContainer.innerHTML = `
      <li class="sidebar-item active"><a href="#" data-view="admin-dashboard"><i class="fas fa-chart-line"></i><span>Dashboard</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="admin-teachers"><i class="fas fa-chalkboard-teacher"></i><span>Teachers</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="admin-students"><i class="fas fa-user-graduate"></i><span>Students</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="admin-classes"><i class="fas fa-school"></i><span>Classes & Subjects</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="admin-notices"><i class="fas fa-bullhorn"></i><span>Notice Board</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="admin-settings"><i class="fas fa-sliders-h"></i><span>School Profile</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="admin-reports"><i class="fas fa-file-invoice"></i><span>Backup & Reports</span></a></li>
    `;

    // Re-bind click handlers for dynamically created sidebar items
    const menuLinks = menuContainer.querySelectorAll('a[data-view]');
    menuLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.getAttribute('data-view');
        window.switchPortalView(viewId);
      });
    });

    // Set Default View
    window.switchPortalView('admin-dashboard');

    // Register Form submission event listeners
    this.registerFormHandlers();
    this.registerSearchHandlers();
  },

  // View lifecycle routing
  async onViewLoad(viewId) {
    document.getElementById('portal-view-title').textContent = this.getViewTitle(viewId);
    
    showLoader(true);
    try {
      // Pre-fetch global properties
      this.teachersList = await window.SchoolDB.getTeachers();
      this.studentsList = await window.SchoolDB.getStudents();
      this.classesList = await window.SchoolDB.getClasses();
      this.subjectsList = await window.SchoolDB.getSubjects();
      this.noticesList = await window.SchoolDB.getNotices();
      this.enquiriesList = await window.SchoolDB.getEnquiries();

      if (viewId === 'admin-dashboard') {
        await this.renderDashboard();
      } else if (viewId === 'admin-teachers') {
        this.renderTeachersTable(this.teachersList);
        this.renderTeacherFormCheckboxes();
      } else if (viewId === 'admin-students') {
        this.renderStudentsTable(this.studentsList);
        this.populateStudentFormDropdowns();
      } else if (viewId === 'admin-classes') {
        this.renderClassesTable();
        this.renderSubjectsList();
      } else if (viewId === 'admin-notices') {
        this.renderNoticesTable();
      } else if (viewId === 'admin-settings') {
        await this.populateSettingsForm();
      }
    } catch (err) {
      showToast("Error loading panel view data: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  getViewTitle(viewId) {
    const titles = {
      'admin-dashboard': 'Admin Dashboard Overview',
      'admin-teachers': 'Teachers Management',
      'admin-students': 'Students Management',
      'admin-classes': 'Classes & Subjects Setup',
      'admin-notices': 'School Notices',
      'admin-settings': 'School Website Settings',
      'admin-reports': 'Data Export & Backups'
    };
    return titles[viewId] || 'Portal Dashboard';
  },

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  // Render Dashboard graphs & lists
  async renderDashboard() {
    // 1. Metric widgets
    document.getElementById('admin-stat-teachers').textContent = this.teachersList.length;
    document.getElementById('admin-stat-students').textContent = this.studentsList.length;
    document.getElementById('admin-stat-classes').textContent = this.classesList.length;
    document.getElementById('admin-stat-attendance').textContent = '94%';

    // 2. Charts init (Chart.js)
    this.initDashboardCharts();

    // 3. Render recent notices list
    const noticeListContainer = document.getElementById('admin-recent-notices');
    const recentNotices = this.noticesList.slice(0, 3);
    if (recentNotices.length === 0) {
      noticeListContainer.innerHTML = '<div class="text-muted p-2">No notices created yet.</div>';
    } else {
      noticeListContainer.innerHTML = recentNotices.map(notice => `
        <div class="list-group-item bg-transparent px-0 py-3 border-light">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1 font-title fw-bold text-primary">${notice.title}</h6>
            <small class="text-muted">${formatDate(notice.date)}</small>
          </div>
          <p class="mb-1 text-muted small">${notice.content.substring(0, 100)}...</p>
          <small class="badge bg-light text-primary">To: ${notice.target}</small>
        </div>
      `).join('');
    }

    // 4. Render recent enquiries
    const enquiriesContainer = document.getElementById('admin-recent-enquiries');
    const recentEnquiries = this.enquiriesList.slice(0, 3);
    if (recentEnquiries.length === 0) {
      enquiriesContainer.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No enquirers registered.</td></tr>';
    } else {
      enquiriesContainer.innerHTML = recentEnquiries.map(enq => `
        <tr>
          <td><strong>${enq.childName}</strong></td>
          <td>${enq.class}</td>
          <td>${enq.phone}</td>
          <td><span class="status-badge badge-pending">${enq.status || 'pending'}</span></td>
        </tr>
      `).join('');
    }
  },

  // Initialize Chart.js graphic engines
  initDashboardCharts() {
    // 1. Enrollment Chart
    const classLabels = this.classesList.map(c => c.name);
    const studentCounts = this.classesList.map(c => {
      return this.studentsList.filter(s => s.class === c.name).length;
    });

    const ctx1 = document.getElementById('adminEnrollmentChart');
    if (ctx1) {
      if (this.enrollmentChart) this.enrollmentChart.destroy();
      this.enrollmentChart = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: classLabels,
          datasets: [{
            label: 'Student Enrolments',
            data: studentCounts,
            backgroundColor: 'rgba(15, 76, 129, 0.7)',
            borderColor: 'rgba(15, 76, 129, 1)',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
    }

    // 2. Ratio Chart
    const ctx2 = document.getElementById('adminRatioChart');
    if (ctx2) {
      if (this.ratioChart) this.ratioChart.destroy();
      this.ratioChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Students', 'Teachers'],
          datasets: [{
            data: [this.studentsList.length, this.teachersList.length],
            backgroundColor: ['rgba(0, 180, 216, 0.7)', 'rgba(42, 157, 143, 0.7)'],
            borderColor: ['#00b4d8', '#2a9d8f'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  },

  // Render Teachers list
  renderTeachersTable(list) {
    const tbody = document.getElementById('admin-teachers-table-body');
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No teachers registered in database.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(teacher => {
      const assigned = teacher.assignedClasses ? teacher.assignedClasses.map(c => `${c.class} - ${c.section}`).join(', ') : 'None';
      return `
        <tr>
          <td><img src="${teacher.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=50&h=50&fit=crop'}" class="rounded-circle" style="width: 42px; height: 42px; object-fit: cover;"></td>
          <td><strong>${teacher.name}</strong></td>
          <td>${teacher.email}</td>
          <td>${teacher.phone}</td>
          <td><span class="badge bg-light text-primary border">${teacher.qualification}</span></td>
          <td><span class="small text-muted">${assigned}</span></td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" onclick="window.AdminPortal.editTeacher('${teacher.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="window.AdminPortal.deleteTeacher('${teacher.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  // Populate teacher class checkboxes in modal
  renderTeacherFormCheckboxes() {
    const container = document.getElementById('teacherClassCheckboxes');
    if (!container) return;

    container.innerHTML = this.classesList.map(c => `
      <div class="form-check mb-2">
        <input class="form-check-input check-teacher-class" type="checkbox" value="${c.name}" id="chk-tclass-${c.name}">
        <label class="form-check-label small" for="chk-tclass-${c.name}">
          <strong>${c.name}</strong> - Sections: ${c.sections.join(', ')}
        </label>
      </div>
    `).join('');
  },

  // Render Students list
  renderStudentsTable(list) {
    const tbody = document.getElementById('admin-students-table-body');
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No students registered in database.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(student => `
      <tr>
        <td><img src="${student.photo || 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=50&h=50&fit=crop'}" class="rounded-circle" style="width: 42px; height: 42px; object-fit: cover;"></td>
        <td><code>${student.rollNumber}</code></td>
        <td><strong>${student.name}</strong></td>
        <td><span class="badge bg-light text-primary border">${student.class} - ${student.section}</span></td>
        <td>${student.parentName}</td>
        <td><span class="small text-muted">${student.emergencyContact || student.phone}</span></td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" onclick="window.AdminPortal.editStudent('${student.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="window.AdminPortal.deleteStudent('${student.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  populateStudentFormDropdowns() {
    const classSelectors = document.querySelectorAll('#studentFormClass, #filterStudentClass');
    classSelectors.forEach(selector => {
      if (!selector) return;
      
      const prevVal = selector.value;
      let optionsHtml = '';
      if (selector.id === 'filterStudentClass') {
        optionsHtml = '<option value="">All Classes</option>';
      } else {
        optionsHtml = '<option value="" disabled selected>Select class</option>';
      }
      
      optionsHtml += this.classesList.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
      selector.innerHTML = optionsHtml;
      selector.value = prevVal;
    });
  },

  // Render Class Registry Table
  renderClassesTable() {
    const tbody = document.getElementById('admin-classes-table-body');
    tbody.innerHTML = this.classesList.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.sections.map(s => `<span class="badge bg-light text-dark border me-1">${s}</span>`).join('')}</td>
      </tr>
    `).join('');
  },

  // Render Subject List
  renderSubjectsList() {
    const container = document.getElementById('admin-subjects-list');
    container.innerHTML = this.subjectsList.map(sub => `
      <div class="list-group-item bg-transparent border-light py-3 d-flex justify-content-between align-items-center">
        <span><i class="fas fa-book text-muted me-2"></i><strong>${sub}</strong></span>
        <span class="badge bg-light text-primary border">Core Subject</span>
      </div>
    `).join('');
  },

  // Render Notice board
  renderNoticesTable() {
    const tbody = document.getElementById('admin-notices-table-body');
    if (this.noticesList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No announcements posted.</td></tr>';
      return;
    }

    tbody.innerHTML = this.noticesList.map(notice => `
      <tr>
        <td>${formatDate(notice.date)}</td>
        <td><strong>${notice.title}</strong></td>
        <td><span class="badge bg-light text-dark border">${notice.target}</span></td>
        <td>${notice.author}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="window.AdminPortal.deleteNotice('${notice.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },

  // Populate school configurations in profile form
  async populateSettingsForm() {
    const settings = await window.SchoolDB.getSettings();
    if (!settings) return;

    document.getElementById('settingsSchoolName').value = settings.schoolName;
    document.getElementById('settingsMotto').value = settings.motto;
    document.getElementById('settingsEmail').value = settings.email;
    document.getElementById('settingsPhone').value = settings.phone;
    document.getElementById('settingsCorrName').value = settings.correspondentName || 'Rev. Sister Beatrice';
    document.getElementById('settingsPrinName').value = settings.principalName || 'Ms. Sarah Jenkins';
    document.getElementById('settingsAddress').value = settings.address;
    document.getElementById('settingsLogoUrl').value = settings.logo || '';
    document.getElementById('settingsAdmissionOpen').checked = settings.admissionOpen || false;
  },

  // ==========================================
  // REGISTRATIONS & FORM ACTIONS
  // ==========================================

  registerFormHandlers() {
    // 1. Teacher submission
    document.getElementById('teacherForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const teacherId = document.getElementById('teacherFormId').value;
      const checkedClasses = [];
      document.querySelectorAll('.check-teacher-class:checked').forEach(chk => {
        checkedClasses.push({ class: chk.value, section: 'A' }); // Defaults section assignment to A
      });

      const teacherData = {
        name: document.getElementById('teacherFormName').value,
        email: document.getElementById('teacherFormEmail').value,
        phone: document.getElementById('teacherFormPhone').value,
        qualification: document.getElementById('teacherFormQual').value,
        experience: document.getElementById('teacherFormExp').value,
        photo: document.getElementById('teacherFormPhoto').value || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
        assignedClasses: checkedClasses
      };

      try {
        showLoader(true);
        if (teacherId) {
          await window.SchoolDB.updateTeacher(teacherId, teacherData);
          showToast("Teacher record updated successfully.", "success");
        } else {
          // Register mock user mapping too
          await window.SchoolDB.addTeacher(teacherData);
          await window.SchoolDB.registerUser(teacherData.email, "password123", "teacher", teacherData.name);
          showToast("New Teacher added. Login: " + teacherData.email + " / password123", "success");
        }
        
        // Hide modal
        bootstrap.Modal.getInstance(document.getElementById('teacherModal')).hide();
        await this.onViewLoad('admin-teachers');
      } catch (err) {
        showToast("Operation failed: " + err.message, "error");
      } finally {
        showLoader(false);
      }
    });

    // 2. Student submission
    document.getElementById('studentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const studentId = document.getElementById('studentFormId').value;
      
      const studentData = {
        name: document.getElementById('studentFormName').value,
        rollNumber: document.getElementById('studentFormRoll').value,
        class: document.getElementById('studentFormClass').value,
        section: document.getElementById('studentFormSection').value,
        parentName: document.getElementById('studentFormParent').value,
        phone: document.getElementById('studentFormPhone').value,
        address: document.getElementById('studentFormAddress').value,
        bloodGroup: document.getElementById('studentFormBlood').value,
        emergencyContact: document.getElementById('studentFormEmergency').value,
        photo: document.getElementById('studentFormPhoto').value || 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=150&h=150&fit=crop'
      };

      try {
        showLoader(true);
        if (studentId) {
          await window.SchoolDB.updateStudent(studentId, studentData);
          showToast("Student profile updated successfully.", "success");
        } else {
          await window.SchoolDB.addStudent(studentData);
          // Auto generate default student portal login based on roll number
          const email = `student.${studentData.rollNumber.toLowerCase()}@school.com`;
          await window.SchoolDB.registerUser(email, "password123", "student", studentData.name);
          showToast("New Student added. Login: " + email + " / password123", "success");
        }
        
        bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
        await this.onViewLoad('admin-students');
      } catch (err) {
        showToast("Operation failed: " + err.message, "error");
      } finally {
        showLoader(false);
      }
    });

    // 3. Settings submit
    document.getElementById('adminSettingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const settings = {
        schoolName: document.getElementById('settingsSchoolName').value,
        motto: document.getElementById('settingsMotto').value,
        email: document.getElementById('settingsEmail').value,
        phone: document.getElementById('settingsPhone').value,
        correspondentName: document.getElementById('settingsCorrName').value,
        principalName: document.getElementById('settingsPrinName').value,
        address: document.getElementById('settingsAddress').value,
        logo: document.getElementById('settingsLogoUrl').value,
        admissionOpen: document.getElementById('settingsAdmissionOpen').checked
      };

      try {
        showLoader(true);
        await window.SchoolDB.updateSettings(settings);
        showToast("School settings saved successfully.", "success");
      } catch (err) {
        showToast("Save failed: " + err.message, "error");
      } finally {
        showLoader(false);
      }
    });

    // 4. Create class / sections
    document.getElementById('addClassForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const className = document.getElementById('addClassName').value;
      const sectionStr = document.getElementById('addClassSection').value;
      const sections = sectionStr.split(',').map(s => s.trim().toUpperCase());

      try {
        showLoader(true);
        await window.SchoolDB.addClass(className, sections);
        showToast("Class and sections configured.", "success");
        document.getElementById('addClassForm').reset();
        await this.onViewLoad('admin-classes');
      } catch (err) {
        showToast("Failed configuring class: " + err.message, "error");
      } finally {
        showLoader(false);
      }
    });

    // 5. Notice submission
    document.getElementById('noticeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const notice = {
        title: document.getElementById('noticeTitle').value,
        content: document.getElementById('noticeContent').value,
        target: document.getElementById('noticeTarget').value,
        date: new Date().toISOString().split('T')[0],
        author: "Administrator"
      };

      try {
        showLoader(true);
        await window.SchoolDB.addNotice(notice);
        showToast("Notice posted successfully to notice board.", "success");
        
        bootstrap.Modal.getInstance(document.getElementById('noticeModal')).hide();
        document.getElementById('noticeForm').reset();
        await this.onViewLoad('admin-notices');
      } catch (err) {
        showToast("Failed to post notice: " + err.message, "error");
      } finally {
        showLoader(false);
      }
    });
  },

  // Registry Search controllers
  registerSearchHandlers() {
    // Search Teachers
    const searchTeacher = document.getElementById('searchTeacherInput');
    if (searchTeacher) {
      searchTeacher.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = this.teachersList.filter(t => 
          t.name.toLowerCase().includes(q) || 
          t.email.toLowerCase().includes(q) || 
          t.phone.includes(q)
        );
        this.renderTeachersTable(filtered);
      });
    }

    // Search & Filter Students
    const searchStudent = document.getElementById('searchStudentInput');
    const filterClass = document.getElementById('filterStudentClass');
    
    const applyStudentFilter = () => {
      const q = searchStudent ? searchStudent.value.toLowerCase() : '';
      const cls = filterClass ? filterClass.value : '';
      
      const filtered = this.studentsList.filter(s => {
        const matchQ = s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q);
        const matchCls = cls === '' || s.class === cls;
        return matchQ && matchCls;
      });
      this.renderStudentsTable(filtered);
    };

    if (searchStudent) searchStudent.addEventListener('input', applyStudentFilter);
    if (filterClass) filterClass.addEventListener('change', applyStudentFilter);
  },

  // Reset form inputs for clean add
  resetTeacherForm() {
    document.getElementById('teacherFormId').value = '';
    document.getElementById('teacherForm').reset();
    document.querySelectorAll('.check-teacher-class').forEach(c => c.checked = false);
    document.getElementById('teacherModalLabel').textContent = 'Add Teacher Profile';
  },

  resetStudentForm() {
    document.getElementById('studentFormId').value = '';
    document.getElementById('studentForm').reset();
    document.getElementById('studentModalLabel').textContent = 'Add Student Profile';
  },

  // Edit record loaders
  editTeacher(id) {
    const teacher = this.teachersList.find(t => t.id === id);
    if (!teacher) return;

    this.resetTeacherForm();
    document.getElementById('teacherFormId').value = teacher.id;
    document.getElementById('teacherFormName').value = teacher.name;
    document.getElementById('teacherFormEmail').value = teacher.email;
    document.getElementById('teacherFormPhone').value = teacher.phone;
    document.getElementById('teacherFormQual').value = teacher.qualification;
    document.getElementById('teacherFormExp').value = teacher.experience;
    document.getElementById('teacherFormPhoto').value = teacher.photo || '';
    
    // Check assigned classes
    if (teacher.assignedClasses) {
      teacher.assignedClasses.forEach(c => {
        const checkbox = document.getElementById(`chk-tclass-${c.class}`);
        if (checkbox) checkbox.checked = true;
      });
    }

    document.getElementById('teacherModalLabel').textContent = 'Edit Teacher Profile';
    
    const modal = new bootstrap.Modal(document.getElementById('teacherModal'));
    modal.show();
  },

  editStudent(id) {
    const student = this.studentsList.find(s => s.id === id);
    if (!student) return;

    this.resetStudentForm();
    document.getElementById('studentFormId').value = student.id;
    document.getElementById('studentFormName').value = student.name;
    document.getElementById('studentFormRoll').value = student.rollNumber;
    document.getElementById('studentFormClass').value = student.class;
    document.getElementById('studentFormSection').value = student.section;
    document.getElementById('studentFormParent').value = student.parentName;
    document.getElementById('studentFormPhone').value = student.phone;
    document.getElementById('studentFormAddress').value = student.address;
    document.getElementById('studentFormBlood').value = student.bloodGroup || '';
    document.getElementById('studentFormEmergency').value = student.emergencyContact || '';
    document.getElementById('studentFormPhoto').value = student.photo || '';

    document.getElementById('studentModalLabel').textContent = 'Edit Student Profile';
    
    const modal = new bootstrap.Modal(document.getElementById('studentModal'));
    modal.show();
  },

  // Delete methods
  async deleteTeacher(id) {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    try {
      showLoader(true);
      await window.SchoolDB.deleteTeacher(id);
      showToast("Teacher record deleted successfully.", "success");
      await this.onViewLoad('admin-teachers');
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  async deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      showLoader(true);
      await window.SchoolDB.deleteStudent(id);
      showToast("Student profile deleted successfully.", "success");
      await this.onViewLoad('admin-students');
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  async deleteNotice(id) {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
      showLoader(true);
      await window.SchoolDB.deleteNotice(id);
      showToast("Notice deleted.", "success");
      await this.onViewLoad('admin-notices');
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  // ==========================================
  // DATA EXTRACTION & BACKUPS
  // ==========================================

  // Export CSV arrays helper
  exportCSV(type) {
    let data = [];
    let headers = [];
    let filename = '';

    if (type === 'students') {
      data = this.studentsList;
      headers = ['ID', 'Roll Number', 'Name', 'Class', 'Section', 'Parent Name', 'Phone', 'Address'];
      filename = 'students_registry_report.csv';
    } else if (type === 'teachers') {
      data = this.teachersList;
      headers = ['ID', 'Name', 'Email', 'Phone', 'Qualifications', 'Experience'];
      filename = 'teachers_registry_report.csv';
    } else if (type === 'marks') {
      showToast("Compiling Marks Ledger. Please export Marks sheets inside Teacher / Student Portal sections.", "info");
      return;
    }

    if (data.length === 0) {
      showToast("No data to export.", "warning");
      return;
    }

    // Convert list to CSV rows string
    let csvRows = [headers.join(',')];
    data.forEach(item => {
      let values = [];
      if (type === 'students') {
        values = [item.id, item.rollNumber, `"${item.name}"`, item.class, item.section, `"${item.parentName}"`, item.phone, `"${item.address}"`];
      } else if (type === 'teachers') {
        values = [item.id, `"${item.name}"`, item.email, item.phone, `"${item.qualification}"`, `"${item.experience}"`];
      }
      csvRows.push(values.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV report downloaded successfully.", "success");
  },

  // JSON database snapshot export
  async triggerBackupDownload() {
    try {
      showLoader(true);
      const backup = await window.SchoolDB.triggerLocalBackup();
      
      // Post backup object directly to our serverless endpoint to download as a secure file
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `school_database_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Database JSON backup exported.", "success");
      } else {
        // Fallback file builder directly in client
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
        const link = document.createElement('a');
        link.setAttribute("href", dataStr);
        link.setAttribute("download", "school_backup_fallback.json");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Fallback JSON backup downloaded.", "success");
      }
    } catch (err) {
      showToast("Backup failed: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  }
};

window.AdminPortal = AdminPortal;
