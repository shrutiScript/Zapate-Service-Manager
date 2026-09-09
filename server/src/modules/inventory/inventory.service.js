import { SparePart } from './inventory.model.js';

export class InventoryService {
  async getAll(query = {}, shopId = null) {
    const filter = shopId ? { shopId } : {};
    if (query.category && query.category !== 'All Categories' && query.category !== 'ALL') {
      filter.category = query.category;
    }
    if (query.brand && query.brand !== 'All Brands' && query.brand !== 'ALL') {
      filter.brand = query.brand;
    }
    if (query.lowStock === 'true') filter.status = 'Low Stock';
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { sku: { $regex: query.search, $options: 'i' } },
        { brand: { $regex: query.search, $options: 'i' } },
        { compatibleModel: { $regex: query.search, $options: 'i' } },
        { locationRack: { $regex: query.search, $options: 'i' } },
      ];
    }
    return SparePart.find(filter).sort({ name: 1 });
  }

  async getById(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const item = await SparePart.findOne(filter);
    if (!item) throw new Error('Inventory spare part not found or unauthorized');
    return item;
  }

  async create(data, shopId = null) {
    const qty = Number(data.quantity || 0);
    const minQty = Number(data.minimumQuantity || data.minStock || 3);
    const status = qty === 0 ? 'Out of Stock' : (qty <= minQty ? 'Low Stock' : 'In Stock');
    const brand = (data.brand && data.brand.trim()) ? data.brand.trim() : 'Universal';
    const compatibleModel = (data.compatibleModel && data.compatibleModel.trim())
      ? data.compatibleModel.trim()
      : (data.model && data.model.trim()) ? data.model.trim() : 'Universal';
    const locationRack = data.locationRack || data.rackLocation || data.rack || 'Shelf A-01';

    return SparePart.create({
      ...data,
      brand,
      compatibleModel,
      locationRack,
      quantity: qty,
      minimumQuantity: minQty,
      status,
      shopId,
    });
  }

  async update(id, data, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const item = await SparePart.findOne(filter);
    if (!item) throw new Error('Item not found or unauthorized');

    const updatePayload = { ...data };
    if (data.rackLocation && !data.locationRack) {
      updatePayload.locationRack = data.rackLocation;
    }
    if (data.rack && !data.locationRack) {
      updatePayload.locationRack = data.rack;
    }
    if (data.model && !data.compatibleModel) {
      updatePayload.compatibleModel = data.model;
    }
    if (data.brand !== undefined) {
      updatePayload.brand = (data.brand && data.brand.trim()) ? data.brand.trim() : 'Universal';
    }

    Object.assign(item, updatePayload);
    const qty = Number(item.quantity !== undefined ? item.quantity : 0);
    const minQty = Number(item.minimumQuantity !== undefined ? item.minimumQuantity : 3);
    item.status = qty === 0 ? 'Out of Stock' : (qty <= minQty ? 'Low Stock' : 'In Stock');

    await item.save();
    return item;
  }

  async adjustStock(id, { adjustmentQty, type = 'Add' }, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const item = await SparePart.findOne(filter);
    if (!item) throw new Error('Item not found or unauthorized');

    if (type === 'Add') {
      item.quantity += Number(adjustmentQty);
    } else {
      item.quantity = Math.max(0, item.quantity - Number(adjustmentQty));
    }

    const qty = Number(item.quantity || 0);
    const minQty = Number(item.minimumQuantity || 3);
    item.status = qty === 0 ? 'Out of Stock' : (qty <= minQty ? 'Low Stock' : 'In Stock');

    await item.save();
    return item;
  }

  async delete(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const item = await SparePart.findOneAndDelete(filter);
    if (!item) throw new Error('Item not found or unauthorized');
    return true;
  }
}
