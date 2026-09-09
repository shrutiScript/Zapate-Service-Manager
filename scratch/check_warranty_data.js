const path = require('path');
const mongoose = require(path.join(__dirname, '../server/node_modules/mongoose'));

async function checkData() {
  await mongoose.connect('mongodb://127.0.0.1:27017/repairflow_db');
  const Warranty = mongoose.model('Warranty', new mongoose.Schema({}, { strict: false }));
  const JobCard = mongoose.model('JobCard', new mongoose.Schema({}, { strict: false }));
  const PosInvoice = mongoose.model('PosInvoice', new mongoose.Schema({}, { strict: false }));

  const warranties = await Warranty.find({}).sort({ createdAt: -1 }).limit(5);
  console.log('--- WARRANTIES ---');
  for (const w of warranties) {
    console.log({
      _id: w._id,
      repairNumber: w.repairNumber,
      repairJobId: w.repairJobId,
      customerName: w.customerName,
      deviceBrand: w.deviceBrand,
      deviceModel: w.deviceModel,
      totalAmount: w.totalAmount,
      paidAmount: w.paidAmount,
      dueAmount: w.dueAmount,
      paymentStatus: w.paymentStatus,
    });
  }

  const jobs = await JobCard.find({}).sort({ createdAt: -1 }).limit(5);
  console.log('--- RECENT JOBS ---');
  for (const j of jobs) {
    console.log({
      _id: j._id,
      number: j.number,
      customerName: j.customerName,
      device: j.device,
      deviceModel: j.deviceModel,
      finalAmount: j.finalAmount,
      estimatedAmount: j.estimatedAmount,
      advancePayment: j.advancePayment,
      pendingAmount: j.pendingAmount,
    });
  }

  const invoices = await PosInvoice.find({}).sort({ createdAt: -1 }).limit(5);
  console.log('--- RECENT INVOICES ---');
  for (const inv of invoices) {
    console.log({
      _id: inv._id,
      number: inv.number,
      repairJobId: inv.repairJobId,
      customerName: inv.customerName,
      total: inv.total,
      paidAmount: inv.paidAmount,
      dueAmount: inv.dueAmount,
      status: inv.status,
    });
  }

  await mongoose.disconnect();
}

checkData();
