import { Device } from './device.model.js';

export class DeviceService {
  async getAll(search, shopId = null) {
    const filter = shopId ? { shopId } : {};
    if (search) {
      filter.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { imei1: { $regex: search, $options: 'i' } },
        { imei2: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
      ];
    }
    return Device.find(filter).populate('customer', 'name mobile email').sort({ createdAt: -1 });
  }

  async getById(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const dev = await Device.findOne(filter).populate('customer', 'name mobile email');
    if (!dev) throw new Error('Device not found or unauthorized');
    return dev;
  }

  async create(data, shopId = null) {
    return Device.create({
      ...data,
      shopId,
    });
  }

  async update(id, data, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const dev = await Device.findOneAndUpdate(filter, data, { new: true });
    if (!dev) throw new Error('Device not found or unauthorized access');
    return dev;
  }

  async delete(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const dev = await Device.findOneAndDelete(filter);
    if (!dev) throw new Error('Device not found or unauthorized access');
    return true;
  }
}
