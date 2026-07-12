const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  profession: { type: String, default: '' },
  phone: { type: String, default: '' },
  baseSalary: { type: Number, default: 0 },
  hireDate: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
