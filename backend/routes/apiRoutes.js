const r = require("express").Router(),
  c = require("../controllers/resourceController"),
  { protect, authorize } = require("../middleware/auth");
r.use(protect);
r.get("/dashboard", c.dashboard);
r.get("/employees", authorize("HR", "Manager"), c.employees);
r.post("/employees", authorize("HR"), c.createEmployee);
r.patch("/employees/:id", authorize("HR"), c.updateEmployee);
r.delete("/employees/:id", authorize("HR"), c.deleteEmployee);
r.get("/leaves", c.leaveList);
r.post("/leaves", authorize("Employee"), c.applyLeave);
r.patch("/leaves/:id/review", authorize("HR", "Manager"), c.reviewLeave);
r.get("/attendance", c.attendanceList);
r.post("/attendance", authorize("Employee"), c.markAttendance);
r.post("/attendance/checkout", authorize("Employee"), c.checkOut);
r.get("/announcements", c.announcements);
r.post("/announcements", authorize("HR"), c.announcements);
r.get("/training", c.training);
r.post("/training", authorize("HR", "Manager"), c.training);
r.post("/training/:id/enroll", authorize("Employee"), c.enrollTraining);
r.get("/notifications", c.notifications);
r.patch("/notifications/:id/read", c.notifications);
r.post("/demo/seed", authorize("HR"), c.seed);
module.exports = r;
