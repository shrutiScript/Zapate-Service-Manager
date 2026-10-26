import { Repair } from './repair.model.js';
import { SparePart } from '../inventory/inventory.model.js';
import { encryptCredential, decryptCredential } from '../../utils/crypto.js';
import { validatePrice } from '../../utils/validators.js';
import { PosService } from '../pos/pos.service.js';
import { Customer } from '../customers/customer.model.js';
import { WarrantyService } from '../warranties/warranty.service.js';
import { Shop } from '../shops/shop.model.js';
import { Plan } from '../admin/plan.model.js';
import { getDayRange } from '../../utils/date.js';

export class RepairService {
  async getAll(query = {}, shopId = null, role = null) {
    const filter = {};
    if (shopId) {
      filter.shopId = shopId;
    } else if (role !== 'SUPER_ADMIN') {
      filter.shopId = '000000000000000000000000';
    }
    if (query.date) {
      const { startOfDay, endOfDay } = getDayRange(query.date, query.timezoneOffset);
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.customerId) {
      filter.$or = [
        { 'customer.id': query.customerId },
        { customerId: query.customerId },
      ];
    } else if (query.customerMobile) {
      const cleanDigits = String(query.customerMobile).replace(/\D/g, '');
      const searchPattern = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
      filter.$or = [
        { 'customer.mobile': { $regex: searchPattern + '$' } },
        { customerMobile: { $regex: searchPattern + '$' } },
      ];
    }
    if (query.search) {
      filter.$or = [
        { number: { $regex: query.search, $options: 'i' } },
        { 'customer.name': { $regex: query.search, $options: 'i' } },
        { 'customer.mobile': { $regex: query.search, $options: 'i' } },
        { 'device.model': { $regex: query.search, $options: 'i' } },
        { 'device.imei': { $regex: query.search, $options: 'i' } },
      ];
    }
    return Repair.find(filter).sort({ createdAt: -1 });
  }

  async getById(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const job = await Repair.findOne(filter);
    if (!job) throw new Error('Repair job card not found or unauthorized');
    return job;
  }

  async create(data, shopId = null) {
    if (shopId) {
      const shop = await Shop.findById(shopId);
      if (shop) {
        let plan = null;
        if (shop.planId) {
          plan = await Plan.findById(shop.planId);
        }
        if (!plan && shop.subscription) {
          plan = await Plan.findOne({
            $or: [
              { name: shop.subscription },
              { name: shop.subscription.replace(/\s+tier$/i, '') },
              { name: `${shop.subscription} Tier` },
            ],
          });
        }
        const ticketLimit = plan ? (plan.repairTicketLimit ?? -1) : -1;
        if (ticketLimit > 0) {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          const monthlyRepairsCount = await Repair.countDocuments({
            shopId,
            createdAt: { $gte: startOfMonth },
          });
          if (monthlyRepairsCount >= ticketLimit) {
            throw new Error(
              `Monthly repair ticket quota reached: Your workshop's "${plan.name}" plan allows up to ${ticketLimit} repair tickets per month. Please upgrade your subscription plan to continue creating tickets.`
            );
          }
        }
      }
    }

    const totalCount = await Repair.countDocuments({});
    let ticketNum = 2400 + totalCount + 1;
    let number = data.number || `RF-${ticketNum}`;
    while (await Repair.findOne({ number })) {
      ticketNum += 1;
      number = `RF-${ticketNum}`;
    }

    const estCheck = validatePrice(data.estimatedAmount || data.estimatedCost || 0, 'Estimated Amount', true);
    if (!estCheck.isValid) throw new Error(estCheck.error);
    const est = estCheck.value;

    const advCheck = validatePrice(data.advancePayment || 0, 'Advance Payment', true);
    if (!advCheck.isValid) throw new Error(advCheck.error);
    const adv = advCheck.value;

    const pending = Math.max(0, est - adv);

    const initialHistory = [
      {
        status: data.status || 'Device Received',
        changedAt: new Date(),
        notes: 'Job card initialized at front intake desk',
      },
    ];

    // Handle Device Access Information
    const lockType = data.lockType || data.deviceAccess?.lockType || 'No Lock';
    const rawAccess = data.accessAvailable !== undefined ? data.accessAvailable : data.deviceAccess?.accessAvailable;
    const accessAvailable = rawAccess !== undefined
      ? (rawAccess === true || rawAccess === 'Yes' || rawAccess === 'true')
      : true;

    const deviceAccessObj = {
      lockType,
      accessAvailable,
      hasCredential: false,
    };

    const credentialText = data.credential || data.deviceAccess?.credential;
    if (credentialText && String(credentialText).trim()) {
      const encrypted = encryptCredential(String(credentialText).trim());
      deviceAccessObj.encryptedCredential = encrypted.encryptedCredential;
      deviceAccessObj.iv = encrypted.iv;
      deviceAccessObj.authTag = encrypted.authTag;
      deviceAccessObj.hasCredential = true;
    }

    // 1. Resolve Customer Record (support repeat customers without duplicate creation)
    let matchedCustomer = null;
    const custId = data.customerId || data.customer?.id;
    const custMobile = (data.customerMobile || data.customer?.mobile || '').trim();
    const custName = (data.customerName || data.customer?.name || '').trim();
    const custEmail = (data.customerEmail || data.customer?.email || '').trim();
    const custAddress = (data.customerAddress || data.address || '').trim();

    // Search existing Customer CRM record (Mobile as primary unique identifier, Email as secondary)
    if (custId) {
      matchedCustomer = await Customer.findOne({ _id: custId, ...(shopId ? { shopId } : {}) });
    }
    if (!matchedCustomer && custMobile) {
      const cleanDigits = custMobile.replace(/\D/g, '');
      const searchPattern = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
      matchedCustomer = await Customer.findOne({
        mobile: { $regex: searchPattern + '$' },
        ...(shopId ? { shopId } : {}),
      });
    }
    if (!matchedCustomer && custEmail) {
      matchedCustomer = await Customer.findOne({
        email: { $regex: `^${custEmail}$`, $options: 'i' },
        ...(shopId ? { shopId } : {}),
      });
    }

    if (matchedCustomer) {
      // Repeat customer: update their profile without creating a duplicate record
      const updateFields = {
        totalRepairs: (matchedCustomer.totalRepairs || 0) + 1,
        totalSpent: (matchedCustomer.totalSpent || 0) + est,
        estimatedServicePrice: est,
      };
      if (data.brand || data.device?.brand) updateFields.deviceBrand = data.brand || data.device?.brand;
      if (data.model || data.deviceModel || data.device?.model) {
        updateFields.deviceModel = data.deviceModel || data.model || data.device?.model;
      }
      if (custEmail && !matchedCustomer.email) updateFields.email = custEmail;
      if (custAddress && !matchedCustomer.address) updateFields.address = custAddress;

      await Customer.findByIdAndUpdate(matchedCustomer._id, updateFields);
    } else {
      // Brand new Customer: automatically create new Customer CRM profile so it appears immediately in Customer CRM
      const finalMobile = custMobile || `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      try {
        matchedCustomer = await Customer.create({
          name: custName || 'Walk-in Client',
          mobile: finalMobile,
          email: custEmail || '',
          address: custAddress || '',
          deviceBrand: data.brand || data.device?.brand || '',
          deviceModel: data.deviceModel || data.model || data.device?.model || '',
          estimatedServicePrice: est,
          totalRepairs: 1,
          totalSpent: est,
          shopId,
        });
      } catch (err) {
        if (custMobile) {
          const cleanDigits = custMobile.replace(/\D/g, '');
          const searchPattern = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
          matchedCustomer = await Customer.findOne({
            mobile: { $regex: searchPattern + '$' },
            ...(shopId ? { shopId } : {}),
          });
        }
      }
    }

    const resolvedCustomerId = matchedCustomer ? matchedCustomer._id : (custId || undefined);

    const createdJob = await Repair.create({
      number: data.number || number,
      customerId: resolvedCustomerId,
      customer: {
        name: custName || matchedCustomer?.name || 'Walk-in Client',
        mobile: custMobile || matchedCustomer?.mobile || '',
        email: custEmail || matchedCustomer?.email || '',
        id: resolvedCustomerId,
      },
      device: {
        brand: data.brand || data.device?.brand || '',
        model: data.deviceModel || data.model || data.device?.model || 'Generic Device',
        imei: data.imei || data.device?.imei || '',
        color: data.color || data.device?.color || '',
        conditionNotes: data.conditionNotes || data.device?.conditionNotes || '',
      },
      issue: data.issue || data.problem || 'Diagnostic inspection required',
      status: data.status || 'Device Received',
      estimatedAmount: est,
      finalAmount: Number(data.finalAmount || est),
      advancePayment: adv,
      pendingAmount: pending,
      notes: data.notes || data.repairNotes,
      history: initialHistory,
      deviceAccess: deviceAccessObj,
      shopId,
    });

    return createdJob;
  }

  async updateStatus(id, data, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const job = await Repair.findOne(filter);
    if (!job) throw new Error('Repair job card not found or unauthorized');

    if (data.status) job.status = data.status;
    if (data.notes) job.diagnosisNotes = data.notes;
    if (data.finalAmount !== undefined) {
      const finalCheck = validatePrice(data.finalAmount, 'Final Amount', true);
      if (!finalCheck.isValid) throw new Error(finalCheck.error);
      job.finalAmount = finalCheck.value;
      job.pendingAmount = Math.max(0, job.finalAmount - (job.advancePayment || 0));
    }

    if (!job.history) job.history = [];
    job.history.push({
      status: job.status,
      changedAt: new Date(),
      notes: data.notes || `Status updated to ${job.status}`,
    });

    // Check deviceAccess updates or explicit delete
    if (!job.deviceAccess) {
      job.deviceAccess = { lockType: 'No Lock', accessAvailable: true, hasCredential: false };
    }

    const lockTypeInput = data.lockType || data.deviceAccess?.lockType;
    if (lockTypeInput) job.deviceAccess.lockType = lockTypeInput;

    const accessInput = data.accessAvailable !== undefined ? data.accessAvailable : data.deviceAccess?.accessAvailable;
    if (accessInput !== undefined) {
      job.deviceAccess.accessAvailable = (accessInput === true || accessInput === 'Yes' || accessInput === 'true');
    }

    const newCredential = data.credential || data.deviceAccess?.credential;
    if (newCredential && String(newCredential).trim()) {
      const encrypted = encryptCredential(String(newCredential).trim());
      job.deviceAccess.encryptedCredential = encrypted.encryptedCredential;
      job.deviceAccess.iv = encrypted.iv;
      job.deviceAccess.authTag = encrypted.authTag;
      job.deviceAccess.hasCredential = true;
    }

    // Auto-remove credential when job is completed, delivered, cancelled, returned, or when deleteAccessInfo flag is sent
    const terminalStatuses = ['Delivered', 'Completed', 'Cancelled', 'Returned Unrepaired'];
    const isTerminal = terminalStatuses.includes(job.status) ||
      job.status.toLowerCase().includes('delivered') ||
      job.status.toLowerCase().includes('complete') ||
      job.status.toLowerCase().includes('cancel');

    if (data.deleteAccessInfo || data.deviceAccess?.deleteAccessInfo || isTerminal) {
      job.deviceAccess.encryptedCredential = undefined;
      job.deviceAccess.iv = undefined;
      job.deviceAccess.authTag = undefined;
      job.deviceAccess.hasCredential = false;
    }

    await job.save();

    // Auto-create Warranty when status is Completed or Delivered
    if (job.status === 'Completed' || job.status === 'Delivered' || job.status === 'Ready for Pickup') {
      try {
        const warrantyService = new WarrantyService();
        await warrantyService.createFromRepair(job._id, {}, shopId);
      } catch (e) {
        console.error('Auto warranty creation error:', e.message);
      }
    }

    // Auto-sync customer profile quote prices if amounts were updated
    const custMobile = job.customer?.mobile;
    const custId = job.customer?.id;
    if ((data.finalAmount !== undefined || data.estimatedAmount !== undefined) && (custId || custMobile)) {
      const custFilter = { shopId };
      if (custId) custFilter._id = custId;
      else custFilter.mobile = custMobile;

      const updates = {};
      if (data.finalAmount !== undefined) updates.finalServicePrice = Number(data.finalAmount);
      if (data.estimatedAmount !== undefined) updates.estimatedServicePrice = Number(data.estimatedAmount);

      await Customer.findOneAndUpdate(custFilter, updates);
    }

    return job;
  }

  async revealCredential(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    
    // Select encrypted credential fields specifically for authorization check & decryption
    const job = await Repair.findOne(filter).select('+deviceAccess.encryptedCredential +deviceAccess.iv +deviceAccess.authTag');
    if (!job) throw new Error('Repair job card not found or unauthorized');

    if (!job.deviceAccess?.encryptedCredential || !job.deviceAccess?.iv || !job.deviceAccess?.authTag) {
      return {
        lockType: job.deviceAccess?.lockType || 'No Lock',
        accessAvailable: job.deviceAccess?.accessAvailable ?? true,
        hasCredential: false,
        credential: null,
        message: 'No stored credential available for this job card.',
      };
    }

    const plainText = decryptCredential(
      job.deviceAccess.encryptedCredential,
      job.deviceAccess.iv,
      job.deviceAccess.authTag
    );

    return {
      lockType: job.deviceAccess.lockType,
      accessAvailable: job.deviceAccess.accessAvailable,
      hasCredential: true,
      credential: plainText,
    };
  }

  async deleteCredential(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;

    const job = await Repair.findOne(filter);
    if (!job) throw new Error('Repair job card not found or unauthorized');

    if (job.deviceAccess) {
      job.deviceAccess.encryptedCredential = undefined;
      job.deviceAccess.iv = undefined;
      job.deviceAccess.authTag = undefined;
      job.deviceAccess.hasCredential = false;
      await job.save();
    }

    return job;
  }

  async allocatePart(id, data, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const job = await Repair.findOne(filter);
    if (!job) throw new Error('Repair job card not found or unauthorized');

    const qty = Number(data.quantity || 1);
    const unitPrice = Number(data.unitPrice || 0);
    const totalPrice = qty * unitPrice;

    if (data.partId) {
      const part = await SparePart.findOne({ _id: data.partId, ...(shopId ? { shopId } : {}) });
      if (part) {
        if (part.quantity < qty) {
          throw new Error(`Insufficient stock. Available: ${part.quantity}`);
        }
        part.quantity -= qty;
        part.status = part.quantity === 0 ? 'Out of Stock' : (part.quantity <= (part.minimumQuantity || 3) ? 'Low Stock' : 'In Stock');
        await part.save();
      }
    }

    if (!job.parts) job.parts = [];
    job.parts.push({
      partId: data.partId,
      name: data.name || 'Component Part',
      quantity: qty,
      unitPrice,
      totalPrice,
    });

    job.finalAmount = (job.finalAmount || job.estimatedAmount || 0) + totalPrice;
    job.pendingAmount = Math.max(0, job.finalAmount - (job.advancePayment || 0));

    await job.save();
    return job;
  }

  async generateInvoice(id, data, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const job = await Repair.findOne(filter);
    if (!job) throw new Error('Repair job card not found or unauthorized');

    const serviceChargeCheck = validatePrice(data.serviceCharge || 0, 'Service Charge', true);
    if (!serviceChargeCheck.isValid) throw new Error(serviceChargeCheck.error);
    const serviceCharge = serviceChargeCheck.value;

    const discountCheck = validatePrice(data.discountAmount || data.discount || 0, 'Discount Amount', true);
    if (!discountCheck.isValid) throw new Error(discountCheck.error);
    const discountAmount = discountCheck.value;

    const taxPercentCheck = validatePrice(data.taxPercent || data.taxRate || 0, 'Tax Percent', true);
    if (!taxPercentCheck.isValid) throw new Error(taxPercentCheck.error);
    const taxPercent = taxPercentCheck.value;

    const paidCheck = validatePrice(data.paidAmount, 'Paid Amount', true);
    if (!paidCheck.isValid) throw new Error(paidCheck.error);
    const paidAmount = paidCheck.value;

    // Build itemized invoice lines from parts + service charge + additional charges
    const items = [];

    // 1. Repair Service Fee line
    items.push({
      name: `Repair Service & Diagnostics - ${job.device?.model || 'Mobile Device'}`,
      brand: job.device?.brand || '',
      model: job.device?.model || '',
      problem: job.issue || '',
      price: serviceCharge,
      quantity: 1,
      total: serviceCharge,
    });

    // 2. Parts Used
    if (Array.isArray(job.parts) && job.parts.length > 0) {
      for (const p of job.parts) {
        items.push({
          partId: p.partId || undefined,
          name: p.name || 'Replacement Component',
          brand: job.device?.brand || '',
          model: job.device?.model || '',
          problem: job.issue || '',
          price: p.unitPrice || 0,
          quantity: p.quantity || 1,
          total: (p.unitPrice || 0) * (p.quantity || 1),
        });
      }
    }

    // 3. Additional Charges
    let additionalChargeNum = 0;
    if (typeof data.additionalCharges === 'number' || (typeof data.additionalCharges === 'string' && !isNaN(Number(data.additionalCharges)))) {
      additionalChargeNum = Number(data.additionalCharges) || 0;
      if (additionalChargeNum > 0) {
        items.push({
          name: 'Additional Service / Component Fee',
          brand: job.device?.brand || '',
          model: job.device?.model || '',
          problem: job.issue || '',
          price: additionalChargeNum,
          quantity: 1,
          total: additionalChargeNum,
        });
      }
    } else if (Array.isArray(data.additionalCharges)) {
      for (const add of data.additionalCharges) {
        if (add.name && Number(add.amount) > 0) {
          const amt = Number(add.amount);
          additionalChargeNum += amt;
          items.push({
            name: add.name.trim(),
            brand: job.device?.brand || '',
            model: job.device?.model || '',
            problem: job.issue || '',
            price: amt,
            quantity: 1,
            total: amt,
          });
        }
      }
    }

    const posService = new PosService();
    const invoicePayload = {
      invoiceType: 'REPAIR',
      repairJobId: job._id,
      customer: job.customer?.id || undefined,
      customerName: job.customer?.name || 'Walk-in Client',
      customerMobile: job.customer?.mobile || '',
      customerEmail: job.customer?.email || '',
      customerAddress: job.customer?.address || '',
      deviceBrand: job.device?.brand || '',
      deviceModel: job.device?.model || '',
      deviceImei: job.device?.imei || '',
      reportedProblem: job.issue || '',
      serviceCharge,
      additionalCharges: Array.isArray(data.additionalCharges) ? data.additionalCharges : (additionalChargeNum > 0 ? [{ name: 'Additional Service / Component Fee', amount: additionalChargeNum }] : []),
      items,
      taxRate: taxPercent,
      discountAmount,
      paidAmount,
      paymentMethod: data.paymentMethod || 'UPI',
      notes: data.notes || `Repair invoice for ticket ${job.number}`,
    };

    const invoice = await posService.createInvoice(invoicePayload, shopId);

    // Update Repair Job status and financial record
    job.finalAmount = invoice.total;
    job.advancePayment = (job.advancePayment || 0) + paidAmount;
    job.pendingAmount = invoice.dueAmount;
    if (data.newStatus) {
      job.status = data.newStatus;
    } else if (invoice.dueAmount === 0) {
      job.status = 'Completed';
    } else {
      job.status = 'Ready for Delivery';
    }

    if (!job.history) job.history = [];
    job.history.push({
      status: job.status,
      changedAt: new Date(),
      notes: `Repair invoice ${invoice.number} generated (${invoice.status}). Paid: ₹${paidAmount}, Due: ₹${invoice.dueAmount}`,
    });

    await job.save();

    return {
      invoice,
      repairJob: job,
    };
  }

  async delete(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const job = await Repair.findOneAndDelete(filter);
    if (!job) throw new Error('Repair job card not found or unauthorized');
    return true;
  }
}
