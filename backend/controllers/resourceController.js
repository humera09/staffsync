const Employee = require("../models/Employee"),
  Leave = require("../models/LeaveRequest"),
  Attendance = require("../models/Attendance"),
  Announcement = require("../models/Announcement"),
  Training = require("../models/TrainingProgram"),
  Notification = require("../models/Notification");
const asyncWrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const employeeFor = async (user) => Employee.findOne({ user: user._id });
exports.dashboard = asyncWrap(async (req, res) => {
  const [employees, leaves, pending, announcements, training] =
    await Promise.all([
      Employee.countDocuments({ status: "Active" }),
      Leave.countDocuments(),
      Leave.countDocuments({ status: "Pending" }),
      Announcement.countDocuments({ published: true }),
      Training.countDocuments({ date: { $gte: new Date() } }),
    ]);
  const mine = await employeeFor(req.user);
  const attendanceToday = mine
    ? await Attendance.countDocuments({
        employee: mine._id,
        date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      })
    : 0;
  res.json({
    employees,
    leaves,
    pending,
    announcements,
    training,
    attendanceToday,
  });
});
exports.employees = asyncWrap(async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search)
    filter.$or = [
      { name: new RegExp(req.query.search, "i") },
      { email: new RegExp(req.query.search, "i") },
      { employeeId: new RegExp(req.query.search, "i") },
    ];
  const data = await Employee.find(filter)
    .populate("user", "role")
    .sort({ createdAt: -1 });
  res.json(data);
});
exports.createEmployee = asyncWrap(async (req, res) => {
  const {
    name,
    email,
    department,
    position,
    phone,
    role = "Employee",
    password = "StaffSync123!",
  } = req.body;
  if (!name || !email)
    return res.status(400).json({ message: "Name and email are required" });
  const User = require("../models/User"),
    bcrypt = require("bcryptjs");
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ message: "Email already exists" });
  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role,
  });
  const employee = await Employee.create({
    user: user._id,
    employeeId: `SS-${Date.now().toString().slice(-6)}`,
    name,
    email,
    department,
    position,
    phone,
  });
  user.employee = employee._id;
  await user.save();
  res.status(201).json(employee);
});
exports.updateEmployee = asyncWrap(async (req, res) => {
  const e = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!e) return res.status(404).json({ message: "Employee not found" });
  res.json(e);
});
exports.deleteEmployee = asyncWrap(async (req, res) => {
  const e = await Employee.findById(req.params.id);
  if (!e) return res.status(404).json({ message: "Employee not found" });
  await Employee.deleteOne({ _id: e._id });
  if (e.user) await require("../models/User").deleteOne({ _id: e.user });
  res.json({ message: "Employee deleted" });
});
exports.leaveList = asyncWrap(async (req, res) => {
  let filter = {};
  if (req.user.role === "Employee") {
    const e = await employeeFor(req.user);
    filter.employee = e?._id;
  }
  if (req.query.status) filter.status = req.query.status;
  res.json(
    await Leave.find(filter)
      .populate("employee", "name employeeId department")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 }),
  );
});
exports.applyLeave = asyncWrap(async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;
  if (!startDate || !endDate || !reason)
    return res.status(400).json({ message: "Dates and reason are required" });
  if (new Date(endDate) < new Date(startDate))
    return res
      .status(400)
      .json({ message: "End date must be on or after start date" });
  const e = await employeeFor(req.user);
  if (!e)
    return res.status(404).json({ message: "Employee profile not found" });
  const days =
    Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1;
  const leave = await Leave.create({
    employee: e._id,
    type,
    startDate,
    endDate,
    days,
    reason,
  });
  await notifyReviewers(
    req.user,
    `Leave request submitted by ${e.name}`,
    `${e.name} submitted a ${type} leave request.`,
    "/leaves",
  );
  res.status(201).json(leave);
});
async function notifyReviewers(user, title, message, link) {
  const User = require("../models/User");
  const reviewers = await User.find({ role: { $in: ["HR", "Manager"] } });
  await Notification.insertMany(
    reviewers.map((u) => ({
      user: u._id,
      title,
      message,
      link,
      type: "leave",
    })),
  );
}
exports.reviewLeave = asyncWrap(async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!["Approved", "Rejected"].includes(status))
    return res
      .status(400)
      .json({ message: "Status must be Approved or Rejected" });
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status, reviewedBy: req.user._id, reviewNote },
    { new: true },
  ).populate("employee");
  if (!leave)
    return res.status(404).json({ message: "Leave request not found" });
  const User = require("../models/User");
  const u = await User.findOne({ employee: leave.employee._id });
  if (u)
    await Notification.create({
      user: u._id,
      title: `Leave ${status.toLowerCase()}`,
      message: `Your leave request was ${status.toLowerCase()}.`,
      type: "leave",
      link: "/leaves",
    });
  res.json(leave);
});
exports.attendanceList = asyncWrap(async (req, res) => {
  let filter = {};
  if (req.user.role === "Employee") {
    const e = await employeeFor(req.user);
    filter.employee = e?._id;
  }
  if (req.query.employee) filter.employee = req.query.employee;
  if (req.query.from || req.query.to)
    filter.date = {
      ...(req.query.from ? { $gte: new Date(req.query.from) } : {}),
      ...(req.query.to ? { $lte: new Date(req.query.to) } : {}),
    };
  res.json(
    await Attendance.find(filter)
      .populate("employee", "name employeeId department")
      .sort({ date: -1 }),
  );
});
exports.markAttendance = asyncWrap(async (req, res) => {
  const e = await employeeFor(req.user);
  if (!e)
    return res.status(404).json({ message: "Employee profile not found" });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const existing = await Attendance.findOne({
    employee: e._id,
    date: { $gte: start },
  });
  if (existing)
    return res
      .status(409)
      .json({
        message: "Attendance already marked today",
        attendance: existing,
      });
  const now = new Date();
  const record = await Attendance.create({
    employee: e._id,
    date: start,
    checkIn: now,
    status: now.getHours() > 9 ? "Late" : "Present",
  });
  res.status(201).json(record);
});
exports.checkOut = asyncWrap(async (req, res) => {
  const e = await employeeFor(req.user);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const record = await Attendance.findOne({
    employee: e?._id,
    date: { $gte: start },
  });
  if (!record)
    return res
      .status(404)
      .json({ message: "Mark attendance before checking out" });
  if (record.checkOut)
    return res.status(409).json({ message: "Already checked out" });
  record.checkOut = new Date();
  await record.save();
  res.json(record);
});
exports.announcements = asyncWrap(async (req, res) => {
  if (req.method === "GET") {
    const filter = {
      published: true,
      $or: [{ audience: "All" }, { audience: req.user.role }],
    };
    return res.json(
      await Announcement.find(filter)
        .populate("author", "name")
        .sort({ createdAt: -1 }),
    );
  }
  const { title, content, category = "General", audience = "All" } = req.body;
  if (!title || !content)
    return res.status(400).json({ message: "Title and content are required" });
  const a = await Announcement.create({
    title,
    content,
    category,
    audience,
    author: req.user._id,
  });
  const User = require("../models/User");
  const users = await User.find(audience === "All" ? {} : { role: audience });
  await Notification.insertMany(
    users
      .filter((u) => String(u._id) !== String(req.user._id))
      .map((u) => ({
        user: u._id,
        title: "New announcement",
        message: title,
        type: "announcement",
        link: "/announcements",
      })),
  );
  res.status(201).json(a);
});
exports.training = asyncWrap(async (req, res) => {
  if (req.method === "GET")
    return res.json(
      await Training.find().populate("createdBy", "name").sort({ date: 1 }),
    );
  const {
    title,
    date,
    description,
    trainer,
    department,
    durationHours,
    location,
    capacity,
  } = req.body;
  if (!title || !date)
    return res.status(400).json({ message: "Title and date are required" });
  res
    .status(201)
    .json(
      await Training.create({
        title,
        date,
        description,
        trainer,
        department,
        durationHours,
        location,
        capacity,
        createdBy: req.user._id,
      }),
    );
});
exports.enrollTraining = asyncWrap(async (req, res) => {
  const e = await employeeFor(req.user);
  const t = await Training.findById(req.params.id);
  if (!t) return res.status(404).json({ message: "Training not found" });
  if (t.capacity && t.enrolled.length >= t.capacity)
    return res.status(400).json({ message: "Training is full" });
  if (!t.enrolled.some((x) => String(x) === String(e?._id)))
    t.enrolled.push(e._id);
  await t.save();
  res.json(t);
});
exports.notifications = asyncWrap(async (req, res) => {
  if (req.method === "GET")
    return res.json(
      await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(100),
    );
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true },
  );
  if (!n) return res.status(404).json({ message: "Notification not found" });
  res.json(n);
});
exports.seed = asyncWrap(async (req, res) => {
  const User = require("../models/User"),
    bcrypt = require("bcryptjs");
  const demo = [
    ["HR Admin", "hr@staffsync.demo", "HR"],
    ["Team Manager", "manager@staffsync.demo", "Manager"],
    ["Alex Morgan", "employee@staffsync.demo", "Employee"],
  ];
  for (const [n, email, role] of demo) {
    if (!(await User.findOne({ email }))) {
      const u = await User.create({
        name: n,
        email,
        password: await bcrypt.hash("StaffSync123!", 12),
        role,
      });
      const e = await Employee.create({
        user: u._id,
        employeeId: `SS-${Math.random().toString().slice(2, 8)}`,
        name: n,
        email,
        department:
          role === "HR"
            ? "Human Resources"
            : role === "Manager"
              ? "Engineering"
              : "Design",
        position: role,
      });
      u.employee = e._id;
      await u.save();
    }
  }
  if (!(await Announcement.countDocuments()))
    await Announcement.create({
      title: "Welcome to StaffSync",
      content:
        "Welcome to our modern HR workspace. Explore your dashboard and keep your profile up to date.",
      category: "General",
      author: (await User.findOne({ role: "HR" }))._id,
    });
  res.json({ message: "Demo data is ready. Demo passwords: StaffSync123!" });
});
