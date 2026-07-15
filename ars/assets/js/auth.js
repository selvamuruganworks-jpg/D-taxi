/* 
  =========================================
  Authentication Helper - auth.js
  =========================================
  Manages session authentication, credentials checking, role permissions,
  and page redirection for Admin, Teacher, and Student dashboard states.
*/

const Auth = {
  // Login method supporting both live Firebase and Mock DB
  async login(email, password, expectedRole) {
    if (window.isFirebaseActive) {
      try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        
        // Fetch user document from Firestore to verify role
        const userDoc = await firebase.firestore().collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
          await firebase.auth().signOut();
          throw new Error("User record not found in system database.");
        }
        
        const userData = userDoc.data();
        
        if (userData.role !== expectedRole) {
          await firebase.auth().signOut();
          throw new Error(`Unauthorized. You do not have permissions for the ${expectedRole} portal.`);
        }
        
        // Setup session
        const sessionUser = {
          uid: userData.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role
        };
        
        // If teacher, find corresponding teacher record
        if (expectedRole === 'teacher') {
          const teacherSnap = await firebase.firestore().collection('teachers').where('email', '==', email).get();
          if (!teacherSnap.empty) {
            sessionUser.teacherId = teacherSnap.docs[0].id;
          }
        }
        
        // If student, find corresponding student record
        if (expectedRole === 'student') {
          const studentSnap = await firebase.firestore().collection('students').where('email', '==', email).get();
          if (!studentSnap.empty) {
            sessionUser.studentId = studentSnap.docs[0].id;
          }
        }
        
        sessionStorage.setItem('current_school_user', JSON.stringify(sessionUser));
        localStorage.setItem('current_school_user', JSON.stringify(sessionUser));
        return sessionUser;
        
      } catch (err) {
        throw new Error(err.message);
      }
    } else {
      // Mock login check
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const users = JSON.parse(localStorage.getItem('school_db_users')) || [];
            const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            
            if (!matchedUser) {
              return reject(new Error("Invalid email or password."));
            }
            
            if (matchedUser.role !== expectedRole) {
              return reject(new Error(`Unauthorized. You do not have permissions for the ${expectedRole} portal.`));
            }
            
            const sessionUser = {
              uid: matchedUser.uid,
              name: matchedUser.name,
              email: matchedUser.email,
              role: matchedUser.role
            };
            
            // Map to mock teacher or student databases
            if (expectedRole === 'teacher') {
              const teachers = JSON.parse(localStorage.getItem('school_db_teachers')) || [];
              const matchedTeacher = teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
              sessionUser.teacherId = matchedTeacher ? matchedTeacher.id : 'teach_1';
              sessionUser.name = matchedTeacher ? matchedTeacher.name : matchedUser.name;
            }
            
            if (expectedRole === 'student') {
              const students = JSON.parse(localStorage.getItem('school_db_students')) || [];
              const matchedStudent = students.find(s => s.phone.includes(email.split('@')[0]) || s.name.toLowerCase().includes(matchedUser.name.toLowerCase()));
              sessionUser.studentId = matchedStudent ? matchedStudent.id : 'stud_1';
              sessionUser.name = matchedStudent ? matchedStudent.name : matchedUser.name;
            }
            
            sessionStorage.setItem('current_school_user', JSON.stringify(sessionUser));
            localStorage.setItem('current_school_user', JSON.stringify(sessionUser));
            resolve(sessionUser);
          } catch (err) {
            reject(err);
          }
        }, 800);
      });
    }
  },

  // Log user out
  async logout() {
    if (window.isFirebaseActive) {
      await firebase.auth().signOut();
    }
    sessionStorage.removeItem('current_school_user');
    localStorage.removeItem('current_school_user');
    window.location.href = 'login.html';
  },

  // Retrieve current active user profile
  getCurrentUser() {
    let raw = sessionStorage.getItem('current_school_user');
    if (!raw) {
      raw = localStorage.getItem('current_school_user');
    }
    return raw ? JSON.parse(raw) : null;
  },

  // Route guarding helper
  checkAuthAndRedirect(allowedRole) {
    const user = this.getCurrentUser();
    
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    
    if (user.role !== allowedRole) {
      // Redirect to correct portal if they have a different session
      if (user.role === 'admin') window.location.href = 'dashboard.html?portal=admin';
      else if (user.role === 'teacher') window.location.href = 'dashboard.html?portal=teacher';
      else if (user.role === 'student') window.location.href = 'dashboard.html?portal=student';
      else window.location.href = 'login.html';
      return null;
    }
    
    return user;
  }
};

window.Auth = Auth;
