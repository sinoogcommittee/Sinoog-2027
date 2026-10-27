const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const TARGET_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 2400;

export interface CompressedGalleryImage {
  file: File;
  width: number;
  height: number;
  originalBytes: number;
}

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
      reject(new Error(`“${file.name}” could not be read as an image.`));
    };
    image.src = url;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('This browser could not compress the image.')),
      'image/webp',
      quality,
    );
  });
}

export async function compressGalleryImage(file: File): Promise<CompressedGalleryImage> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error(`“${file.name}” is not a supported JPG, PNG, or WebP image.`);
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`“${file.name}” must be 30 MB or smaller before compression.`);
  }

  const image = await loadImage(file);
  const initialScale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  let width = Math.max(1, Math.round(image.naturalWidth * initialScale));
  let height = Math.max(1, Math.round(image.naturalHeight * initialScale));
  let quality = 0.86;
  let blob: Blob | null = null;
  const canvas = document.createElement('canvas');

  for (let attempt = 0; attempt < 12; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Image compression is unavailable in this browser.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    blob = await canvasToWebp(canvas, quality);
    if (blob.size <= TARGET_BYTES) break;

    if (quality > 0.58) {
      quality = Math.max(0.58, quality - 0.08);
    } else {
      width = Math.max(960, Math.round(width * 0.84));
      height = Math.max(640, Math.round(height * 0.84));
      quality = 0.7;
    }
  }

  if (!blob || blob.size > MAX_UPLOAD_BYTES) {
    throw new Error(`“${file.name}” is still larger than 5 MB after compression.`);
  }

  const baseName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'gallery-photo';

  return {
    file: new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() }),
    width,
    height,
    originalBytes: file.size,
  };
}
