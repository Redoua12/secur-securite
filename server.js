require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('خطأ: متغير البيئة MONGODB_URI غير موجود. أضفه في إعدادات الاستضافة.');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✓ تم الاتصال بقاعدة البيانات MongoDB'))
  .catch(err => console.error('✗ فشل الاتصال بقاعدة البيانات:', err.message));

/* ============ الموظفون ============ */
app.get('/api/employees', async (req, res) => {
  try {
    const list = await Employee.find().sort({ createdAt: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, profession, phone, baseSalary, hireDate } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'الاسم مطلوب' });
    const emp = await Employee.create({ name, profession, phone, baseSalary: Number(baseSalary) || 0, hireDate });
    res.json(emp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { name, profession, phone, baseSalary, hireDate } = req.body;
    const emp = await Employee.findByIdAndUpdate(
      req.params.id,
      { name, profession, phone, baseSalary: Number(baseSalary) || 0, hireDate },
      { new: true }
    );
    if (!emp) return res.status(404).json({ error: 'الموظف غير موجود' });
    res.json(emp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    await Attendance.deleteMany({ employeeId: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============ الحضور والغياب ============ */
app.get('/api/attendance', async (req, res) => {
  try {
    const list = await Attendance.find();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { employeeId, date, status } = req.body;
    if (!employeeId || !date) return res.status(400).json({ error: 'بيانات ناقصة' });

    if (!status) {
      await Attendance.findOneAndDelete({ employeeId, date });
      return res.json({ ok: true, deleted: true });
    }

    const rec = await Attendance.findOneAndUpdate(
      { employeeId, date },
      { employeeId, date, status },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(rec);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============ فحص صحة السيرفر ============ */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, dbConnected: mongoose.connection.readyState === 1 });
});

/* ============ تقديم الواجهة الأمامية ============ */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('السيرفر يعمل على المنفذ ' + PORT));
