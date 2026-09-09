import mongoose from 'mongoose';
import { Warranty } from './warranty.model.js';
import { JobCard } from '../repairs/repair.model.js';
import { Invoice } from '../pos/pos.model.js';

export class WarrantyService {
  // Helper to dynamically calculate current status based on dates
  calculateStatus(warranty) {
    if (warranty.status === 'VOID') return 'VOID';

    const now = new Date();
    const expiry = new Date(warranty.expiryDate);
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 7) return 'EXPIRING_SOON';
    return 'ACTIVE';
  }

  // Helper to clean model text so no function/object stringification leaks into UI
  cleanText(val) {
    if (!val) return '';
    if (typeof val === 'function') return '';
    if (typeof val === 'object') {
      if (val.model && typeof val.model === 'string') return val.model;
      if (val.name && typeof val.name === 'string') return val.name;
      return '';
    }
    const str = String(val).trim();
    if (str.startsWith('function') || str.includes('=>') || str.includes('{') || str.includes('modelDbSymbol')) return '';
    return str;
  }

  // Dynamically attach payment & financial fields to warranty document
  async enrichWarrantyFinancials(warrantyDoc, shopId = null) {
    let totalAmt = Number(warrantyDoc.totalAmount || 0);
    let paidAmt = Number(warrantyDoc.paidAmount || 0);
    let dueAmt = Number(warrantyDoc.dueAmount || 0);
    let invNum = (warrantyDoc.invoiceNumber && warrantyDoc.invoiceNumber !== 'N/A') ? warrantyDoc.invoiceNumber : '';
    let brand = this.cleanText(warrantyDoc.deviceBrand);
    let model = this.cleanText(warrantyDoc.deviceModel);
    let imei = warrantyDoc.imei || '';
    let custName = warrantyDoc.customerName || '';
    let custMobile = warrantyDoc.customerMobile || '';

    try {
      // 1. Check matching invoice first
      let invoice = null;
      if (warrantyDoc.repairJobId) {
        invoice = await Invoice.findOne({
          repairJobId: warrantyDoc.repairJobId,
          ...(shopId ? { shopId } : {})
        }).sort({ createdAt: -1 });
      }

      if (!invoice && (warrantyDoc.invoiceNumber || warrantyDoc.repairNumber)) {
        const queryOr = [];
        if (warrantyDoc.invoiceNumber && warrantyDoc.invoiceNumber !== 'N/A') {
          queryOr.push({ number: warrantyDoc.invoiceNumber });
        }
        if (warrantyDoc.repairNumber) {
          queryOr.push({ number: warrantyDoc.repairNumber });
        }
        if (queryOr.length > 0) {
          invoice = await Invoice.findOne({
            $or: queryOr,
            ...(shopId ? { shopId } : {})
          }).sort({ createdAt: -1 });
        }
      }

      // 2. Also check JobCard
      let job = null;
      if (warrantyDoc.repairJobId) {
        job = await JobCard.findById(warrantyDoc.repairJobId);
      } else if (warrantyDoc.repairNumber) {
        job = await JobCard.findOne({
          $or: [{ number: warrantyDoc.repairNumber }, { repairNumber: warrantyDoc.repairNumber }],
          ...(shopId ? { shopId } : {})
        });
      }

      if (invoice) {
        invNum = invoice.number || invNum;
        totalAmt = Number(invoice.total !== undefined ? invoice.total : totalAmt);
        paidAmt = Number(invoice.paidAmount !== undefined ? invoice.paidAmount : paidAmt);
        dueAmt = Math.max(0, Number(invoice.dueAmount !== undefined ? invoice.dueAmount : (totalAmt - paidAmt)));
        if (!brand && invoice.deviceBrand) brand = this.cleanText(invoice.deviceBrand);
        if (!model && invoice.deviceModel) model = this.cleanText(invoice.deviceModel);
        if (!imei && invoice.imei) imei = invoice.imei;
        if (!custName && invoice.customerName) custName = invoice.customerName;
        if (!custMobile && invoice.customerMobile) custMobile = invoice.customerMobile;
      }

      if (job) {
        if (!totalAmt) totalAmt = Number(job.finalAmount || job.estimatedAmount || 0);
        if (!paidAmt) paidAmt = Number(job.advancePayment || 0);
        if (dueAmt === 0 && (totalAmt - paidAmt) > 0) dueAmt = Math.max(0, totalAmt - paidAmt);
        if (!brand) brand = this.cleanText(job.device?.brand || job.brand);
        if (!model) model = this.cleanText(job.device?.model || job.deviceModel);
        if (!imei) imei = job.device?.imei || job.imei || '';
        if (!custName) custName = job.customer?.name || job.customerName || custName;
        if (!custMobile) custMobile = job.customer?.mobile || job.customerMobile || custMobile;
      }
    } catch (e) {
      console.error('[WarrantyService] Enrich financial error:', e);
    }

    let paymentStatus = 'PENDING';
    if (dueAmt <= 0 && (totalAmt > 0 || paidAmt > 0)) {
      paymentStatus = 'PAID';
    } else if (paidAmt > 0) {
      paymentStatus = 'PARTIAL';
    }

    const warrantyEligible = (dueAmt <= 0 && (totalAmt > 0 || paidAmt > 0));

    // If existing document in database had bad deviceModel or missing financial fields, heal it
    if (warrantyDoc._id && (
      warrantyDoc.deviceModel !== model ||
      warrantyDoc.totalAmount !== totalAmt ||
      warrantyDoc.paidAmount !== paidAmt ||
      warrantyDoc.dueAmount !== dueAmt
    )) {
      try {
        await Warranty.findByIdAndUpdate(warrantyDoc._id, {
          customerName: custName,
          customerMobile: custMobile,
          deviceBrand: brand,
          deviceModel: model,
          imei,
          totalAmount: totalAmt,
          paidAmount: paidAmt,
          dueAmount: dueAmt,
          paymentStatus,
          warrantyEligible,
        });
      } catch (err) {
        // silent catch
      }
    }

    return {
      ...warrantyDoc,
      customerName: custName || 'Client',
      customerMobile: custMobile || '',
      deviceBrand: brand,
      deviceModel: model,
      imei,
      invoiceNumber: invNum || 'N/A',
      totalAmount: totalAmt,
      paidAmount: paidAmt,
      dueAmount: dueAmt,
      paymentStatus,
      warrantyEligible,
    };
  }

  async getAll(search, statusFilter = null, shopId = null) {
    const filter = {};
    if (shopId) filter.shopId = shopId;
    if (search) {
      filter.$or = [
        { repairNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } },
        { deviceModel: { $regex: search, $options: 'i' } },
        { imei: { $regex: search, $options: 'i' } },
      ];
    }

    const warranties = await Warranty.find(filter).sort({ createdAt: -1 });

    // Update statuses dynamically and enrich with financial data
    const updatedList = [];
    for (const w of warranties) {
      const doc = w.toObject();
      const currentStatus = this.calculateStatus(doc);

      if (currentStatus !== doc.status && doc.status !== 'VOID') {
        doc.status = currentStatus;
        await Warranty.findByIdAndUpdate(w._id, { status: currentStatus });
      }

      const enriched = await this.enrichWarrantyFinancials(doc, shopId);

      if (!statusFilter || statusFilter === 'ALL' || enriched.status === statusFilter) {
        updatedList.push(enriched);
      }
    }

    return updatedList;
  }

  async getById(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const w = await Warranty.findOne(filter);
    if (!w) throw new Error('Warranty record not found or unauthorized');

    const doc = w.toObject();
    doc.status = this.calculateStatus(doc);
    return await this.enrichWarrantyFinancials(doc, shopId);
  }

  async createFromRepair(repairJobId, options = {}, shopId = null) {
    const jobFilter = { _id: repairJobId };
    if (shopId) jobFilter.shopId = shopId;

    const job = await JobCard.findOne(jobFilter);
    if (!job) throw new Error('Repair job card not found');

    // Strict Backend Financial & Payment Validation
    let invoice = null;
    try {
      invoice = await Invoice.findOne({ repairJobId: job._id, ...(shopId ? { shopId } : {}) }).sort({ createdAt: -1 });
    } catch (e) {}

    let totalAmt = Number(job.finalAmount || job.estimatedAmount || 0);
    let paidAmt = Number(job.advancePayment || 0);
    let remainingDue = Math.max(0, totalAmt - paidAmt);

    if (invoice) {
      totalAmt = Number(invoice.total !== undefined ? invoice.total : totalAmt);
      paidAmt = Number(invoice.paidAmount !== undefined ? invoice.paidAmount : paidAmt);
      remainingDue = Math.max(0, Number(invoice.dueAmount !== undefined ? invoice.dueAmount : (totalAmt - paidAmt)));
    }

    if (remainingDue > 0) {
      throw new Error('Warranty certificate cannot be generated because full payment is pending.');
    }

    const serviceDays = Number(options.serviceWarrantyDays) >= 0 ? Number(options.serviceWarrantyDays) : 30;
    const partsDays = Number(options.partsWarrantyDays) >= 0 ? Number(options.partsWarrantyDays) : 30;
    const maxDays = Math.max(serviceDays, partsDays);

    const startDate = options.startDate ? new Date(options.startDate) : new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + maxDays);

    const custName = (typeof job.customer === 'object' ? job.customer?.name : '') || job.customerName || 'Client';
    const custMobile = (typeof job.customer === 'object' ? job.customer?.mobile : '') || job.customerMobile || '';
    const brand = this.cleanText((typeof job.device === 'object' ? job.device?.brand : '') || job.brand);
    const model = this.cleanText((typeof job.device === 'object' ? job.device?.model : '') || job.deviceModel);

    // Check if warranty already exists for this repair job
    let existing = await Warranty.findOne({ repairJobId, shopId });
    if (existing) {
      existing.serviceWarrantyDays = serviceDays;
      existing.partsWarrantyDays = partsDays;
      existing.startDate = startDate;
      existing.expiryDate = expiryDate;
      existing.status = this.calculateStatus({ status: 'ACTIVE', expiryDate });
      existing.terms = options.terms || job.termsAndConditions || 'Standard Workshop Repair Warranty';
      existing.partsUsed = job.partsUsed || [];
      existing.repairDetails = job.problemDescription || job.issue || '';
      existing.totalAmount = totalAmt;
      existing.paidAmount = paidAmt;
      existing.dueAmount = remainingDue;
      existing.paymentStatus = 'PAID';
      existing.warrantyEligible = true;
      await existing.save();
      return await this.enrichWarrantyFinancials(existing.toObject(), shopId);
    }

    const warranty = await Warranty.create({
      repairJobId: job._id,
      repairNumber: job.number || job.jobNo || `RF-${Date.now().toString().slice(-4)}`,
      customerId: job.customerId || job.customer?.id || null,
      customerName: custName,
      customerMobile: custMobile,
      deviceBrand: brand,
      deviceModel: model,
      imei: job.imei || (typeof job.device === 'object' ? job.device?.imei : '') || '',
      serviceWarrantyDays: serviceDays,
      partsWarrantyDays: partsDays,
      startDate,
      expiryDate,
      status: this.calculateStatus({ status: 'ACTIVE', expiryDate }),
      terms: options.terms || 'Standard Workshop Hardware Warranty',
      partsUsed: job.partsUsed || [],
      repairDetails: job.problemDescription || job.issue || '',
      totalAmount: totalAmt,
      paidAmount: paidAmt,
      dueAmount: remainingDue,
      paymentStatus: 'PAID',
      warrantyEligible: true,
      shopId,
    });

    return await this.enrichWarrantyFinancials(warranty.toObject(), shopId);
  }

  async update(id, data, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;

    const existing = await Warranty.findOne(filter);
    if (!existing) throw new Error('Warranty record not found');

    if (data.serviceWarrantyDays !== undefined || data.partsWarrantyDays !== undefined || data.startDate) {
      const sDays = data.serviceWarrantyDays !== undefined ? Number(data.serviceWarrantyDays) : existing.serviceWarrantyDays;
      const pDays = data.partsWarrantyDays !== undefined ? Number(data.partsWarrantyDays) : existing.partsWarrantyDays;
      const maxDays = Math.max(sDays, pDays);

      const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + maxDays);

      data.serviceWarrantyDays = sDays;
      data.partsWarrantyDays = pDays;
      data.startDate = startDate;
      data.expiryDate = expiryDate;
    }

    const updated = await Warranty.findOneAndUpdate(filter, data, { new: true });
    return await this.enrichWarrantyFinancials(updated.toObject(), shopId);
  }

  async voidWarranty(id, reason = '', shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;

    const updated = await Warranty.findOneAndUpdate(
      filter,
      { status: 'VOID', voidReason: reason || 'Invalidated as per workshop terms' },
      { new: true }
    );
    if (!updated) throw new Error('Warranty record not found');
    return await this.enrichWarrantyFinancials(updated.toObject(), shopId);
  }
}
