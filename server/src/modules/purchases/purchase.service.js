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

  async create(data, shopId = null) {
    const count = await Purchase.countDocuments(shopId ? { shopId } : {});
    const invoiceNumber = `PO-${(count + 1).toString().padStart(4, '0')}`;

    const items = data.items || [];
    const subtotal = items.reduce((sum, i) => sum + (i.purchasePrice || 0) * (i.quantity || 1), 0);
    const taxAmount = data.taxAmount || 0;
    const totalAmount = subtotal + taxAmount;
    const paidAmount = data.paidAmount !== undefined ? data.paidAmount : totalAmount;
    const pendingBalance = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = pendingBalance === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';

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
    if (data.supplier) {
      const sup = await Supplier.findOne({ _id: data.supplier, ...(shopId ? { shopId } : {}) });
      if (sup) {
        sup.totalPurchased = (sup.totalPurchased || 0) + totalAmount;
        sup.outstandingBalance = (sup.outstandingBalance || 0) + pendingBalance;
        await sup.save();
      }
    }

    return Purchase.create({
      invoiceNumber: data.invoiceNumber || invoiceNumber,
      supplier: data.supplier,
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
