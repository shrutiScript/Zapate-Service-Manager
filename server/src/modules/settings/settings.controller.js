import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SettingsService } from './settings.service.js';
import { sendSuccess } from '../../utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsService = new SettingsService();

export class SettingsController {
  async get(req, res, next) {
    try {
      const settings = await settingsService.get(req.shopId);
      return sendSuccess(res, settings);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const settings = await settingsService.update(req.body, req.shopId, req);
      return sendSuccess(res, settings, 'Workshop settings updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  async uploadLogo(req, res, next) {
    try {
      const { image, base64 } = req.body;
      const rawData = image || base64;

      if (!rawData) {
        return res.status(400).json({ success: false, message: 'No logo image provided for upload.' });
      }

      // Parse data URL format: data:image/png;base64,...
      const matches = rawData.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i);
      if (!matches) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file format. Only PNG, JPG, JPEG, and WebP images are allowed.',
        });
      }

      const ext = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
      const buffer = Buffer.from(matches[2], 'base64');

      // 5 MB size limit
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds maximum limit of 5 MB.',
        });
      }

      const uploadsDir = path.join(__dirname, '../../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `logo-${req.shopId || 'shop'}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, buffer);

      const logoUrl = `/uploads/${filename}`;

      // Persist logo URL to Shop / Settings record immediately
      await settingsService.update({ logo: logoUrl }, req.shopId);

      return sendSuccess(res, { logoUrl }, 'Shop logo uploaded successfully.');
    } catch (err) {
      next(err);
    }
  }
}
