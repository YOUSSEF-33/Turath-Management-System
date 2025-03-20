export const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com');
};

export const getGoogleDriveFileId = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

export const getGoogleDriveDirectUrl = (url: string): string => {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

export const isImageFile = (url: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

export const getMediaType = (url: string): 'image' | 'file' => {
  if (isImageFile(url)) return 'image';
  return 'file';
}; 