/**
 * Compresses an image File or Blob using an HTML5 Canvas.
 * Resizes max dimension to maxDimension (default 400px) and outputs a compact JPEG/WebP data URL (~25-50KB).
 * @param {File} file
 * @param {number} maxDimension
 * @param {number} quality
 * @returns {Promise<string>} dataUrl
 */
export const compressImage = (file, maxDimension = 400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target.result);
        }

        // Draw resized
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let resultUrl = '';
        try {
          resultUrl = canvas.toDataURL('image/webp', quality);
          if (!resultUrl.startsWith('data:image/webp')) {
            resultUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          resultUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(resultUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};
