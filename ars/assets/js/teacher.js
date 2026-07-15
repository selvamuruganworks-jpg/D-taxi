/* 
  =========================================
  Teacher Portal Controller - teacher.js
  =========================================
  Manages daily attendance markings, homework releases, grade allocations,
  rank indices, FullCalendar planners, and student PDF report card compilers.
*/

const TeacherPortal = {
  currentUser: null,
  assignedClasses: [],
  assignedStudents: [],
  teacherObj: null,
  teacherCalendar: null,
  activeAttendanceRecords: {},
  activeExamStudents: [],

  // Initialize Teacher Portal
  async init(user) {
    this.currentUser = user;
    
    // Fetch teacher profile
    const teachers = await window.SchoolDB.getTeachers();
    this.teacherObj = teachers.find(t => t.id === user.teacherId || t.email === user.email);

    if (this.teacherObj) {
      this.assignedClasses = this.teacherObj.assignedClasses || [];
    }

    // Render Teacher Sidebar Menu
    const menuContainer = document.getElementById('portal-sidebar-menu');
    menuContainer.innerHTML = `
      <li class="sidebar-item active"><a href="#" data-view="teacher-dashboard"><i class="fas fa-home"></i><span>Dashboard</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="teacher-attendance"><i class="fas fa-calendar-check"></i><span>Daily Attendance</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="teacher-homework"><i class="fas fa-tasks"></i><span>Homework</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="teacher-marks"><i class="fas fa-file-invoice"></i><span>Grades</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="teacher-calendar"><i class="fas fa-calendar-alt"></i><span>My Calendar</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="teacher-profile"><i class="fas fa-user-circle"></i><span>My Profile</span></a></li>
    `;

    const menuLinks = menuContainer.querySelectorAll('a[data-view]');
    menuLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.getAttribute('data-view');
        window.switchPortalView(viewId);
      });
    });

    // Default View
    window.switchPortalView('teacher-dashboard');

    this.registerFormHandlers();
  },

  // View lifecycle router
  async onViewLoad(viewId) {
    document.getElementById('portal-view-title').textContent = this.getViewTitle(viewId);
    
    showLoader(true);
    try {
      if (viewId === 'teacher-dashboard') {
        await this.renderDashboard();
      } else if (viewId === 'teacher-attendance') {
        this.initAttendanceSelectors();
      } else if (viewId === 'teacher-homework') {
        await this.renderHomeworkList();
        this.populateHomeworkModalDropdowns();
      } else if (viewId === 'teacher-marks') {
        this.initGradesSelectors();
      } else if (viewId === 'teacher-calendar') {
        this.initTeacherCalendar();
      } else if (viewId === 'teacher-profile') {
        this.renderProfile();
      }
    } catch (err) {
      showToast("Error updating panel data: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  getViewTitle(viewId) {
    const titles = {
      'teacher-dashboard': 'Teacher Dashboard Overview',
      'teacher-attendance': 'Class Attendance Sheets',
      'teacher-homework': 'Manage Homework Tasks',
      'teacher-marks': 'Grade Registry Ledger',
      'teacher-calendar': 'Calendar & Due-dates Planner',
      'teacher-profile': 'Teacher Profile Sheet'
    };
    return titles[viewId] || 'Portal Dashboard';
  },

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  // Render Dashboard
  async renderDashboard() {
    // 1. Calculate statistics
    const allStudents = await window.SchoolDB.getStudents();
    
    // Filter students belonging to this teacher's assigned classes
    const classNames = this.assignedClasses.map(c => c.class);
    this.assignedStudents = allStudents.filter(s => classNames.includes(s.class));

    const homeworks = await window.SchoolDB.getHomework();
    const myHw = homeworks.filter(h => h.teacherId === this.currentUser.teacherId);

    document.getElementById('teacher-stat-classes').textContent = this.assignedClasses.length;
    document.getElementById('teacher-stat-students').textContent = this.assignedStudents.length;
    document.getElementById('teacher-stat-homework').textContent = myHw.length;

    // 2. Render notices
    const feed = document.getElementById('teacher-notices-feed');
    const notices = await window.SchoolDB.getNotices('teachers');
    const items = notices.slice(0, 3);
    
    if (items.length === 0) {
      feed.innerHTML = '<div class="text-muted p-2">No announcements posted for teachers.</div>';
    } else {
      feed.innerHTML = items.map(n => `
        <div class="list-group-item bg-transparent px-0 py-3 border-light">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1 font-title fw-bold text-primary">${n.title}</h6>
            <small class="text-muted">${formatDate(n.date)}</small>
          </div>
          <p class="mb-1 text-muted small">${n.content}</p>
          <small class="text-muted">By: ${n.author}</small>
        </div>
      `).join('');
    }
  },

  // Initialize Daily Attendance Selector
  initAttendanceSelectors() {
    const classSel = document.getElementById('attClassSelector');
    classSel.innerHTML = this.assignedClasses.map(c => `<option value="${c.class}">${c.class}</option>`).join('');
    
    // Default date to today
    document.getElementById('attDateSelector').value = new Date().toISOString().split('T')[0];
    
    // Hide checker grid initially
    document.getElementById('attendance-list-card').classList.add('d-none');
  },

  // Load class list for attendance checks
  async loadAttendanceGrid() {
    const className = document.getElementById('attClassSelector').value;
    const section = document.getElementById('attSectionSelector').value;
    const date = document.getElementById('attDateSelector').value;

    if (!className || !section || !date) {
      showToast("Please fill class, section, and date parameters.", "warning");
      return;
    }

    showLoader(true);
    try {
      const allStudents = await window.SchoolDB.getStudents();
      const students = allStudents.filter(s => s.class === className && s.section === section);
      
      const gridContainer = document.getElementById('attendance-student-checklist');
      if (students.length === 0) {
        gridContainer.innerHTML = '<div class="text-center py-4 text-muted">No students enrolled in this class and section.</div>';
        document.getElementById('attendance-list-card').classList.remove('d-none');
        document.getElementById('btn-save-attendance').classList.add('d-none');
        return;
      }

      document.getElementById('btn-save-attendance').classList.remove('d-none');

      // Fetch existing records if already marked
      const existing = await window.SchoolDB.getAttendance(className, section, date);
      this.activeAttendanceRecords = existing ? existing.records : {};

      gridContainer.innerHTML = students.map(student => {
        const currentStatus = this.activeAttendanceRecords[student.id] || 'present'; // Default to present
        this.activeAttendanceRecords[student.id] = currentStatus; // Seed state

        return `
          <div class="attendance-row" id="att-row-${student.id}">
            <div class="d-flex align-items-center gap-3">
              <img src="${student.photo || 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=50&h=50&fit=crop'}" class="rounded-circle" style="width: 38px; height: 38px; object-fit: cover;">
              <div>
                <span class="fw-bold d-block">${student.name}</span>
                <code class="small text-muted">${student.rollNumber}</code>
              </div>
            </div>
            <div class="attendance-actions" data-student-id="${student.id}">
              <button class="btn btn-attendance present ${currentStatus === 'present' ? 'active' : ''}" onclick="window.TeacherPortal.setStudentAttendance('${student.id}', 'present')">P</button>
              <button class="btn btn-attendance absent ${currentStatus === 'absent' ? 'active' : ''}" onclick="window.TeacherPortal.setStudentAttendance('${student.id}', 'absent')">A</button>
              <button class="btn btn-attendance leave ${currentStatus === 'leave' ? 'active' : ''}" onclick="window.TeacherPortal.setStudentAttendance('${student.id}', 'leave')">L</button>
            </div>
          </div>
        `;
      }).join('');

      document.getElementById('attendance-list-card').classList.remove('d-none');
    } catch (err) {
      showToast("Failed loading class checklist: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  setStudentAttendance(studentId, status) {
    this.activeAttendanceRecords[studentId] = status;
    
    // Toggle active state locally on buttons
    const row = document.getElementById(`att-row-${studentId}`);
    if (row) {
      row.querySelectorAll('.btn-attendance').forEach(btn => btn.classList.remove('active'));
      const activeBtn = row.querySelector(`.btn-attendance.${status}`);
      if (activeBtn) activeBtn.classList.add('active');
    }
  },

  bulkMarkAttendance(status) {
    Object.keys(this.activeAttendanceRecords).forEach(studentId => {
      this.setStudentAttendance(studentId, status);
    });
    showToast(`Marked all students as ${status.toUpperCase()}.`, "info");
  },

  // Save Attendance to database
  async saveAttendanceLog() {
    const className = document.getElementById('attClassSelector').value;
    const section = document.getElementById('attSectionSelector').value;
    const date = document.getElementById('attDateSelector').value;
    const teacherName = this.teacherObj ? this.teacherObj.name : "Teacher";

    try {
      showLoader(true);
      await window.SchoolDB.markAttendance(className, section, date, this.activeAttendanceRecords, teacherName);
      showToast(`Attendance logs saved successfully for ${className}-${section} (${date})`, "success");
    } catch (err) {
      showToast("Failed to save: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  // Homework Renderer
  async renderHomeworkList() {
    const container = document.getElementById('teacher-homework-list');
    
    try {
      const list = await window.SchoolDB.getHomework();
      // Filter homework created by this teacher
      const myHw = list.filter(h => h.teacherId === this.currentUser.teacherId);
      
      if (myHw.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5">No homework assignments created. Click "Create Homework" to assign tasks.</div>';
        return;
      }

      container.innerHTML = await Promise.all(myHw.map(async hw => {
        // Fetch submission counts
        const subs = await window.SchoolDB.getSubmissions(hw.id);
        const done = subs.filter(s => s.status === 'completed').length;
        const pending = this.assignedStudents.filter(s => s.class === hw.class && s.section === hw.section).length - done;

        return `
          <div class="col-md-4">
            <div class="homework-card">
              <div class="homework-card-header">
                <div>
                  <span class="badge bg-light text-primary border">${hw.class} - ${hw.section}</span>
                  <span class="badge bg-light text-dark border ms-1">${hw.subject}</span>
                </div>
                <button class="btn btn-sm text-danger" onclick="window.TeacherPortal.deleteHomework('${hw.id}')"><i class="fas fa-trash-alt"></i></button>
              </div>
              <h5 class="font-title fw-bold mt-2">${hw.title}</h5>
              <p class="text-muted small mt-1 mb-3">${hw.description.substring(0, 100)}...</p>
              <div class="border-top pt-2 d-flex justify-content-between align-items-center">
                <span class="homework-due"><i class="far fa-clock me-1"></i>Due: ${formatDate(hw.dueDate)}</span>
                <span class="small font-title text-muted">Done: <strong>${done}</strong> | Pend: <strong>${pending > 0 ? pending : 0}</strong></span>
              </div>
            </div>
          </div>
        `;
      })).then(htmls => htmls.join(''));
    } catch (err) {
      console.error(err);
    }
  },

  populateHomeworkModalDropdowns() {
    const hwClassSel = document.getElementById('hwFormClass');
    const hwSubSel = document.getElementById('hwFormSubject');
    
    if (hwClassSel) hwClassSel.innerHTML = this.assignedClasses.map(c => `<option value="${c.class}">${c.class}</option>`).join('');
    if (hwSubSel) hwSubSel.innerHTML = this.subjectsList.map(s => `<option value="${s}">${s}</option>`).join('');
    
    // Set default due date to tomorrow
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    document.getElementById('hwFormDueDate').value = tom.toISOString().split('T')[0];
  },

  async deleteHomework(id) {
    if (!confirm("Are you sure you want to delete this homework?")) return;
    try {
      showLoader(true);
      await window.SchoolDB.deleteHomework(id);
      showToast("Homework assignment removed.", "success");
      await this.renderHomeworkList();
    } catch (err) {
      showToast("Failed to delete homework: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  // Initialize Grades Ledger Selectors
  initGradesSelectors() {
    const classSel = document.getElementById('gradeClassSelector');
    classSel.innerHTML = this.assignedClasses.map(c => `<option value="${c.class}">${c.class}</option>`).join('');
    document.getElementById('marks-list-card').classList.add('d-none');
  },

  // Load student lists for grade entry
  async loadMarksGrid() {
    const className = document.getElementById('gradeClassSelector').value;
    const section = document.getElementById('gradeSectionSelector').value;

    if (!className || !section) return;

    showLoader(true);
    try {
      const allStudents = await window.SchoolDB.getStudents();
      const students = allStudents.filter(s => s.class === className && s.section === section);
      this.activeExamStudents = students;

      const tbody = document.getElementById('teacher-marks-table-body');
      if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No students enrolled in this section.</td></tr>';
        document.getElementById('marks-list-card').classList.remove('d-none');
        return;
      }

      // Fetch marks for the student cohort
      const classMarks = await window.SchoolDB.getMarksByClass(className, section);

      tbody.innerHTML = students.map(student => {
        // Find existing mark records if any
        const mark = classMarks.find(m => m.studentId === student.id && m.examType === 'Quarterly');
        return `
          <tr>
            <td><code>${student.rollNumber}</code></td>
            <td><strong>${student.name}</strong></td>
            <td>${mark ? mark.total : '---'}</td>
            <td>${mark ? mark.average.toFixed(1) : '---'}</td>
            <td><span class="badge bg-light text-primary border">${mark ? mark.grade : 'Pending'}</span></td>
            <td>
              <button class="btn btn-sm btn-primary rounded-pill px-3" onclick="window.TeacherPortal.openGradesModal('${student.id}')"><i class="fas fa-marker me-1"></i> Grade</button>
            </td>
          </tr>
        `;
      }).join('');

      document.getElementById('marks-list-card').classList.remove('d-none');
    } catch (err) {
      showToast("Error loading ledger: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  // Open grades submission modal
  async openGradesModal(studentId) {
    const student = this.activeExamStudents.find(s => s.id === studentId);
    if (!student) return;

    document.getElementById('marksStudentId').value = student.id;
    document.getElementById('marksStudentName').value = student.name;
    document.getElementById('marksLabelStudentName').value = student.name;

    // Fetch student's marks
    const studentMarks = await window.SchoolDB.getMarks(studentId);
    const activeExam = document.getElementById('marksExamType').value;
    const existing = studentMarks.find(m => m.examType === activeExam);

    // Render subjects input fields dynamically
    const inputsContainer = document.getElementById('marks-subjects-inputs');
    inputsContainer.innerHTML = this.subjectsList.map(sub => {
      const val = existing && existing.marks && existing.marks[sub] !== undefined ? existing.marks[sub] : '';
      return `
        <div class="col-md-4 col-sm-6">
          <label class="form-label text-muted small">${sub}</label>
          <input type="number" class="form-control subject-mark-input" data-subject="${sub}" min="0" max="100" value="${val}" required>
        </div>
      `;
    }).join('');

    const modal = new bootstrap.Modal(document.getElementById('gradesModal'));
    modal.show();
  },

  // FullCalendar planner initializations
  async initTeacherCalendar() {
    const el = document.getElementById('teacherCalendar');
    if (!el) return;

    const eventsList = await window.SchoolDB.getEvents();
    
    // Format events for FullCalendar loader
    const fcEvents = eventsList.map(evt => ({
      id: evt.id,
      title: evt.title,
      start: evt.start,
      end: evt.end,
      className: `event-${evt.type}`,
      description: evt.description
    }));

    if (this.teacherCalendar) {
      this.teacherCalendar.destroy();
    }

    this.teacherCalendar = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      },
      events: fcEvents,
      dateClick: (info) => {
        // Open modal for clicked date
        document.getElementById('evtStart').value = info.dateStr;
        const modal = new bootstrap.Modal(document.getElementById('eventModal'));
        modal.show();
      },
      eventClick: async (info) => {
        if (confirm(`Remove event: "${info.event.title}" from planner?`)) {
          showLoader(true);
          await window.SchoolDB.deleteEvent(info.event.id);
          showToast("Event removed.", "success");
          this.onViewLoad('teacher-calendar');
        }
      }
    });

    this.teacherCalendar.render();
  },

  // Render profile info
  renderProfile() {
    if (!this.teacherObj) return;

    document.getElementById('teacher-profile-avatar').src = this.teacherObj.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop';
    document.getElementById('teacher-profile-name').textContent = this.teacherObj.name;
    document.getElementById('teacher-profile-role').textContent = this.teacherObj.assignedClasses.map(c => `${c.class} - ${c.section}`).join(', ');
    document.getElementById('teacher-profile-email').textContent = this.teacherObj.email;
    document.getElementById('teacher-profile-phone').textContent = this.teacherObj.phone;
    document.getElementById('teacher-profile-qualification').textContent = this.teacherObj.qualification;
    document.getElementById('teacher-profile-exp').textContent = this.teacherObj.experience;
  },

  // ==========================================
  // FORMS SUBMISSION HANDLERS
  // ==========================================

  registerFormHandlers() {
    // 1. Save Attendance Trigger
    const btnSaveAtt = document.getElementById('btn-save-attendance');
    if (btnSaveAtt) {
      btnSaveAtt.addEventListener('click', () => this.saveAttendanceLog());
    }

    const btnLoadAtt = document.getElementById('btn-load-attendance-grid');
    if (btnLoadAtt) {
      btnLoadAtt.addEventListener('click', () => this.loadAttendanceGrid());
    }

    const btnLoadMarks = document.getElementById('btn-load-marks-grid');
    if (btnLoadMarks) {
      btnLoadMarks.addEventListener('click', () => this.loadMarksGrid());
    }

    // 2. Publish Homework Submit
    document.getElementById('homeworkForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const homework = {
        class: document.getElementById('hwFormClass').value,
        section: document.getElementById('hwFormSection').value,
        subject: document.getElementById('hwFormSubject').value,
        title: document.getElementById('hwFormTitle').value,
        description: document.getElementById('hwFormDesc').value,
        dueDate: document.getElementById('hwFormDueDate').value,
        createdAt: new Date().toISOString(),
        teacherId: this.currentUser.teacherId
      };

      try {
        showLoader(true);
        await window.SchoolDB.addHomework(homework);
        showToast("Homework assigned and broadcasted to class portal.", "success");
        
        bootstrap.Modal.getInstance(document.getElementById('homeworkModal')).hide();
        document.getElementById('homeworkForm').reset();
        await this.renderHomeworkList();
      } catch (err) {
        showToast("Failed publishing homework: " + err.message, "error");
      } finally {
        showLoader(false);
      }
    });

    // 3. Save Marks ledger submission
    document.getElementById('marksForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const studentId = document.getElementById('marksStudentId').value;
      const studentName = document.getElementById('marksStudentName').value;
      const examType = document.getElementById('marksExamType').value;
      const className = document.getElementById('gradeClassSelector').value;
      const section = document.getElementById('gradeSectionSelector').value;

      // Compile subject scores
      const subjectMarks = {};
      let total = 0;
      const inputs = document.querySelectorAll('.subject-mark-input');
      inputs.forEach(input => {
        const sub = input.getAttribute('data-subject');
        const score = parseInt(input.value) || 0;
        subjectMarks[sub] = score;
        total += score;
      });

      const average = total / inputs.length;
      const percentage = average;

      // Deduce Grade category letter
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';

      // Deduce class rank dynamically
      const marksList = await window.SchoolDB.getMarksByClass(className, section);
      const examMarks = marksList.filter(m => m.examType === examType && m.studentId !== studentId);
      examMarks.push({ total }); // Add current mock total
      examMarks.sort((a, b) => b.total - a.total);
      
      const rank = examMarks.findIndex(m => m.total === total) + 1;

      const marksObj = {
        studentId,
        studentName,
        class: className,
        section,
        examType,
        marks: subjectMarks,
        total,
        average,
        percentage,
        grade,
        rank
      };

      try {
        showLoader(true);
        await window.SchoolDB.saveMarks(marksObj);
        showToast(`Report grades submitted successfully for ${studentName}`, "success");
        
        bootstrap.Modal.getInstance(document.getElementById('gradesModal')).hide();
        await this.loadMarksGrid();
      } catch (err) {
        showToast("Error updating marks: " + err.message, "error");
      } finally {
        showLoader(false);
      }
    });

    // 4. Create Calendar Event marker
    document.getElementById('eventForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const evt = {
        title: document.getElementById('evtTitle').value,
        start: document.getElementById('evtStart').value,
        end: document.getElementById('evtEnd').value || document.getElementById('evtStart').value,
        type: document.getElementById('evtType').value,
        description: document.getElementById('evtDesc').value
      };

      try {
        showLoader(true);
        await window.SchoolDB.addEvent(evt);
        showToast("Event marker placed on calendar planner.", "success");
        
        bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
        document.getElementById('eventForm').reset();
        await this.onViewLoad('teacher-calendar');
      } catch (err) {
        showToast("Failed to create event: " + err.message, "error");
      } finally {
        showLoader(false);
      }
    });
  }
};

window.TeacherPortal = TeacherPortal;
