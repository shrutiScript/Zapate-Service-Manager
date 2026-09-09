import { UsedMobile } from './usedMobile.model.js';

// Map client-facing field names to the Mongoose schema field names.
// The form sends `imei` and `grade`; the schema stores `imei1` and `condition`.
const GRADE_TO_CONDITION = {
  'Grade A+': 'Grade A+ (Flawless)',
  'Grade A':  'Grade A (Minor wear)',
  'Grade B':  'Grade B (Good)',
  'Grade C':  'Grade C (Fair)',
};

function normalizeData(data) {
  const out = { ...data };
  // imei → imei1
  if (data.imei !== undefined && data.imei1 === undefined) {
    out.imei1 = data.imei;
    delete out.imei;
  }
  // grade → condition (map to enum value)
  if (data.grade !== undefined && data.condition === undefined) {
    out.condition = GRADE_TO_CONDITION[data.grade] || data.grade;
    delete out.grade;
  }
  return out;
}

export class UsedMobileService {
  async getAll(query = {}, shopId = null) {
    const filter = shopId ? { shopId } : {};
    if (query.status && query.status !== 'ALL') filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { brand: { $regex: query.search, $options: 'i' } },
        { model: { $regex: query.search, $options: 'i' } },
        { imei: { $regex: query.search, $options: 'i' } },
      ];
    }
    return UsedMobile.find(filter).sort({ createdAt: -1 });
  }

  async getById(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const mobile = await UsedMobile.findOne(filter);
    if (!mobile) throw new Error('Used mobile record not found or unauthorized');
    return mobile;
  }

  async create(data, shopId = null) {
    const normalized = normalizeData(data);
    const expectedMargin = (normalized.sellingPrice || 0) - ((normalized.purchasePrice || 0) + (normalized.repairCost || 0));
    return UsedMobile.create({
      ...normalized,
      expectedMargin,
      status: normalized.status || 'In Stock',
      shopId,
    });
  }

  async update(id, data, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const mobile = await UsedMobile.findOne(filter);
    if (!mobile) throw new Error('Device not found or unauthorized access');

    const normalized = normalizeData(data);
    Object.assign(mobile, normalized);
    if (normalized.sellingPrice || normalized.purchasePrice || normalized.repairCost) {
      mobile.expectedMargin = (mobile.sellingPrice || 0) - ((mobile.purchasePrice || 0) + (mobile.repairCost || 0));
    }
    await mobile.save();
    return mobile;
  }

  async sell(id, data, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const mobile = await UsedMobile.findOne(filter);
    if (!mobile) throw new Error('Device not found or unauthorized access');

    mobile.status = 'Sold';
    mobile.buyerName = data.buyerName;
    mobile.buyerPhone = data.buyerPhone;
    mobile.sellingPrice = Number(data.sellingPrice || mobile.sellingPrice);
    mobile.soldDate = new Date();
    await mobile.save();
    return mobile;
  }

  async delete(id, shopId = null) {
    const filter = { _id: id };
    if (shopId) filter.shopId = shopId;
    const mobile = await UsedMobile.findOneAndDelete(filter);
    if (!mobile) throw new Error('Device not found or unauthorized access');
    return true;
  }
}
