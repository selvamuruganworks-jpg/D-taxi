# St. Mary's School Management System (JavaScript Full Stack)

A complete, production-ready, premium **Nursery & Primary School Management System** built with client-side JavaScript, Bootstrap 5, Font Awesome, Chart.js, FullCalendar.js, and Vercel serverless integration. It features a dual-mode database layer: it connects to **Firebase** when configuration keys are populated, and automatically falls back to an **interactive Local Demo Mode** powered by `localStorage` and a rich pre-loaded seed dataset when keys are empty.

---

## 🚀 Key Features

* **Public Website:** Fully responsive landing pages (`index.html`, `about.html`, `admissions.html`, `gallery.html`, `contact.html`) styled with custom glassmorphism containers, hover animations, filterable dynamic photo galleries, admission forms, and latest announcements.
* **Unified Dashboard Portal (`dashboard.html`):** A single-page portal shell which dynamically loads navigation sidebars and views depending on the logged-in user role (Admin, Teacher, or Student).
* **Admin Portal:**
  * Real-time metrics counters and statistics (Ratio charts, enrollment bar graphs).
  * Full CRUD management for Teachers, Students, Notice Boards, and Class Sections.
  * CSV data exporter and one-click JSON backup snapshots.
* **Teacher Portal:**
  * Multi-student daily checklist grid for attendance (Present, Absent, Leave).
  * Homework broadcasts (publish title, description, and due date to classes).
  * Subject marks compilation, automatic grade deductions, and class ranking calculations.
  * Precise vector PDF report card generator (custom drawn coordinates).
* **Student Portal:**
  * Direct dashboard stats summary showing pending tasks, attendance shares, and ranks.
  * Homework view and one-click "Submit Task" buttons.
  * visual monthly attendance calendars and attendance ratio pie charts.
  * Report card inspection and direct PDF downloads.

---

## 🔑 Demo Login Credentials (Local Fallback Mode)

When launching the project locally, the app starts in **Demo Mode**. You can log in using these default profiles (passwords are prefilled on the login screen):

* **Admin Portal:**
  * **Email:** `admin@school.com`
  * **Password:** `password123`
* **Teacher Portal:**
  * **Email:** `teacher@school.com`
  * **Password:** `password123`
* **Student Portal:**
  * **Email:** `student@school.com`
  * **Password:** `password123`

---

## 🛠️ Step-by-Step Local Setup

1. **Clone or Download** this folder structure to your local workspace directory.
2. Since the app is built on modular client-side JS and serverless endpoints, you can run a simple local static file server. For example:
   * Using VS Code: Right-click `index.html` and select **Open with Live Server**.
   * Using Python: Run `python -m http.server 8000` in the directory, then visit `http://localhost:8000`.
   * Using Node: Install `serve` globally via `npm i -g serve` and run `serve .`.
3. Try clicking around the website, applying for admissions, logging in, posting notices, marking attendance, inputting marks, and printing report card PDFs. All edits will persist in your browser's `localStorage`!

---

## 🔥 Connecting to Firebase

To connect the application to a live Firebase backend database:

### 1. Create a Firebase Project
* Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
* Disable or enable Google Analytics according to your preference and click **Create Project**.

### 2. Configure Authentication
* In the Firebase Console left sidebar, click **Build** -> **Authentication** -> **Get Started**.
* Enable the **Email/Password** sign-in method.

### 3. Initialize Cloud Firestore
* Go to **Build** -> **Firestore Database** -> **Create Database**.
* Set the database location and choose **Start in test mode** (or apply production rules).
* Create the following collections:
  * `users`
  * `admins`
  * `teachers`
  * `students`
  * `classes`
  * `attendance`
  * `homework`
  * `homeworkSubmissions`
  * `calendarEvents`
  * `marks`
  * `notices`
  * `gallery`
  * `admissionEnquiries`
  * `schoolSettings`

### 4. Configure Firebase Keys in Source Code
* In the Firebase Console, go to **Project Settings** (gear icon near Project Overview).
* Scroll down to **Your apps**, click the web icon (`</>`), register your app name, and copy the `firebaseConfig` keys.
* Open [firebase-db.js](file:///c:/Users/indiafilings/Desktop/ars/assets/js/firebase-db.js) and replace the placeholder `firebaseConfig` object at the top of the file:
  ```javascript
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  ```
* Save the file. The database visual indicator in the portal header will switch from **Demo Mode** to **Firebase Active**.

---

## ⚡ Deployment to Vercel

The application is structured for instant serverless deployment on Vercel:

1. **Install Vercel CLI** globally (optional, or deploy via GitHub):
   ```bash
   npm install -g vercel
   ```
2. **Deploy directly** from the project root directory by running:
   ```bash
   vercel
   ```
3. Follow the CLI prompts:
   * Link to your Vercel account.
   * Accept default settings (Vercel will auto-detect the root index file and deploy `api/backup.js` as a Node.js serverless function!).
4. To deploy to production:
   ```bash
   vercel --prod
   ```
5. You will get a live URL (e.g. `https://your-school-app.vercel.app/`). Clean URLs (like `/login`, `/about`, and `/dashboard`) will be routed automatically based on the configurations inside [vercel.json](file:///c:/Users/indiafilings/Desktop/ars/vercel.json).
