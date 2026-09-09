import { Invoice } from './pos.model.js';
import { SparePart } from '../inventory/inventory.model.js';
import { Payment, PaymentLedger } from '../payments/payment.model.js';
import { Shop } from '../shops/shop.model.js';
import { PaymentService } from '../payments/payment.service.js';

const paymentService = new PaymentService();

export class PosService {
  async getAllInvoices(query = {}, shopId = null) {
    const filter = shopId ? { shopId } : {};
    if (query.status && query.status !== 'ALL') {
      filter.status = { $regex: new RegExp(`^${query.status}$`, 'i') };
    }
    if (query.search) {
      const s = query.search.trim();
      filter.$or = [
        { number: { $regex: s, $options: 'i' } },
        { orderId: { $regex: s, $options: 'i' } },
        { customerName: { $regex: s, $options: 'i' } },
        { customerMobile: { $regex: s, $options: 'i' } },
        { deviceModel: { $regex: s, $options: 'i' } },
        { 'items.name': { $regex: s, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('shopId', 'name logo addressLine1 city state ownerMobile businessEmail gstNumber termsAndConditions businessType invoiceFooter')
      .sort({ createdAt: -1 })
      .lean();

    // Attach linked payments history to each invoice
    for (const inv of invoices) {
      const payments = await Payment.find({ invoiceId: inv._id }).sort({ createdAt: 1 }).lean();
      inv.payments = payments || [];
    }

    return invoices;
  }

  async getInvoiceById(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const inv = await Invoice.findOne(filter)
      .populate('items.partId')
      .populate('shopId', 'name logo addressLine1 addressLine2 city state pincode ownerMobile shopContactNumber ownerEmail businessEmail gstNumber termsAndConditions businessType invoiceFooter');
    if (!inv) throw new Error('Invoice not found or unauthorized');

    const invObj = inv.toObject();
    const payments = await Payment.find({ invoiceId: inv._id }).sort({ createdAt: 1 }).lean();
    invObj.payments = payments || [];
    return invObj;
  }

  async generateUniqueInvoiceNumber(prefix, shopId) {
    const shopCount = await Invoice.countDocuments({ shopId });
    let seq = shopCount + 1;
    let candidateNumber = `${prefix}${String(seq).padStart(6, '0')}`;
    let candidateOrderId = `ORD${String(100000 + seq)}`;
    let attempts = 0;

    while (attempts < 50) {
      candidateNumber = `${prefix}${String(seq).padStart(6, '0')}`;
      candidateOrderId = `ORD${String(100000 + seq)}`;

      const exists = await Invoice.findOne({
        $or: [{ number: candidateNumber }, { orderId: candidateOrderId }],
      });

      if (!exists) {
        return { number: candidateNumber, orderId: candidateOrderId };
      }
      seq++;
      attempts++;
    }

    const ts = Date.now().toString().slice(-6);
    return {
      number: `${prefix}${ts}`,
      orderId: `ORD${ts}`,
    };
  }

  async createInvoice(data, shopId = null) {
    if (!shopId) {
      throw new Error('Shop identification is required to generate invoices.');
    }

    // Load current shop profile for snapshot & prefix
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new Error('Shop account not found or suspended.');
    }

    const prefix = shop.invoicePrefix || 'INV-';
    const { number: autoNumber, orderId: autoOrderId } = await this.generateUniqueInvoiceNumber(prefix, shopId);
    const invoiceNumber = data.number || autoNumber;
    const orderId = data.orderId || autoOrderId;

    const items = (data.items || []).map((item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity || item.qty) || 1;
      const total = item.total !== undefined ? Number(item.total) : price * quantity;
      return {
        partId: item.partId || undefined,
        name: (item.name || item.partName || 'Service / Repair Item').trim(),
        sku: item.sku || '',
        category: item.category || 'Spares',
        brand: item.brand || data.deviceBrand || '',
        model: item.model || data.deviceModel || '',
        problem: item.problem || data.reportedProblem || '',
        price,
        quantity,
        taxPercent: Number(item.taxPercent || data.taxRate || 0),
        total,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = Number(data.taxRate || data.taxPercent || 0);
    const taxAmount = Number(data.taxAmount !== undefined ? data.taxAmount : (subtotal * taxRate) / 100);
    const discountAmount = Number(data.discountAmount || 0);
    const total = Math.max(0, subtotal + taxAmount - discountAmount);
    const paidAmount = data.paidAmount !== undefined && data.paidAmount !== '' ? Number(data.paidAmount) : total;
    const dueAmount = Math.max(0, total - paidAmount);

    let status = 'PAID';
    if (dueAmount <= 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIALLY PAID';
    } else {
      status = 'UNPAID';
    }

    // Sanitize Custom Fields
    const customFields = Array.isArray(data.customFields)
      ? data.customFields
          .filter((cf) => cf && cf.name && String(cf.name).trim() && cf.value && String(cf.value).trim())
          .map((cf) => ({ name: String(cf.name).trim(), value: String(cf.value).trim() }))
      : [];

    // Stock Validation for Inventory Products / Spare Parts
    const isRepairInvoice = data.invoiceType === 'REPAIR';
    for (const item of items) {
      if (item.quantity <= 0) {
        const err = new Error(`Quantity for "${item.name}" must be greater than 0.`);
        err.statusCode = 400;
        throw err;
      }

      if (item.partId && !isRepairInvoice) {
        const part = await SparePart.findOne({ _id: item.partId, shopId });
        if (!part) {
          const err = new Error(`Inventory item "${item.name}" was not found.`);
          err.statusCode = 404;
          throw err;
        }

        if (part.quantity <= 0) {
          const err = new Error(`"${part.name}" is currently out of stock.`);
          err.statusCode = 400;
          err.availableStock = 0;
          err.requestedQuantity = item.quantity;
          err.partId = item.partId;
          err.partName = part.name;
          err.unitPrice = item.price;
          throw err;
        }

        if (item.quantity > part.quantity) {
          const err = new Error(
            `Only ${part.quantity} items of "${part.name}" are currently available in stock. You requested ${item.quantity} items.`
          );
          err.statusCode = 400;
          err.availableStock = part.quantity;
          err.requestedQuantity = item.quantity;
          err.partId = item.partId;
          err.partName = part.name;
          err.unitPrice = item.price;
          throw err;
        }
      }
    }

    // Atomic decrement for inventory stock scoped to shopId (for non-repair invoices)
    const decrementedItems = [];
    if (!isRepairInvoice) {
      try {
        for (const item of items) {
          if (item.partId) {
            // Atomic check and decrement to prevent concurrent overselling
            const updatedPart = await SparePart.findOneAndUpdate(
              { _id: item.partId, shopId, quantity: { $gte: item.quantity } },
              { $inc: { quantity: -item.quantity } },
              { returnDocument: 'after' }
            );

            if (!updatedPart) {
              const currentPart = await SparePart.findOne({ _id: item.partId, shopId });
              const currentQty = currentPart ? currentPart.quantity : 0;
              const err = new Error(
                `Only ${currentQty} items of "${item.name}" are currently available in stock. You requested ${item.quantity} items.`
              );
              err.statusCode = 400;
              err.availableStock = currentQty;
              err.requestedQuantity = item.quantity;
              err.partId = item.partId;
              err.partName = item.name;
              err.unitPrice = item.price;
              throw err;
            }

            updatedPart.status =
              updatedPart.quantity === 0
                ? 'Out of Stock'
                : updatedPart.quantity <= (updatedPart.minimumQuantity || 3)
                ? 'Low Stock'
                : 'In Stock';
            await updatedPart.save();

            decrementedItems.push({ partId: item.partId, quantity: item.quantity });
          }
        }
      } catch (stockErr) {
        // Rollback any partially decremented items
        for (const dec of decrementedItems) {
          await SparePart.findOneAndUpdate(
            { _id: dec.partId, shopId },
            { $inc: { quantity: dec.quantity } }
          );
        }
        throw stockErr;
      }
    }

    // Build complete Shop Snapshot
    const shopAddress = [shop.addressLine1, shop.addressLine2, shop.landmark, shop.city, shop.state, shop.pincode].filter(Boolean).join(', ') || shop.addressLine1 || '';
    const shopSnapshot = {
      name: shop.name,
      ownerName: shop.ownerName,
      ownerMobile: shop.shopContactNumber || shop.ownerMobile || '',
      ownerEmail: shop.businessEmail || shop.ownerEmail || '',
      businessEmail: shop.businessEmail || '',
      shopContactNumber: shop.shopContactNumber || shop.ownerMobile || '',
      logo: shop.logo || '',
      address: shopAddress,
      city: shop.city || '',
      state: shop.state || '',
      pincode: shop.pincode || '',
      gstNumber: shop.gstNumber || '',
      businessType: shop.businessType || 'Mobile Repair Workshop',
      termsAndConditions: shop.termsAndConditions || '1. Device must be collected within 10 days.\n2. Physical damage and water damage are not covered under warranty.\n3. Warranty is not applicable if another technician opens or repairs the device.\n4. Data loss is not the responsibility of the workshop.',
    };

    let normalizedPaymentMethod = data.paymentMethod || 'UPI';
    if (String(normalizedPaymentMethod).toUpperCase() === 'CASH') normalizedPaymentMethod = 'Cash';
    else if (String(normalizedPaymentMethod).toUpperCase() === 'CARD') normalizedPaymentMethod = 'Card';
    else if (String(normalizedPaymentMethod).toUpperCase() === 'BANK TRANSFER') normalizedPaymentMethod = 'Bank Transfer';

    try {
      const invoice = await Invoice.create({
        number: invoiceNumber,
        orderId: orderId,
        invoiceType: data.invoiceType || 'QUICK_SALE',
        repairJobId: data.repairJobId || undefined,
        customer: data.customer || undefined,
        customerName: (data.customerName || 'Walk-in Client').trim(),
        customerMobile: (data.customerMobile || '').trim(),
        customerEmail: (data.customerEmail || '').trim(),
        customerAddress: (data.customerAddress || '').trim(),
        deviceBrand: (data.deviceBrand || '').trim(),
        deviceModel: (data.deviceModel || '').trim(),
        deviceImei: (data.deviceImei || data.imei || '').trim(),
        deviceSerialNumber: (data.deviceSerialNumber || '').trim(),
        reportedProblem: (data.reportedProblem || data.problem || '').trim(),
        serviceCharge: Number(data.serviceCharge || 0),
        additionalCharges: Array.isArray(data.additionalCharges) ? data.additionalCharges : [],
        notes: (data.notes || '').trim(),
        customFields,
        items,
        subtotal,
        taxAmount,
        taxPercent: taxRate,
        discountAmount,
        total,
        paidAmount,
        dueAmount,
        paymentMethod: normalizedPaymentMethod,
        status,
        shopSnapshot,
        shopId,
      });

      // Auto-create initial Payment record & payment receipt if initial payment > 0
      if (paidAmount > 0) {
        const receiptNo = await paymentService.generatePaymentReceiptNumber(shopId);

        await Payment.create({
          paymentReceiptNumber: receiptNo,
          invoiceId: invoice._id,
          invoiceNumber: invoice.number,
          repairJobId: invoice.repairJobId || undefined,
          customerId: invoice.customer || undefined,
          customerName: invoice.customerName,
          customerMobile: invoice.customerMobile,
          amount: paidAmount,
          paymentMethod: invoice.paymentMethod,
          paymentDate: new Date(),
          notes: 'Initial invoice settlement',
          receivedBy: 'Staff',
          previousDue: total,
          remainingDue: dueAmount,
          shopId,
        });

        await PaymentLedger.create({
          transactionNumber: receiptNo,
          customer: data.customer || undefined,
          customerName: invoice.customerName,
          customerMobile: invoice.customerMobile,
          invoiceNumber: invoice.number,
          amount: paidAmount,
          type: 'Credit',
          method: invoice.paymentMethod,
          paymentReceiptNumber: receiptNo,
          balanceAfter: dueAmount,
          notes: `POS invoice settlement: ${invoice.number} (${invoice.orderId})`,
          shopId,
        });
      }

      const invObj = invoice.toObject();
      const payments = await Payment.find({ invoiceId: invoice._id }).sort({ createdAt: 1 }).lean();
      invObj.payments = payments || [];

      return invObj;
    } catch (err) {
      // Rollback any decremented stock if invoice creation failed
      for (const dec of decrementedItems) {
        await SparePart.findOneAndUpdate(
          { _id: dec.partId, shopId },
          { $inc: { quantity: dec.quantity } }
        );
      }
      throw err;
    }
  }

  async deleteInvoice(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const inv = await Invoice.findOneAndDelete(filter);
    if (!inv) throw new Error('Invoice not found or unauthorized');
    // Clean up linked payments
    await Payment.deleteMany({ invoiceId: id });
    return inv;
  }
}

