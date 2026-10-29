import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/repairflow_db');
  const w = await mongoose.connection.db.collection('warranties').find().toArray();
  console.log('Warranties:', JSON.stringify(w, null, 2));

  const j = await mongoose.connection.db.collection('jobcards').find().toArray();
  console.log('Jobcards count:', j.length);
  for (const job of j) {
    console.log(`Job: ${job.number || job.repairNumber}, id: ${job._id}, finalAmount: ${job.finalAmount}, advancePayment: ${job.advancePayment}, est: ${job.estimatedAmount}`);
  }

  const inv = await mongoose.connection.db.collection('invoices').find().toArray();
  console.log('Invoices count:', inv.length);
  for (const i of inv) {
    console.log(`Invoice: ${i.number}, repairJobId: ${i.repairJobId}, total: ${i.total}, paid: ${i.paidAmount}, due: ${i.dueAmount}`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
