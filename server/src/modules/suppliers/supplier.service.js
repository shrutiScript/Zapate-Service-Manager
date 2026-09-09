import { Supplier } from './supplier.model.js';

export class SupplierService {
  async getAll(search, shopId = null) {
    const filter = shopId ? { shopId } : {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    return Supplier.find(filter).sort({ name: 1 });
  }

  async getById(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const sup = await Supplier.findOne(filter);
    if (!sup) throw new Error('Supplier not found or unauthorized');
    return sup;
  }

  async create(data, shopId = null) {
    return Supplier.create({
      ...data,
      shopId,
    });
  }

  async update(id, data, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const sup = await Supplier.findOneAndUpdate(filter, data, { new: true });
    if (!sup) throw new Error('Supplier not found or unauthorized access');
    return sup;
  }

  async delete(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const sup = await Supplier.findOneAndDelete(filter);
    if (!sup) throw new Error('Supplier not found or unauthorized access');
    return true;
  }
}
