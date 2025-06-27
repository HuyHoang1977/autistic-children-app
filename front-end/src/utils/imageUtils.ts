// src/utils/imageUtils.ts - FIXED VERSION
export const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';

  // If URL is already complete, use it directly
  if (imageUrl.startsWith('http://localhost:9000') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative path starting with bucket name
  if (imageUrl.includes('/')) {
    return `http://localhost:9000/${imageUrl}`;
  }

  // Fallback: use proxy endpoint if direct access fails
  return `/api/images/proxy/${imageUrl}`;
};

export const getProxyImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';

  // Remove protocol and domain if present
  let cleanPath = imageUrl;
  if (imageUrl.startsWith('http://localhost:9000/')) {
    cleanPath = imageUrl.replace('http://localhost:9000/', '');
  } else if (imageUrl.startsWith('http://minio:9000/')) {
    cleanPath = imageUrl.replace('http://minio:9000/', '');
  }

  return `/api/images/proxy/${cleanPath}`;
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml'
  ];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Only image files are allowed (JPEG, PNG, GIF, WEBP, BMP, TIFF, SVG)'
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 5MB'
    };
  }

  return { valid: true };
};

export const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        // Set canvas size
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        if (ctx) {
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, file.type, quality);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Image cache for performance
const imageCache = new Map<string, string>();

export const getCachedImageUrl = (url: string): string => {
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  const cachedUrl = getImageUrl(url);
  imageCache.set(url, cachedUrl);
  return cachedUrl;
};

export const clearImageCache = (): void => {
  imageCache.clear();
};

// Performance tracking
export const trackImageLoad = (url: string, startTime: number): void => {
  const loadTime = Date.now() - startTime;
  console.log(`📊 Image loaded in ${loadTime}ms: ${url}`);

  // Warn about slow loading images
  if (loadTime > 3000) {
    console.warn(`⚠️ Slow image load: ${url} (${loadTime}ms)`);
  }
};

// Generate placeholder image data URL
export const generatePlaceholder = (
  width: number = 400,
  height: number = 300,
  text: string = 'Loading...'
): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  if (ctx) {
    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // Text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }

  return canvas.toDataURL();
};