/* 
  =========================================
  Student Portal Controller - student.js
  =========================================
  Coordinates homework submission states, attendance ratios, FullCalendar schedules,
  Chart.js widgets, profile listings, and jsPDF vector report card downloaders.
*/

const StudentPortal = {
  currentUser: null,
  studentObj: null,
  studentHomeworkList: [],
  studentMarksList: [],
  studentAttendanceHistory: [],
  studentCalendar: null,
  attendanceCalendar: null,
  attendancePie: null,

  // Initialize Student Portal
  async init(user) {
    this.currentUser = user;

    // Retrieve full student object from database
    const students = await window.SchoolDB.getStudents();
    this.studentObj = students.find(s => s.id === user.studentId || s.name.toLowerCase().includes(user.name.toLowerCase()));

    if (!this.studentObj) {
      // Fallback fallback if user is created dynamically
      this.studentObj = students[0];
    }

    // Render Student Sidebar Menu
    const menuContainer = document.getElementById('portal-sidebar-menu');
    menuContainer.innerHTML = `
      <li class="sidebar-item active"><a href="#" data-view="student-dashboard"><i class="fas fa-home"></i><span>Dashboard</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="student-homework"><i class="fas fa-tasks"></i><span>My Homework</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="student-attendance"><i class="fas fa-calendar-check"></i><span>My Attendance</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="student-marks"><i class="fas fa-file-invoice"></i><span>Report Card</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="student-calendar"><i class="fas fa-calendar-alt"></i><span>School Calendar</span></a></li>
      <li class="sidebar-item"><a href="#" data-view="student-profile"><i class="fas fa-user-circle"></i><span>My Profile</span></a></li>
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
    window.switchPortalView('student-dashboard');
  },

  // View lifecycle router
  async onViewLoad(viewId) {
    document.getElementById('portal-view-title').textContent = this.getViewTitle(viewId);

    showLoader(true);
    try {
      if (viewId === 'student-dashboard') {
        await this.renderDashboard();
      } else if (viewId === 'student-homework') {
        await this.renderHomework();
      } else if (viewId === 'student-attendance') {
        await this.renderAttendanceHistory();
      } else if (viewId === 'student-marks') {
        await this.renderMarks();
      } else if (viewId === 'student-calendar') {
        this.initStudentCalendar();
      } else if (viewId === 'student-profile') {
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
      'student-dashboard': 'Student Dashboard Overview',
      'student-homework': 'Class Homework Assignments',
      'student-attendance': 'Personal Attendance Sheets',
      'student-marks': 'Grade Reports',
      'student-calendar': 'School Events Calendar',
      'student-profile': 'Student Personal Profile'
    };
    return titles[viewId] || 'Portal Dashboard';
  },

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  // Render Dashboard
  async renderDashboard() {
    if (!this.studentObj) return;

    // 1. Calculate statistics
    const allHw = await window.SchoolDB.getHomework(this.studentObj.class, this.studentObj.section);
    
    // Check submission status for homework list
    let pendingCount = 0;
    for (const hw of allHw) {
      const subs = await window.SchoolDB.getSubmissions(hw.id);
      const isSub = subs.some(s => s.studentId === this.studentObj.id && s.status === 'completed');
      if (!isSub) pendingCount++;
    }

    this.studentAttendanceHistory = await window.SchoolDB.getAttendanceHistory(this.studentObj.id);
    const presentCount = this.studentAttendanceHistory.filter(a => a.status === 'present').length;
    const attPercentage = this.studentAttendanceHistory.length > 0 
      ? Math.round((presentCount / this.studentAttendanceHistory.length) * 100) 
      : 92; // Baseline placeholder if history is small

    this.studentMarksList = await window.SchoolDB.getMarks(this.studentObj.id);
    const recentMark = this.studentMarksList.find(m => m.examType === 'Quarterly');

    document.getElementById('student-stat-attendance').textContent = `${attPercentage}%`;
    document.getElementById('student-stat-homework').textContent = pendingCount;
    document.getElementById('student-stat-rank').textContent = recentMark ? `#${recentMark.rank}` : 'Pending';

    // 2. Render notices
    const feed = document.getElementById('student-notices-feed');
    const notices = await window.SchoolDB.getNotices('students');
    const items = notices.slice(0, 3);

    if (items.length === 0) {
      feed.innerHTML = '<div class="text-muted p-2">No notifications posted for students.</div>';
    } else {
      feed.innerHTML = items.map(n => `
        <div class="list-group-item bg-transparent px-0 py-3 border-light">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1 font-title fw-bold text-primary">${n.title}</h6>
            <small class="text-muted">${formatDate(n.date)}</small>
          </div>
          <p class="mb-1 text-muted small">${n.content}</p>
          <small class="text-muted">From: ${n.author}</small>
        </div>
      `).join('');
    }
  },

  // Render Homework
  async renderHomework() {
    const container = document.getElementById('student-homework-list');
    
    try {
      const allHw = await window.SchoolDB.getHomework(this.studentObj.class, this.studentObj.section);
      
      if (allHw.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5">Hooray! No homework assigned for your class.</div>';
        return;
      }

      const cardsHtml = await Promise.all(allHw.map(async hw => {
        const subs = await window.SchoolDB.getSubmissions(hw.id);
        const submission = subs.find(s => s.studentId === this.studentObj.id);
        const isDone = submission && submission.status === 'completed';

        return `
          <div class="col-md-4">
            <div class="homework-card">
              <div class="homework-card-header">
                <div>
                  <span class="badge bg-light text-primary border">${hw.subject}</span>
                  <span class="badge bg-light text-dark border ms-1">${hw.class}-${hw.section}</span>
                </div>
                <div>
                  ${isDone 
                    ? '<span class="status-badge badge-completed">Completed</span>' 
                    : '<span class="status-badge badge-pending">Pending</span>'}
                </div>
              </div>
              <h5 class="font-title fw-bold mt-2">${hw.title}</h5>
              <p class="text-muted small mt-1 mb-3">${hw.description}</p>
              
              <div class="border-top pt-3 d-flex justify-content-between align-items-center">
                <span class="homework-due text-danger small"><i class="far fa-clock me-1"></i>Due: ${formatDate(hw.dueDate)}</span>
                ${isDone 
                  ? `<span class="text-success small fw-bold"><i class="fas fa-check-double me-1"></i> Submitted</span>` 
                  : `<button class="btn btn-sm btn-primary rounded-pill px-3" onclick="window.StudentPortal.submitHomeworkTask('${hw.id}')"><i class="fas fa-paper-plane me-1"></i> Submit Task</button>`}
              </div>
            </div>
          </div>
        `;
      }));

      container.innerHTML = cardsHtml.join('');
    } catch (err) {
      console.error(err);
    }
  },

  // Submit Homework task click action
  async submitHomeworkTask(hwId) {
    try {
      showLoader(true);
      await window.SchoolDB.submitHomework(hwId, this.studentObj.id, this.studentObj.name, 'completed');
      showToast("Homework task submitted successfully to teacher portal.", "success");
      await this.renderHomework();
    } catch (err) {
      showToast("Failed to submit task: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  // Render Attendance History Page
  async renderAttendanceHistory() {
    this.studentAttendanceHistory = await window.SchoolDB.getAttendanceHistory(this.studentObj.id);
    
    // Render FullCalendar list representing present/absent statuses
    const el = document.getElementById('studentAttendanceCalendar');
    if (el) {
      const events = this.studentAttendanceHistory.map(att => {
        let colorClass = 'event-sports'; // Default green present
        if (att.status === 'absent') colorClass = 'event-holiday'; // Red
        else if (att.status === 'leave') colorClass = 'event-reminder'; // Yellow

        return {
          title: att.status.toUpperCase(),
          start: att.date,
          className: colorClass
        };
      });

      if (this.attendanceCalendar) this.attendanceCalendar.destroy();
      this.attendanceCalendar = new FullCalendar.Calendar(el, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        events: events
      });
      this.attendanceCalendar.render();
    }

    // Attendance Share Pie Chart
    const present = this.studentAttendanceHistory.filter(a => a.status === 'present').length;
    const absent = this.studentAttendanceHistory.filter(a => a.status === 'absent').length;
    const leave = this.studentAttendanceHistory.filter(a => a.status === 'leave').length;

    const ctx = document.getElementById('studentAttendancePie');
    if (ctx) {
      if (this.attendancePie) this.attendancePie.destroy();
      this.attendancePie = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Present', 'Absent', 'Leave'],
          datasets: [{
            data: [present || 18, absent || 1, leave || 1], // Pre-populate mock visual data if history is small
            backgroundColor: ['#2a9d8f', '#e63946', '#ffb703'],
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

  // Render Marks card
  async renderMarks() {
    this.studentMarksList = await window.SchoolDB.getMarks(this.studentObj.id);
    this.loadExamMarks();
  },

  loadExamMarks() {
    const term = document.getElementById('examTermSelector').value;
    const container = document.getElementById('student-report-card-card');
    
    const markRecord = this.studentMarksList.find(m => m.examType === term);
    
    if (!markRecord) {
      container.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="fas fa-file-invoice fs-1 mb-3"></i>
          <p>Marks ledger reports for the <strong>${term} Exam Term</strong> are not published yet.</p>
        </div>
      `;
      return;
    }

    // Build subject list rows
    const subjectList = Object.keys(markRecord.marks);
    const tbodyHtml = subjectList.map(sub => {
      const score = markRecord.marks[sub];
      const resultClass = score >= 40 ? 'text-success fw-bold' : 'text-danger fw-bold';
      const resultText = score >= 40 ? 'PASS' : 'FAIL';

      return `
        <tr>
          <td><strong>${sub}</strong></td>
          <td>${score}</td>
          <td>100</td>
          <td><span class="${resultClass}">${resultText}</span></td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="report-card-container py-4" id="pdfReportCardWidget">
        <div class="report-header d-flex justify-content-between align-items-center">
          <img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&h=100&fit=crop" class="report-logo rounded-3 shadow-sm" alt="Logo">
          <div class="report-title-box">
            <h4 class="font-title fw-bold mb-1 text-primary">SRI ARVIND NURSERY & PRIMARY SCHOOL</h4>
            <span class="small text-muted d-block text-uppercase">Academic Progress Report Card</span>
          </div>
          <span class="badge bg-primary px-3 py-2 rounded-pill font-title">${markRecord.examType}</span>
        </div>

        <div class="report-grid-details mt-4 border rounded-3 p-3 bg-light">
          <div><strong>Student Name:</strong> ${markRecord.studentName}</div>
          <div><strong>Roll Number:</strong> ${this.studentObj.rollNumber}</div>
          <div><strong>Class / Section:</strong> ${markRecord.class} - ${markRecord.section}</div>
          <div><strong>Guardian Contact:</strong> ${this.studentObj.parentName} (${this.studentObj.phone})</div>
        </div>

        <table class="report-table-marks mt-4">
          <thead>
            <tr><th>Subject Name</th><th>Marks Obtained</th><th>Maximum Marks</th><th>Result</th></tr>
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>

        <div class="report-summary-boxes">
          <div class="summary-box"><span>Grand Total</span><h4>${markRecord.total} / 700</h4></div>
          <div class="summary-box"><span>Percentage</span><h4>${markRecord.percentage.toFixed(1)}%</h4></div>
          <div class="summary-box"><span>Final Grade</span><h4>${markRecord.grade}</h4></div>
          <div class="summary-box"><span>Class Rank</span><h4>#${markRecord.rank}</h4></div>
        </div>

        <div class="report-signatures mt-5">
          <div class="signature-line"><span>Class Teacher</span></div>
          <div class="signature-line"><span>School Principal</span></div>
          <div class="signature-line"><span>Parent Signature</span></div>
        </div>
      </div>
    `;
  },

  // Download beautiful PDF Report card using jsPDF coordinate drawings
  async downloadReportCardPDF() {
    const term = document.getElementById('examTermSelector').value;
    const markRecord = this.studentMarksList.find(m => m.examType === term);

    if (!markRecord) {
      showToast("No report card available to download.", "warning");
      return;
    }

    showLoader(true);
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      // 1. Border Frame drawing
      doc.setDrawColor(15, 76, 129); // Primary color border
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);
      
      doc.setDrawColor(0, 180, 216); // Accent color inner line
      doc.setLineWidth(0.5);
      doc.rect(7, 7, 196, 283);

      // 2. Header Box
      doc.setFillColor(248, 249, 250);
      doc.rect(10, 10, 190, 40, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 76, 129);
      doc.text("SRI ARVIND NURSERY & PRIMARY SCHOOL", 105, 22, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("5/758 New Housing Unit, Thuraiyur | info@stmaryschool.edu", 105, 28, { align: 'center' });
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 180, 216);
      doc.text(`ACADEMIC REPORT CARD - ${markRecord.examType.toUpperCase()} EXAMS`, 105, 38, { align: 'center' });

      // 3. Student Details Layout
      doc.setDrawColor(220);
      doc.setLineWidth(0.5);
      doc.rect(10, 55, 190, 32);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text("Student Name:", 15, 62);
      doc.text("Roll Number:", 15, 70);
      doc.text("Class - Section:", 15, 78);

      doc.setFont('Helvetica', 'normal');
      doc.text(markRecord.studentName, 45, 62);
      doc.text(this.studentObj.rollNumber, 45, 70);
      doc.text(`${markRecord.class} - ${markRecord.section}`, 45, 78);

      doc.setFont('Helvetica', 'bold');
      doc.text("Parent Name:", 110, 62);
      doc.text("Contact Phone:", 110, 70);
      doc.text("Blood Group:", 110, 78);

      doc.setFont('Helvetica', 'normal');
      doc.text(this.studentObj.parentName, 140, 62);
      doc.text(this.studentObj.phone, 140, 70);
      doc.text(this.studentObj.bloodGroup || "O+", 140, 78);

      // 4. Grades Table headers
      doc.setFillColor(15, 76, 129);
      doc.rect(10, 95, 190, 10, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255);
      doc.text("Subject Name", 15, 101);
      doc.text("Marks Obtained", 90, 101, { align: 'center' });
      doc.text("Maximum Marks", 140, 101, { align: 'center' });
      doc.text("Result", 185, 101, { align: 'center' });

      // Subject Rows drawing
      let currentY = 105;
      const subjects = Object.keys(markRecord.marks);
      doc.setTextColor(50);
      
      subjects.forEach((sub, index) => {
        currentY += 10;
        // Background row stripe
        if (index % 2 === 0) {
          doc.setFillColor(245, 247, 250);
          doc.rect(10, currentY - 6, 190, 10, 'F');
        }
        
        doc.setFont('Helvetica', 'bold');
        doc.text(sub, 15, currentY);
        
        doc.setFont('Helvetica', 'normal');
        const score = markRecord.marks[sub];
        doc.text(score.toString(), 90, currentY, { align: 'center' });
        doc.text("100", 140, currentY, { align: 'center' });
        
        const isPass = score >= 40;
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(isPass ? 42 : 230, isPass ? 157 : 57, isPass ? 143 : 70); // Green/Red
        doc.text(isPass ? "PASS" : "FAIL", 185, currentY, { align: 'center' });
        doc.setTextColor(50);
      });

      // 5. Total Summaries Block
      currentY += 20;
      doc.setDrawColor(200);
      doc.line(10, currentY - 5, 200, currentY - 5);

      doc.setFillColor(240, 244, 248);
      doc.rect(10, currentY, 190, 25, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("GRAND TOTAL", 25, currentY + 8, { align: 'center' });
      doc.text("PERCENTAGE", 75, currentY + 8, { align: 'center' });
      doc.text("OVERALL GRADE", 125, currentY + 8, { align: 'center' });
      doc.text("CLASS RANK", 175, currentY + 8, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(15, 76, 129);
      doc.text(`${markRecord.total} / 700`, 25, currentY + 18, { align: 'center' });
      doc.text(`${markRecord.percentage.toFixed(1)}%`, 75, currentY + 18, { align: 'center' });
      doc.text(markRecord.grade, 125, currentY + 18, { align: 'center' });
      doc.text(`#${markRecord.rank}`, 175, currentY + 18, { align: 'center' });

      // 6. Signatures Footer
      currentY += 48;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100);
      
      doc.line(20, currentY, 60, currentY);
      doc.text("Class Teacher", 40, currentY + 5, { align: 'center' });

      doc.line(85, currentY, 125, currentY);
      doc.text("School Principal", 105, currentY + 5, { align: 'center' });

      doc.line(150, currentY, 190, currentY);
      doc.text("Parent / Guardian", 170, currentY + 5, { align: 'center' });

      doc.save(`ReportCard_${markRecord.studentName.replace(/\s+/g, '_')}_${term}.pdf`);
      showToast("Report Card PDF generated successfully.", "success");
    } catch (err) {
      showToast("Failed to compile PDF: " + err.message, "error");
    } finally {
      showLoader(false);
    }
  },

  // Student Events Calendar
  async initStudentCalendar() {
    const el = document.getElementById('studentCalendar');
    if (!el) return;

    const eventsList = await window.SchoolDB.getEvents();
    const classHw = await window.SchoolDB.getHomework(this.studentObj.class, this.studentObj.section);

    // Format events for FullCalendar loader
    const fcEvents = eventsList.map(evt => ({
      title: evt.title,
      start: evt.start,
      end: evt.end,
      className: `event-${evt.type}`
    }));

    // Inject homework due markers too
    classHw.forEach(hw => {
      fcEvents.push({
        title: `HW Due: ${hw.title}`,
        start: hw.dueDate,
        className: `event-reminder`
      });
    });

    if (this.studentCalendar) this.studentCalendar.destroy();
    this.studentCalendar = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      events: fcEvents
    });
    this.studentCalendar.render();
  },

  // Profile renderer
  renderProfile() {
    if (!this.studentObj) return;

    document.getElementById('student-profile-avatar').src = this.studentObj.photo || 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=150&h=150&fit=crop';
    document.getElementById('student-profile-name').textContent = this.studentObj.name;
    document.getElementById('student-profile-class').textContent = `${this.studentObj.class} - ${this.studentObj.section}`;
    document.getElementById('student-profile-roll').textContent = this.studentObj.rollNumber;
    document.getElementById('student-profile-parent').textContent = this.studentObj.parentName;
    document.getElementById('student-profile-phone').textContent = this.studentObj.phone;
    document.getElementById('student-profile-address').textContent = this.studentObj.address;
    document.getElementById('student-profile-blood').textContent = this.studentObj.bloodGroup || 'O+';
    document.getElementById('student-profile-emergency').textContent = this.studentObj.emergencyContact || '---';
  }
};

window.StudentPortal = StudentPortal;
