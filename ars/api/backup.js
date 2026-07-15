// Vercel serverless function: api/backup.js
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Pre-configured mock backup dataset
  const seedBackup = {
    backupDate: new Date().toISOString(),
    schoolName: "Sri Arvind Nursery & Primary School",
    version: "1.0.0",
    collections: {
      schoolSettings: {
        schoolName: "Sri Arvind Nursery & Primary School",
        motto: "Knowledge, Character, Discipline",
        email: "info@stmaryschool.edu",
        phone: "+1 (555) 019-2834",
        address: "5/758 New Housing Unit, Thuraiyur",
        admissionOpen: true,
        logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&h=100&fit=crop"
      },
      classes: [
        { name: "Nursery", teacher: "Ms. Sarah Jenkins", studentsCount: 15 },
        { name: "LKG", teacher: "Ms. Deborah Croft", studentsCount: 18 },
        { name: "UKG", teacher: "Ms. Clara Finch", studentsCount: 20 },
        { name: "Class 1", teacher: "Mr. Robert Vance", studentsCount: 22 },
        { name: "Class 2", teacher: "Mrs. Jennifer Lawrence", studentsCount: 24 },
        { name: "Class 3", teacher: "Ms. Emily Watson", studentsCount: 20 },
        { name: "Class 4", teacher: "Mr. Thomas Miller", studentsCount: 25 },
        { name: "Class 5", teacher: "Mrs. Rachel Green", studentsCount: 23 }
      ],
      teachers: [
        { id: "teach_1", name: "Ms. Sarah Jenkins", email: "sarah.j@stmaryschool.edu", phone: "+1 (555) 011-2233", qualification: "B.Ed. in Early Childhood", experience: "5 Years", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop", assignedClasses: [{class: "Nursery", section: "A"}] },
        { id: "teach_2", name: "Ms. Deborah Croft", email: "deborah.c@stmaryschool.edu", phone: "+1 (555) 012-3344", qualification: "M.A. in Child Psychology, B.Ed.", experience: "7 Years", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop", assignedClasses: [{class: "LKG", section: "A"}] },
        { id: "teach_3", name: "Ms. Clara Finch", email: "clara.f@stmaryschool.edu", phone: "+1 (555) 013-4455", qualification: "B.A. English, B.Ed.", experience: "4 Years", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop", assignedClasses: [{class: "UKG", section: "A"}] },
        { id: "teach_4", name: "Mr. Robert Vance", email: "robert.v@stmaryschool.edu", phone: "+1 (555) 014-5566", qualification: "B.Sc. Mathematics, B.Ed.", experience: "6 Years", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop", assignedClasses: [{class: "Class 1", section: "A"}] }
      ],
      students: [
        { id: "stud_1", name: "Aaron Carter", rollNumber: "N-01", parentName: "David Carter", phone: "+1 (555) 019-1111", address: "14 Elm St, Springfield", bloodGroup: "O+", emergencyContact: "David Carter - +1 (555) 019-1111", class: "Nursery", section: "A", photo: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150&h=150&fit=crop" },
        { id: "stud_2", name: "Bella Swan", rollNumber: "L-01", parentName: "Charlie Swan", phone: "+1 (555) 019-2222", address: "28 River Rd, Forks", bloodGroup: "A-", emergencyContact: "Charlie Swan - +1 (555) 019-2222", class: "LKG", section: "A", photo: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=150&h=150&fit=crop" },
        { id: "stud_3", name: "Charlie Brown", rollNumber: "U-01", parentName: "John Brown", phone: "+1 (555) 019-3333", address: "42 Pine Crest, Minnetonka", bloodGroup: "B+", emergencyContact: "John Brown - +1 (555) 019-3333", class: "UKG", section: "A", photo: "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=150&h=150&fit=crop" },
        { id: "stud_4", name: "Daisy Miller", rollNumber: "1-01", parentName: "Henry Miller", phone: "+1 (555) 019-4444", address: "88 Maple Ave, Geneva", bloodGroup: "AB+", emergencyContact: "Henry Miller - +1 (555) 019-4444", class: "Class 1", section: "A", photo: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=150&h=150&fit=crop" }
      ]
    }
  };

  if (req.method === 'POST') {
    // If client submits their current active state, compile and return it as a downloadable JSON file
    try {
      const clientData = req.body || {};
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="school_management_backup.json"');
      res.status(200).send(JSON.stringify(clientData, null, 2));
    } catch (err) {
      res.status(400).json({ error: "Failed to compile backup", details: err.message });
    }
  } else {
    // Default GET request returns the baseline seed backup data
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="school_management_seed.json"');
    res.status(200).send(JSON.stringify(seedBackup, null, 2));
  }
};
