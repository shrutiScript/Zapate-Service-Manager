import { Purchase } from './purchase.model.js';
import { SparePart } from '../inventory/inventory.model.js';
import { Supplier } from '../suppliers/supplier.model.js';

export class PurchaseService {
  async getAll(shopId = null) {
    const filter = shopId ? { shopId } : {};
    return Purchase.find(filter).sort({ createdAt: -1 });
  }

  async getById(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const p = await Purchase.findOne(filter).populate('supplier');
    if (!p) throw new Error('Purchase invoice not found or unauthorized');
    return p;
  }

  async generateUniquePoNumber(shopId = null) {
    const totalCount = await Purchase.countDocuments();
    let seq = totalCount + 1;
    let attempts = 0;

    while (attempts < 100) {
      const candidate = `PO-${String(seq).padStart(4, '0')}`;
      const exists = await Purchase.findOne({ invoiceNumber: candidate });
      if (!exists) {
        return candidate;
      }
      seq++;
      attempts++;
    }

    const ts = Date.now().toString().slice(-6);
    return `PO-${ts}`;
  }

  async create(data, shopId = null) {
    let invoiceNumber = data.invoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = await this.generateUniquePoNumber(shopId);
    } else {
      const exists = await Purchase.findOne({ invoiceNumber });
      if (exists) {
        invoiceNumber = await this.generateUniquePoNumber(shopId);
      }
    }

    const supplierId = data.supplier || data.supplierId || null;

    const rawItems = Array.isArray(data.items) ? data.items : [];
    const items = rawItems.map((item) => {
      const quantity = Math.max(1, Number(item.quantity || 1));
      const purchasePrice = Number(
        item.purchasePrice !== undefined
          ? item.purchasePrice
          : item.unitCost !== undefined
          ? item.unitCost
          : 0
      );
      const totalAmount = Number(
        item.totalAmount !== undefined
          ? item.totalAmount
          : item.totalCost !== undefined
          ? item.totalCost
          : purchasePrice * quantity
      );

      return {
        ...item,
        quantity,
        purchasePrice,
        totalAmount,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + (i.purchasePrice || 0) * (i.quantity || 1), 0);
    const taxAmount = Number(data.taxAmount || 0);
    const totalAmount = data.totalAmount !== undefined ? Number(data.totalAmount) : subtotal + taxAmount;
    const paidAmount = data.paidAmount !== undefined ? Number(data.paidAmount) : totalAmount;
    const pendingBalance = Math.max(0, totalAmount - paidAmount);

    let paymentStatus = 'Paid';
    if (data.paymentStatus) {
      const s = String(data.paymentStatus).toUpperCase();
      if (s === 'UNPAID') paymentStatus = 'Unpaid';
      else if (s === 'PARTIAL' || s === 'PARTIALLY PAID') paymentStatus = 'Partial';
      else paymentStatus = 'Paid';
    } else {
      paymentStatus = pendingBalance === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';
    }

    // Auto-increment inventory stock scoped to shopId
    for (const item of items) {
      if (item.partId) {
        const part = await SparePart.findOne({ _id: item.partId, ...(shopId ? { shopId } : {}) });
        if (part) {
          part.quantity = (part.quantity || 0) + Number(item.quantity || 0);
          part.purchasePrice = item.purchasePrice || part.purchasePrice;
          part.status = part.quantity <= (part.minimumQuantity || 3) ? 'Low Stock' : 'In Stock';
          await part.save();
        }
      } else if (item.name) {
        let part = await SparePart.findOne({ name: { $regex: new RegExp(`^${item.name}$`, 'i') }, ...(shopId ? { shopId } : {}) });
        if (part) {
          part.quantity = (part.quantity || 0) + Number(item.quantity || 0);
          part.purchasePrice = item.purchasePrice || part.purchasePrice;
          part.status = part.quantity <= (part.minimumQuantity || 3) ? 'Low Stock' : 'In Stock';
          await part.save();
        } else {
          await SparePart.create({
            name: item.name,
            category: item.category || 'Spares',
            brand: item.brand || 'Universal',
            compatibleModel: item.compatibleModel || item.model || 'Universal',
            sku: item.sku || `SKU-${Date.now().toString().slice(-6)}`,
            quantity: Number(item.quantity || 1),
            minimumQuantity: 3,
            locationRack: item.locationRack || 'Shelf A-01',
            purchasePrice: Number(item.purchasePrice || 0),
            sellingPrice: Number(item.sellingPrice || (item.purchasePrice ? item.purchasePrice * 1.3 : 0)),
            status: Number(item.quantity || 1) <= 3 ? 'Low Stock' : 'In Stock',
            shopId,
          });
        }
      }
    }

    // Update supplier ledger scoped to shopId
    if (supplierId) {
      const sup = await Supplier.findOne({ _id: supplierId, ...(shopId ? { shopId } : {}) });
      if (sup) {
        sup.totalPurchased = (sup.totalPurchased || 0) + totalAmount;
        sup.outstandingBalance = (sup.outstandingBalance || 0) + pendingBalance;
        await sup.save();
      }
    }

    return Purchase.create({
      invoiceNumber,
      supplier: supplierId,
      supplierName: data.supplierName || 'Primary Supplier',
      items,
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount,
      pendingBalance,
      paymentStatus,
      paymentMethod: data.paymentMethod || 'Bank Transfer',
      notes: data.notes,
      shopId,
    });
  }
}
