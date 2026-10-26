const ACCEPTED_PAYMENT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const TARGET_BYTES = 1_500_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The selected screenshot could not be read.'));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('The screenshot could not be compressed.')),
      'image/webp',
      quality,
    );
  });
}

export async function compressPaymentImage(file: File): Promise<File> {
  if (!ACCEPTED_PAYMENT_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Upload a JPG, PNG, or WebP GCash screenshot.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('The original screenshot must be 15 MB or smaller.');
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  let blob: Blob | null = null;
  let quality = 0.84;

  // Re-encode first, then progressively lower quality and dimensions until the
  // screenshot is storage-efficient. The original file is never uploaded.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Image compression is unavailable in this browser.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    blob = await canvasBlob(canvas, quality);
    if (blob.size <= TARGET_BYTES) break;

    if (quality > 0.58) {
      quality = Math.max(0.58, quality - 0.1);
    } else {
      const longestSide = Math.max(width, height);
      if (longestSide > 800) {
        const resizeScale = Math.max(800 / longestSide, 0.82);
        width = Math.max(1, Math.round(width * resizeScale));
        height = Math.max(1, Math.round(height * resizeScale));
        quality = 0.68;
      } else {
        quality = Math.max(0.45, quality - 0.05);
      }
    }
  }

  if (!blob || blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('The screenshot is still larger than 5 MB after compression. Choose a smaller image.');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60) || 'gcash-proof';
  return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
}

