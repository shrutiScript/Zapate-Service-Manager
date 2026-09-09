import { Payment, PaymentLedger } from './payment.model.js';
import { Customer } from '../customers/customer.model.js';
import { Invoice } from '../pos/pos.model.js';
import { Repair } from '../repairs/repair.model.js';

export class PaymentService {
  async generatePaymentReceiptNumber(shopId) {
    const year = new Date().getFullYear();
    const count = await Payment.countDocuments({ shopId });
    let seq = count + 1;
    let candidate = `PAY-${year}-${String(seq).padStart(5, '0')}`;
    let attempts = 0;

    while (attempts < 100) {
      candidate = `PAY-${year}-${String(seq).padStart(5, '0')}`;
      const [paymentExists, ledgerExists] = await Promise.all([
        Payment.findOne({ paymentReceiptNumber: candidate }),
        PaymentLedger.findOne({ transactionNumber: candidate }),
      ]);
      if (!paymentExists && !ledgerExists) return candidate;
      seq++;
      attempts++;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PAY-${year}-${Date.now().toString().slice(-5)}${randomSuffix}`;
  }


  async getLedger(query = {}, shopId = null) {
    const filter = shopId ? { shopId } : {};
    if (query.customer) filter.customer = query.customer;
    if (query.type) filter.type = query.type;
    return PaymentLedger.find(filter).sort({ createdAt: -1 });
  }

  async getInvoicePaymentHistory(invoiceId, shopId = null) {
    const filter = { invoiceId };
    if (shopId) filter.shopId = shopId;
    return Payment.find(filter).sort({ createdAt: 1 });
  }

  async getPaymentByReceiptNumber(receiptNumber, shopId = null) {
    const filter = { paymentReceiptNumber: receiptNumber };
    if (shopId) filter.shopId = shopId;
    const payment = await Payment.findOne(filter)
      .populate('invoiceId')
      .populate('customerId')
      .populate('repairJobId');
    if (!payment) throw new Error('Payment receipt not found');
    return payment;
  }

  async getDueSummary(shopId = null) {
    const filter = shopId ? { shopId } : {};
    const invoices = await Invoice.find({
      ...filter,
      status: { $ne: 'CANCELLED' },
    });

    let totalOutstandingDue = 0;
    let partiallyPaidCount = 0;
    let unpaidCount = 0;

    invoices.forEach((inv) => {
      const due = Number(inv.dueAmount || 0);
      const paid = Number(inv.paidAmount || 0);
      const total = Number(inv.total || 0);
      const st = (inv.status || '').toUpperCase();

      if (due > 0) {
        totalOutstandingDue += due;
        if (paid > 0 && paid < total) {
          partiallyPaidCount++;
        } else if (paid === 0) {
          unpaidCount++;
        }
      }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayPayments = await Payment.find({
      ...filter,
      createdAt: { $gte: startOfToday },
    });

    const todayCollections = todayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalOutstandingDue,
      partiallyPaidCount,
      unpaidCount,
      todayCollections,
      totalInvoicesCount: invoices.length,
    };
  }

  async receiveInvoicePayment(data, shopId = null, staffName = 'Staff') {
    const { invoiceId, amount: rawAmount, paymentMethod = 'Cash', paymentDate, notes = '', receivedBy } = data;

    if (!invoiceId) throw new Error('Invoice ID is required');

    const invFilter = { _id: invoiceId };
    if (shopId) invFilter.shopId = shopId;

    const invoice = await Invoice.findOne(invFilter);
    if (!invoice) throw new Error('Invoice not found or unauthorized');

    if ((invoice.status || '').toUpperCase() === 'CANCELLED') {
      throw new Error('Cannot process payment for a CANCELLED invoice.');
    }

    const currentTotal = Number(invoice.total) || 0;
    
    // Re-verify existing payments to get authoritative current total paid
    const existingPayments = await Payment.find({ invoiceId: invoice._id });
    const currentTotalPaid = existingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const currentRemainingDue = Math.max(0, currentTotal - currentTotalPaid);

    if (currentRemainingDue <= 0) {
      throw new Error('This invoice is already fully paid.');
    }

    const amount = Number(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    // Allow 0.01 tolerance for precision
    if (amount > currentRemainingDue + 0.01) {
      throw new Error(`Payment amount (₹${amount}) cannot exceed the remaining due amount (₹${currentRemainingDue.toLocaleString()}).`);
    }

    const receiptNo = await this.generatePaymentReceiptNumber(shopId || invoice.shopId);
    const pDate = paymentDate ? new Date(paymentDate) : new Date();

    const previousDue = currentRemainingDue;
    const remainingDue = Math.max(0, currentRemainingDue - amount);

    const payment = await Payment.create({
      paymentReceiptNumber: receiptNo,
      invoiceId: invoice._id,
      invoiceNumber: invoice.number,
      repairJobId: invoice.repairJobId || undefined,
      customerId: invoice.customer || undefined,
      customerName: invoice.customerName || 'Walk-in Client',
      customerMobile: invoice.customerMobile || '',
      amount,
      paymentMethod,
      paymentDate: pDate,
      notes: notes.trim(),
      receivedBy: receivedBy || staffName || 'Staff',
      previousDue,
      remainingDue,
      shopId: shopId || invoice.shopId,
    });

    // Recalculate invoice totals from authoritative payment records
    const allPayments = await Payment.find({ invoiceId: invoice._id });
    const newTotalPaid = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const newDueAmount = Math.max(0, currentTotal - newTotalPaid);

    let newStatus = 'PAID';
    if (newDueAmount <= 0) {
      newStatus = 'PAID';
    } else if (newTotalPaid > 0) {
      newStatus = 'PARTIALLY PAID';
    } else {
      newStatus = 'UNPAID';
    }

    invoice.paidAmount = newTotalPaid;
    invoice.dueAmount = newDueAmount;
    invoice.status = newStatus;
    invoice.paymentMethod = paymentMethod;
    await invoice.save();

    // Auto-update Customer CRM metrics
    if (invoice.customer || invoice.customerMobile || invoice.customerName) {
      const custFilter = invoice.customer
        ? { _id: invoice.customer }
        : invoice.customerMobile
        ? { mobile: invoice.customerMobile }
        : { name: invoice.customerName };

      if (shopId || invoice.shopId) custFilter.shopId = shopId || invoice.shopId;
      const cust = await Customer.findOne(custFilter);
      if (cust) {
        cust.pendingDue = Math.max(0, (cust.pendingDue || 0) - amount);
        cust.totalSpent = (cust.totalSpent || 0) + amount;
        await cust.save();
      }
    }

    // Auto-update linked Repair Job if present
    if (invoice.repairJobId) {
      const repair = await Repair.findOne({
        _id: invoice.repairJobId,
        ...(shopId ? { shopId } : {}),
      });
      if (repair) {
        repair.advancePayment = newTotalPaid;
        repair.pendingAmount = newDueAmount;
        await repair.save();
      }
    }

    // Mirror to PaymentLedger for general audit & legacy reporting
    await PaymentLedger.create({
      transactionNumber: receiptNo,
      customer: invoice.customer || undefined,
      customerName: invoice.customerName || 'Walk-in Client',
      customerMobile: invoice.customerMobile || '',
      invoiceNumber: invoice.number,
      jobCardNumber: invoice.repairJobId ? String(invoice.repairJobId) : undefined,
      amount,
      type: 'Credit',
      method: paymentMethod,
      paymentReceiptNumber: receiptNo,
      balanceAfter: newDueAmount,
      notes: `Invoice settlement: ${invoice.number}${notes ? ` - ${notes}` : ''}`,
      receivedBy: receivedBy || staffName || 'Staff',
      shopId: shopId || invoice.shopId,
    });

    return { payment, invoice };
  }

  async recordPayment(data, shopId = null) {
    // If invoice number is provided, attempt to receive invoice payment safely
    if (data.invoiceNumber || data.invoiceId) {
      const invFilter = data.invoiceId ? { _id: data.invoiceId } : { number: data.invoiceNumber };
      if (shopId) invFilter.shopId = shopId;
      const inv = await Invoice.findOne(invFilter);
      if (inv) {
        const result = await this.receiveInvoicePayment(
          {
            invoiceId: inv._id,
            amount: data.amount,
            paymentMethod: data.paymentMethod || data.method || 'Cash',
            notes: data.notes || '',
            receivedBy: data.receivedBy || 'Staff',
          },
          shopId
        );
        return result.payment;
      }
    }

    // Fallback general ledger voucher
    const count = await PaymentLedger.countDocuments(shopId ? { shopId } : {});
    const transactionNumber = `TXN-${Date.now().toString().slice(-6)}`;

    const entry = await PaymentLedger.create({
      ...data,
      transactionNumber: data.transactionNumber || transactionNumber,
      type: data.type || 'Credit',
      shopId,
      createdAt: new Date(),
    });

    if (data.customer || data.customerName) {
      const filter = data.customer ? { _id: data.customer } : { name: data.customerName };
      if (shopId) filter.shopId = shopId;
      const cust = await Customer.findOne(filter);
      if (cust) {
        if (entry.type === 'Credit') {
          cust.pendingDue = Math.max(0, (cust.pendingDue || 0) - entry.amount);
          cust.totalSpent = (cust.totalSpent || 0) + entry.amount;
        } else {
          cust.pendingDue = (cust.pendingDue || 0) + entry.amount;
        }
        await cust.save();
      }
    }

    return entry;
  }
}


