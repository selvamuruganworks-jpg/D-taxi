/* 
  =============================================================
  School Management Database & Fallback Mock Engine - firebase-db.js
  =============================================================
  Implements a dual database abstraction layer. If firebase configuration
  is available, connects to real Firestore/Auth/Storage. If not (or keys are dummy),
  initiates an in-memory/localStorage mock engine with rich seed datasets.
*/

// Baseline Firebase Config Template - replace with real credentials in production
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if Firebase is actually configured with real values
let isFirebaseActive = false;
let db = null;
let auth = null;
let storage = null;

try {
  // If firebase compatibility SDK is loaded and keys are not placeholders
  if (typeof firebase !== 'undefined' && 
      firebaseConfig.apiKey && 
      !firebaseConfig.apiKey.includes('YOUR_API_KEY')) {
    
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    storage = firebase.storage();
    isFirebaseActive = true;
    console.log("Firebase initialized successfully.");
  } else {
    console.warn("Firebase config is default or SDK not loaded. Auto-initiating Local Mock DB Engine.");
  }
} catch (e) {
  console.error("Firebase startup failed; falling back to Mock DB Engine.", e);
}

// ==========================================
// MOCK DATABASE ENGINE (LocalStorage base)
// ==========================================

const MOCK_SEED_DATA = {
  schoolSettings: {
    schoolName: "Sri Arvind Nursery & Primary School",
    motto: "Knowledge, Character, Discipline",
    email: "info@stmaryschool.edu",
    phone: "+1 (555) 019-2834",
    address: "5/758 New Housing Unit, Thuraiyur",
    admissionOpen: true,
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&h=100&fit=crop"
  },
  users: [
    { uid: "admin_1", email: "admin@school.com", password: "password123", role: "admin", name: "School Administrator" },
    { uid: "teach_1", email: "teacher@school.com", password: "password123", role: "teacher", name: "Ms. Sarah Jenkins" },
    { uid: "stud_1", email: "student@school.com", password: "password123", role: "student", name: "Aaron Carter" }
  ],
  teachers: [
    { id: "teach_1", name: "Ms. Sarah Jenkins", email: "teacher@school.com", phone: "+1 (555) 011-2233", qualification: "B.Ed. in Early Childhood", experience: "5 Years", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop", assignedClasses: [{class: "Nursery", section: "A"}, {class: "LKG", section: "A"}] },
    { id: "teach_2", name: "Ms. Deborah Croft", email: "deborah.c@stmaryschool.edu", phone: "+1 (555) 012-3344", qualification: "M.A. in Child Psychology", experience: "7 Years", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop", assignedClasses: [{class: "UKG", section: "A"}] },
    { id: "teach_3", name: "Ms. Clara Finch", email: "clara.f@stmaryschool.edu", phone: "+1 (555) 013-4455", qualification: "B.A. English, B.Ed.", experience: "4 Years", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop", assignedClasses: [{class: "Class 1", section: "A"}, {class: "Class 2", section: "A"}] },
    { id: "teach_4", name: "Mr. Robert Vance", email: "robert.v@stmaryschool.edu", phone: "+1 (555) 014-5566", qualification: "B.Sc. Mathematics, B.Ed.", experience: "6 Years", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop", assignedClasses: [{class: "Class 3", section: "A"}, {class: "Class 4", section: "A"}, {class: "Class 5", section: "A"}] }
  ],
  students: [
    { id: "stud_1", name: "Aaron Carter", rollNumber: "N-01", parentName: "David Carter", phone: "+1 (555) 019-1111", address: "14 Elm St, Springfield", bloodGroup: "O+", emergencyContact: "David Carter - +1 (555) 019-1111", class: "Nursery", section: "A", photo: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150&h=150&fit=crop" },
    { id: "stud_2", name: "Bella Swan", rollNumber: "L-01", parentName: "Charlie Swan", phone: "+1 (555) 019-2222", address: "28 River Rd, Forks", bloodGroup: "A-", emergencyContact: "Charlie Swan - +1 (555) 019-2222", class: "LKG", section: "A", photo: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=150&h=150&fit=crop" },
    { id: "stud_3", name: "Charlie Brown", rollNumber: "U-01", parentName: "John Brown", phone: "+1 (555) 019-3333", address: "42 Pine Crest, Minnetonka", bloodGroup: "B+", emergencyContact: "John Brown - +1 (555) 019-3333", class: "UKG", section: "A", photo: "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=150&h=150&fit=crop" },
    { id: "stud_4", name: "Daisy Miller", rollNumber: "1-01", parentName: "Henry Miller", phone: "+1 (555) 019-4444", address: "88 Maple Ave, Geneva", bloodGroup: "AB+", emergencyContact: "Henry Miller - +1 (555) 019-4444", class: "Class 1", section: "A", photo: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=150&h=150&fit=crop" },
    { id: "stud_5", name: "Ethan Hunt", rollNumber: "2-01", parentName: "Nate Hunt", phone: "+1 (555) 019-5555", address: "77 Mission St, Arlington", bloodGroup: "O-", emergencyContact: "Nate Hunt - +1 (555) 019-5555", class: "Class 2", section: "A", photo: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=150&h=150&fit=crop" },
    { id: "stud_6", name: "Fiona Gallagher", rollNumber: "3-01", parentName: "Frank Gallagher", phone: "+1 (555) 019-6666", address: "211 N Homan Ave, Chicago", bloodGroup: "B-", emergencyContact: "Monica Gallagher - +1 (555) 019-6666", class: "Class 3", section: "A", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop" },
    { id: "stud_7", name: "George Cooper", rollNumber: "4-01", parentName: "George Cooper Sr.", phone: "+1 (555) 019-7777", address: "33 Stadium Lane, Medford", bloodGroup: "A+", emergencyContact: "Mary Cooper - +1 (555) 019-7777", class: "Class 4", section: "A", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" },
    { id: "stud_8", name: "Hannah Baker", rollNumber: "5-01", parentName: "Olivia Baker", phone: "+1 (555) 019-8888", address: "90 Liberty Way, Claymont", bloodGroup: "O+", emergencyContact: "Olivia Baker - +1 (555) 019-8888", class: "Class 5", section: "A", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" }
  ],
  classes: [
    { name: "Nursery", sections: ["A", "B"] },
    { name: "LKG", sections: ["A", "B"] },
    { name: "UKG", sections: ["A", "B"] },
    { name: "Class 1", sections: ["A", "B"] },
    { name: "Class 2", sections: ["A", "B"] },
    { name: "Class 3", sections: ["A", "B"] },
    { name: "Class 4", sections: ["A", "B"] },
    { name: "Class 5", sections: ["A", "B"] }
  ],
  subjects: ["English", "Tamil", "Math", "Science", "Social", "Computer", "General Knowledge"],
  attendance: [
    { id: "att_1", class: "Nursery", section: "A", date: "2026-07-14", records: { "stud_1": "present" }, markedBy: "Ms. Sarah Jenkins" },
    { id: "att_2", class: "LKG", section: "A", date: "2026-07-14", records: { "stud_2": "present" }, markedBy: "Ms. Sarah Jenkins" },
    { id: "att_3", class: "UKG", section: "A", date: "2026-07-14", records: { "stud_3": "absent" }, markedBy: "Ms. Deborah Croft" }
  ],
  homework: [
    { id: "hw_1", class: "Nursery", section: "A", subject: "English", title: "Trace alphabets A-F", description: "Trace letters A to F twice in your homework booklet and color the apples.", dueDays: 2, dueDate: "2026-07-17", teacherId: "teach_1", attachment: "alphabet_tracing.pdf" },
    { id: "hw_2", class: "Class 1", section: "A", subject: "Math", title: "Addition up to 20", description: "Complete exercises on page 34 in your Math textbook.", dueDays: 1, dueDate: "2026-07-16", teacherId: "teach_3", attachment: "" }
  ],
  homeworkSubmissions: [
    { id: "sub_1", homeworkId: "hw_1", studentId: "stud_1", studentName: "Aaron Carter", status: "completed", submittedAt: "2026-07-15T10:00:00Z" }
  ],
  calendarEvents: [
    { id: "evt_1", title: "Sports Day Practice", start: "2026-07-18", end: "2026-07-18", type: "sports", description: "Annual sports day selection trial." },
    { id: "evt_2", title: "Parent Teacher Meeting", start: "2026-07-25", end: "2026-07-25", type: "meeting", description: "Discussing 1st midterm results." },
    { id: "evt_3", title: "Summer Holidays Ends", start: "2026-07-01", end: "2026-07-01", type: "holiday", description: "School reopening." },
    { id: "evt_4", title: "First Midterm Exams", start: "2026-07-28", end: "2026-07-31", type: "exam", description: "Midterm tests for LKG to Class 5." }
  ],
  marks: [
    { id: "mark_1", studentId: "stud_1", studentName: "Aaron Carter", class: "Nursery", section: "A", examType: "Quarterly", marks: { English: 85, Tamil: 90, Math: 88, Science: 82, Social: 80, Computer: 95, "General Knowledge": 92 }, total: 612, average: 87.4, percentage: 87.4, grade: "A", rank: 1 }
  ],
  notices: [
    { id: "not_1", title: "Admissions Open for 2026-2027", content: "Admissions are officially open for Nursery to Class 5. Please share with relatives and friends.", target: "all", date: "2026-07-10", author: "Principal" },
    { id: "not_2", title: "New Attendance Guidelines", content: "Teachers are requested to update portal attendance daily by 10:00 AM.", target: "teachers", date: "2026-07-12", author: "Administrator" }
  ],
  gallery: [
    { id: "gal_1", title: "Classroom Activities", category: "campus", imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&auto=format&fit=crop" },
    { id: "gal_2", title: "Kids Sports Meet", category: "sports", imageUrl: "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=500&auto=format&fit=crop" },
    { id: "gal_3", title: "Science Day Expo", category: "events", imageUrl: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&auto=format&fit=crop" }
  ],
  admissionEnquiries: []
};

// Initiate LocalStorage state
if (!isFirebaseActive) {
  if (!localStorage.getItem('school_db_initialized') || !localStorage.getItem('school_db_users')) {
    localStorage.setItem('school_db_initialized', 'true');
    localStorage.setItem('school_db_settings', JSON.stringify(MOCK_SEED_DATA.schoolSettings));
    localStorage.setItem('school_db_users', JSON.stringify(MOCK_SEED_DATA.users));
    localStorage.setItem('school_db_teachers', JSON.stringify(MOCK_SEED_DATA.teachers));
    localStorage.setItem('school_db_students', JSON.stringify(MOCK_SEED_DATA.students));
    localStorage.setItem('school_db_classes', JSON.stringify(MOCK_SEED_DATA.classes));
    localStorage.setItem('school_db_subjects', JSON.stringify(MOCK_SEED_DATA.subjects));
    localStorage.setItem('school_db_attendance', JSON.stringify(MOCK_SEED_DATA.attendance));
    localStorage.setItem('school_db_homework', JSON.stringify(MOCK_SEED_DATA.homework));
    localStorage.setItem('school_db_homeworkSubmissions', JSON.stringify(MOCK_SEED_DATA.homeworkSubmissions));
    localStorage.setItem('school_db_calendarEvents', JSON.stringify(MOCK_SEED_DATA.calendarEvents));
    localStorage.setItem('school_db_marks', JSON.stringify(MOCK_SEED_DATA.marks));
    localStorage.setItem('school_db_notices', JSON.stringify(MOCK_SEED_DATA.notices));
    localStorage.setItem('school_db_gallery', JSON.stringify(MOCK_SEED_DATA.gallery));
    localStorage.setItem('school_db_enquiries', JSON.stringify([]));
  }
}

// Helper to interact with LocalStorage
const mockGet = (key) => JSON.parse(localStorage.getItem('school_db_' + key));
const mockSet = (key, data) => localStorage.setItem('school_db_' + key, JSON.stringify(data));

// ==========================================
// PUBLIC UNIFIED DATABASE API
// ==========================================

const SchoolDB = {
  // Settings
  async getSettings() {
    if (isFirebaseActive) {
      const snap = await db.collection('schoolSettings').doc('primary').get();
      return snap.exists ? snap.data() : MOCK_SEED_DATA.schoolSettings;
    } else {
      return mockGet('settings');
    }
  },

  async updateSettings(settings) {
    if (isFirebaseActive) {
      await db.collection('schoolSettings').doc('primary').set(settings, { merge: true });
    } else {
      mockSet('settings', settings);
    }
    return true;
  },

  // Users & Auth Mock Wrapper
  async registerUser(email, password, role, name) {
    if (isFirebaseActive) {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;
      const userObj = { uid, email, role, name, createdAt: new Date().toISOString() };
      await db.collection('users').doc(uid).set(userObj);
      return userObj;
    } else {
      const users = mockGet('users');
      if (users.find(u => u.email === email)) throw new Error("Email already registered.");
      const newUser = { uid: 'user_' + Date.now(), email, password, role, name };
      users.push(newUser);
      mockSet('users', users);
      return newUser;
    }
  },

  // Teachers
  async getTeachers() {
    if (isFirebaseActive) {
      const snap = await db.collection('teachers').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return mockGet('teachers');
    }
  },

  async addTeacher(teacher) {
    if (isFirebaseActive) {
      const docRef = await db.collection('teachers').add(teacher);
      return docRef.id;
    } else {
      const teachers = mockGet('teachers');
      const id = 'teach_' + Date.now();
      const newTeacher = { id, ...teacher };
      teachers.push(newTeacher);
      mockSet('teachers', teachers);
      return id;
    }
  },

  async updateTeacher(id, data) {
    if (isFirebaseActive) {
      await db.collection('teachers').doc(id).update(data);
    } else {
      const teachers = mockGet('teachers');
      const idx = teachers.findIndex(t => t.id === id);
      if (idx !== -1) {
        teachers[idx] = { ...teachers[idx], ...data };
        mockSet('teachers', teachers);
      }
    }
    return true;
  },

  async deleteTeacher(id) {
    if (isFirebaseActive) {
      await db.collection('teachers').doc(id).delete();
    } else {
      const teachers = mockGet('teachers');
      const filtered = teachers.filter(t => t.id !== id);
      mockSet('teachers', filtered);
    }
    return true;
  },

  // Students
  async getStudents() {
    if (isFirebaseActive) {
      const snap = await db.collection('students').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return mockGet('students');
    }
  },

  async addStudent(student) {
    if (isFirebaseActive) {
      const docRef = await db.collection('students').add(student);
      return docRef.id;
    } else {
      const students = mockGet('students');
      const id = 'stud_' + Date.now();
      const newStudent = { id, ...student };
      students.push(newStudent);
      mockSet('students', students);
      return id;
    }
  },

  async updateStudent(id, data) {
    if (isFirebaseActive) {
      await db.collection('students').doc(id).update(data);
    } else {
      const students = mockGet('students');
      const idx = students.findIndex(s => s.id === id);
      if (idx !== -1) {
        students[idx] = { ...students[idx], ...data };
        mockSet('students', students);
      }
    }
    return true;
  },

  async deleteStudent(id) {
    if (isFirebaseActive) {
      await db.collection('students').doc(id).delete();
    } else {
      const students = mockGet('students');
      const filtered = students.filter(s => s.id !== id);
      mockSet('students', filtered);
    }
    return true;
  },

  // Classes & Subjects
  async getClasses() {
    if (isFirebaseActive) {
      const snap = await db.collection('classes').get();
      return snap.docs.map(doc => doc.data());
    } else {
      return mockGet('classes');
    }
  },

  async addClass(name, sections) {
    if (isFirebaseActive) {
      await db.collection('classes').doc(name).set({ name, sections });
    } else {
      const classes = mockGet('classes');
      if (classes.find(c => c.name === name)) return;
      classes.push({ name, sections });
      mockSet('classes', classes);
    }
  },

  async getSubjects() {
    if (isFirebaseActive) {
      const doc = await db.collection('schoolSettings').doc('subjects').get();
      return doc.exists ? doc.data().list : MOCK_SEED_DATA.subjects;
    } else {
      return mockGet('subjects');
    }
  },

  // Attendance
  async getAttendance(className, section, date) {
    if (isFirebaseActive) {
      const snap = await db.collection('attendance')
        .where('class', '==', className)
        .where('section', '==', section)
        .where('date', '==', date)
        .get();
      return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } else {
      const list = mockGet('attendance');
      return list.find(a => a.class === className && a.section === section && a.date === date) || null;
    }
  },

  async getAttendanceHistory(studentId) {
    if (isFirebaseActive) {
      const snap = await db.collection('attendance').get();
      const records = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (data.records[studentId]) {
          records.push({ date: data.date, status: data.records[studentId] });
        }
      });
      return records;
    } else {
      const list = mockGet('attendance');
      return list.filter(a => a.records[studentId])
                 .map(a => ({ date: a.date, status: a.records[studentId] }));
    }
  },

  async markAttendance(className, section, date, records, teacherName) {
    const payload = { class: className, section, date, records, markedBy: teacherName, updatedAt: new Date().toISOString() };
    if (isFirebaseActive) {
      const existing = await this.getAttendance(className, section, date);
      if (existing) {
        await db.collection('attendance').doc(existing.id).set(payload, { merge: true });
      } else {
        await db.collection('attendance').add({ ...payload, createdAt: new Date().toISOString() });
      }
    } else {
      const list = mockGet('attendance');
      const idx = list.findIndex(a => a.class === className && a.section === section && a.date === date);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        list.push({ id: 'att_' + Date.now(), ...payload, createdAt: new Date().toISOString() });
      }
      mockSet('attendance', list);
    }
    return true;
  },

  // Homework
  async getHomework(className, section) {
    if (isFirebaseActive) {
      let query = db.collection('homework');
      if (className) query = query.where('class', '==', className);
      if (section) query = query.where('section', '==', section);
      const snap = await query.get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const list = mockGet('homework');
      return list.filter(h => (!className || h.class === className) && (!section || h.section === section));
    }
  },

  async addHomework(homework) {
    if (isFirebaseActive) {
      const docRef = await db.collection('homework').add(homework);
      return docRef.id;
    } else {
      const list = mockGet('homework');
      const id = 'hw_' + Date.now();
      list.push({ id, ...homework });
      mockSet('homework', list);
      return id;
    }
  },

  async deleteHomework(id) {
    if (isFirebaseActive) {
      await db.collection('homework').doc(id).delete();
    } else {
      const list = mockGet('homework');
      mockSet('homework', list.filter(h => h.id !== id));
    }
    return true;
  },

  // Homework Submissions
  async getSubmissions(homeworkId) {
    if (isFirebaseActive) {
      const snap = await db.collection('homeworkSubmissions').where('homeworkId', '==', homeworkId).get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const list = mockGet('homeworkSubmissions');
      return list.filter(s => s.homeworkId === homeworkId);
    }
  },

  async submitHomework(homeworkId, studentId, studentName, status) {
    const payload = { homeworkId, studentId, studentName, status, submittedAt: new Date().toISOString() };
    if (isFirebaseActive) {
      await db.collection('homeworkSubmissions').add(payload);
    } else {
      const list = mockGet('homeworkSubmissions');
      // If already submitted, replace
      const filtered = list.filter(s => !(s.homeworkId === homeworkId && s.studentId === studentId));
      filtered.push({ id: 'sub_' + Date.now(), ...payload });
      mockSet('homeworkSubmissions', filtered);
    }
    return true;
  },

  // Calendar
  async getEvents() {
    if (isFirebaseActive) {
      const snap = await db.collection('calendarEvents').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return mockGet('calendarEvents');
    }
  },

  async addEvent(evt) {
    if (isFirebaseActive) {
      const docRef = await db.collection('calendarEvents').add(evt);
      return docRef.id;
    } else {
      const list = mockGet('calendarEvents');
      const id = 'evt_' + Date.now();
      list.push({ id, ...evt });
      mockSet('calendarEvents', list);
      return id;
    }
  },

  async deleteEvent(id) {
    if (isFirebaseActive) {
      await db.collection('calendarEvents').doc(id).delete();
    } else {
      const list = mockGet('calendarEvents');
      mockSet('calendarEvents', list.filter(e => e.id !== id));
    }
    return true;
  },

  // Marks & Grading
  async getMarks(studentId) {
    if (isFirebaseActive) {
      const snap = await db.collection('marks').where('studentId', '==', studentId).get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const list = mockGet('marks');
      return list.filter(m => m.studentId === studentId);
    }
  },

  async getMarksByClass(className, section) {
    if (isFirebaseActive) {
      const snap = await db.collection('marks')
        .where('class', '==', className)
        .where('section', '==', section)
        .get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const list = mockGet('marks');
      return list.filter(m => m.class === className && m.section === section);
    }
  },

  async saveMarks(marksObj) {
    if (isFirebaseActive) {
      // Find if student mark sheet for exam type exists
      const snap = await db.collection('marks')
        .where('studentId', '==', marksObj.studentId)
        .where('examType', '==', marksObj.examType)
        .get();
      if (!snap.empty) {
        await db.collection('marks').doc(snap.docs[0].id).set(marksObj, { merge: true });
      } else {
        await db.collection('marks').add({ ...marksObj, createdAt: new Date().toISOString() });
      }
    } else {
      const list = mockGet('marks');
      const idx = list.findIndex(m => m.studentId === marksObj.studentId && m.examType === marksObj.examType);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...marksObj };
      } else {
        list.push({ id: 'mark_' + Date.now(), ...marksObj, createdAt: new Date().toISOString() });
      }
      mockSet('marks', list);
    }
    return true;
  },

  // Notices
  async getNotices(target) {
    if (isFirebaseActive) {
      let query = db.collection('notices');
      if (target) query = query.where('target', 'in', ['all', target]);
      const snap = await query.orderBy('date', 'desc').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const list = mockGet('notices');
      const sorted = list.sort((a, b) => new Date(b.date) - new Date(a.date));
      if (!target) return sorted;
      return sorted.filter(n => n.target === 'all' || n.target === target);
    }
  },

  async addNotice(notice) {
    if (isFirebaseActive) {
      const docRef = await db.collection('notices').add(notice);
      return docRef.id;
    } else {
      const list = mockGet('notices');
      const id = 'not_' + Date.now();
      list.push({ id, ...notice });
      mockSet('notices', list);
      return id;
    }
  },

  async deleteNotice(id) {
    if (isFirebaseActive) {
      await db.collection('notices').doc(id).delete();
    } else {
      const list = mockGet('notices');
      mockSet('notices', list.filter(n => n.id !== id));
    }
    return true;
  },

  // Gallery
  async getGallery() {
    if (isFirebaseActive) {
      const snap = await db.collection('gallery').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return mockGet('gallery');
    }
  },

  async addGalleryImage(img) {
    if (isFirebaseActive) {
      const docRef = await db.collection('gallery').add(img);
      return docRef.id;
    } else {
      const list = mockGet('gallery');
      const id = 'gal_' + Date.now();
      list.push({ id, ...img });
      mockSet('gallery', list);
      return id;
    }
  },

  // Enquiries
  async submitEnquiry(enquiry) {
    const payload = { ...enquiry, createdAt: new Date().toISOString() };
    if (isFirebaseActive) {
      await db.collection('admissionEnquiries').add(payload);
    } else {
      const list = mockGet('enquiries') || [];
      list.push({ id: 'enq_' + Date.now(), ...payload });
      mockSet('enquiries', list);
    }
    return true;
  },

  async getEnquiries() {
    if (isFirebaseActive) {
      const snap = await db.collection('admissionEnquiries').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return mockGet('enquiries') || [];
    }
  },

  // Storage / File Upload simulator
  async uploadFile(file, path) {
    if (isFirebaseActive && storage) {
      const ref = storage.ref().child(path);
      const snapshot = await ref.put(file);
      return await snapshot.ref.getDownloadURL();
    } else {
      // Mock File Upload: returns a local object URL or Base64 encoding
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }
  },

  // Export full JSON Backup utility
  async triggerLocalBackup() {
    if (isFirebaseActive) {
      // In firebase mode, compile data from Firestore
      const backup = {
        backupDate: new Date().toISOString(),
        settings: await this.getSettings(),
        teachers: await this.getTeachers(),
        students: await this.getStudents(),
        homework: await this.getHomework(),
        calendarEvents: await this.getEvents(),
        notices: await this.getNotices()
      };
      return backup;
    } else {
      // In local mode, return full local storage structure
      return {
        backupDate: new Date().toISOString(),
        settings: mockGet('settings'),
        teachers: mockGet('teachers'),
        students: mockGet('students'),
        homework: mockGet('homework'),
        homeworkSubmissions: mockGet('homeworkSubmissions'),
        attendance: mockGet('attendance'),
        calendarEvents: mockGet('calendarEvents'),
        marks: mockGet('marks'),
        notices: mockGet('notices'),
        gallery: mockGet('gallery'),
        enquiries: mockGet('enquiries')
      };
    }
  }
};

// Export to window for global script reference
window.SchoolDB = SchoolDB;
window.isFirebaseActive = isFirebaseActive;
