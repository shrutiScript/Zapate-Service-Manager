import { Customer } from './customer.model.js';
import { JobCard } from '../repairs/repair.model.js';
import { validatePrice } from '../../utils/validators.js';

export class CustomerService {
  async syncCustomersFromRepairs(shopId = null) {
    try {
      const jobFilter = shopId ? { shopId } : {};
      const jobs = await JobCard.find(jobFilter);
      for (const job of jobs) {
        let custId = job.customer?.id || job.customerId;
        let customerExists = false;
        if (custId) {
          customerExists = await Customer.exists({ _id: custId, ...(shopId ? { shopId } : {}) });
        }

        if (!customerExists) {
          const rawMobile = (job.customerMobile || (typeof job.customer === 'object' ? job.customer?.mobile : null) || '').trim();
          const rawEmail = (job.customerEmail || (typeof job.customer === 'object' ? job.customer?.email : null) || '').trim();
          const rawName = (job.customerName || (typeof job.customer === 'object' ? job.customer?.name : null) || 'Walk-in Client').trim();
          const cleanDigits = rawMobile.replace(/\D/g, '');

          let matched = null;
          if (cleanDigits.length >= 10) {
            matched = await Customer.findOne({
              mobile: { $regex: cleanDigits.slice(-10) + '$' },
              ...(shopId ? { shopId } : {}),
            });
          } else if (rawMobile) {
            matched = await Customer.findOne({
              mobile: rawMobile,
              ...(shopId ? { shopId } : {}),
            });
          }

          if (!matched && rawEmail) {
            matched = await Customer.findOne({
              email: { $regex: `^${rawEmail}$`, $options: 'i' },
              ...(shopId ? { shopId } : {}),
            });
          }

          if (!matched) {
            const fallbackMobile = rawMobile || `98${Math.floor(10000000 + Math.random() * 90000000)}`;
            const est = Number(job.estimatedAmount || job.estimatedCost || 0);
            const finalP = Number(job.finalAmount || job.totalAmount || est);
            matched = await Customer.create({
              name: rawName,
              mobile: fallbackMobile,
              email: rawEmail || '',
              deviceBrand: job.device?.brand || '',
              deviceModel: job.device?.model || '',
              estimatedServicePrice: est,
              finalServicePrice: finalP,
              totalSpent: finalP,
              totalRepairs: 1,
              shopId: job.shopId || shopId,
            });
          }

          // Link customer ID to the repair job
          await JobCard.findByIdAndUpdate(job._id, {
            'customer.id': matched._id,
            customerId: matched._id,
          });
        }
      }
    } catch (err) {
      console.error('Error syncing customers from repairs:', err);
    }
  }

  async getAll(search, shopId = null) {
    // Automatically guarantee every customer in any repair job exists in Customer CRM
    await this.syncCustomersFromRepairs(shopId);

    const filter = {};
    if (shopId) filter.shopId = shopId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    // Aggregate job stats for each customer to compute true totalSpent, totalRepairs, latestRepairDate, and pendingDue
    const jobStatsFilter = shopId ? { shopId } : {};
    const jobs = await JobCard.find(jobStatsFilter).select(
      'number customer customerId customerMobile customerEmail finalAmount totalAmount estimatedAmount estimatedCost advancePayment pendingAmount status createdAt'
    );

    const customerMap = {};
    for (const job of jobs) {
      const custId = job.customer?.id || job.customerId;
      const custMobile = job.customerMobile || (typeof job.customer === 'object' ? job.customer?.mobile : null);
      const cleanMobile = custMobile ? String(custMobile).replace(/\D/g, '').slice(-10) : null;
      const key = custId ? String(custId) : (cleanMobile || custMobile);
      if (!key) continue;

      if (!customerMap[key]) {
        customerMap[key] = {
          count: 0,
          sum: 0,
          pendingDue: 0,
          latestRepairDate: null,
          latestJobNumber: null,
        };
      }
      customerMap[key].count += 1;
      const jobPrice = Number(job.finalAmount || job.totalAmount || job.estimatedAmount || job.estimatedCost || 0);
      const adv = Number(job.advancePayment || 0);
      const pending = job.pendingAmount !== undefined ? Number(job.pendingAmount) : Math.max(0, jobPrice - adv);
      const isDelivered = String(job.status || '').toLowerCase().includes('delivered');

      customerMap[key].sum += jobPrice;
      if (!isDelivered && pending > 0) {
        customerMap[key].pendingDue += pending;
      }

      const jobDate = job.createdAt ? new Date(job.createdAt) : new Date();
      if (!customerMap[key].latestRepairDate || jobDate > new Date(customerMap[key].latestRepairDate)) {
        customerMap[key].latestRepairDate = jobDate;
        customerMap[key].latestJobNumber = job.number;
      }
    }

    return customers.map((c) => {
      const doc = c.toObject();
      const cleanMobile = (c.mobile || '').replace(/\D/g, '').slice(-10);
      const stats = customerMap[String(c._id)] || (cleanMobile ? customerMap[cleanMobile] : null) || customerMap[c.mobile] || {
        count: 0,
        sum: 0,
        pendingDue: 0,
        latestRepairDate: null,
        latestJobNumber: null,
      };

      doc.totalRepairs = Math.max(doc.totalRepairs || 0, stats.count);
      doc.totalSpent = doc.totalSpent > 0 ? doc.totalSpent : (stats.sum > 0 ? stats.sum : (doc.finalServicePrice || doc.estimatedServicePrice || 0));
      doc.pendingDue = stats.pendingDue > 0 ? stats.pendingDue : (doc.pendingDue || 0);
      doc.latestRepairDate = stats.latestRepairDate || doc.updatedAt || doc.createdAt;
      doc.latestJobNumber = stats.latestJobNumber || null;
      doc.customerStatus = doc.totalRepairs > 1 ? 'Repeat Customer' : (doc.totalRepairs === 1 ? 'Active Client' : 'New Customer');
      return doc;
    });
  }

  async getById(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const customer = await Customer.findOne(filter);
    if (!customer) throw new Error('Customer not found or unauthorized');
    return customer;
  }

  async create(data, shopId = null) {
    const est = validatePrice(data.estimatedServicePrice, 'Estimated Service Price', true);
    if (!est.isValid) throw new Error(est.error);

    const finalP = validatePrice(data.finalServicePrice, 'Final Service Price', true);
    if (!finalP.isValid) throw new Error(finalP.error);

    const totalSpentVal = data.totalSpent > 0 ? data.totalSpent : (finalP.value > 0 ? finalP.value : (est.value > 0 ? est.value : 0));

    return Customer.create({
      ...data,
      estimatedServicePrice: est.value,
      finalServicePrice: finalP.value,
      totalSpent: totalSpentVal,
      shopId,
    });
  }

  async update(id, data, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;

    const payload = { ...data };
    if (payload.estimatedServicePrice !== undefined) {
      const est = validatePrice(payload.estimatedServicePrice, 'Estimated Service Price', true);
      if (!est.isValid) throw new Error(est.error);
      payload.estimatedServicePrice = est.value;
    }
    if (payload.finalServicePrice !== undefined) {
      const finalP = validatePrice(payload.finalServicePrice, 'Final Service Price', true);
      if (!finalP.isValid) throw new Error(finalP.error);
      payload.finalServicePrice = finalP.value;
      if (!payload.totalSpent || payload.totalSpent === 0) {
        payload.totalSpent = finalP.value;
      }
    }

    const customer = await Customer.findOneAndUpdate(filter, payload, { returnDocument: 'after', new: true });
    if (!customer) throw new Error('Customer not found or unauthorized access');

    // Also sync latest Repair Job if price was updated
    if (payload.estimatedServicePrice !== undefined || payload.finalServicePrice !== undefined) {
      const latestJob = await JobCard.findOne({
        $or: [{ 'customer.id': customer._id }, { 'customer.mobile': customer.mobile }],
        ...(shopId ? { shopId } : {}),
      }).sort({ createdAt: -1 });

      if (latestJob) {
        const jobUpdates = {};
        if (payload.estimatedServicePrice !== undefined) jobUpdates.estimatedAmount = payload.estimatedServicePrice;
        if (payload.finalServicePrice !== undefined) jobUpdates.finalAmount = payload.finalServicePrice;
        await JobCard.findByIdAndUpdate(latestJob._id, jobUpdates);
      }
    }

    return customer;
  }

  async delete(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const customer = await Customer.findOneAndDelete(filter);
    if (!customer) throw new Error('Customer not found or unauthorized access');
    return true;
  }
}
