import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';

export interface MediaResponse {
  id: number;
  name: string;
  small_url: string;
  medium_url: string;
  url: string;
  disk: string;
}

export interface MediaUploadOptions {
  collectionName: string;
  onSuccess?: (mediaId: number) => void;
  onError?: (error: unknown) => void;
}

export const uploadMedia = async (
  file: File,
  options: MediaUploadOptions
): Promise<number> => {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('collection_name', options.collectionName);

  try {
    const response = await axiosInstance.post<{ data: MediaResponse[] }>('/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.data.data && response.data.data.length > 0) {
      const mediaId = response.data.data[0].id;
      options.onSuccess?.(mediaId);
      return mediaId;
    } else {
      throw new Error('No media ID returned from server');
    }
  } catch (error) {
    console.error('Media upload error:', error);
    options.onError?.(error);
    throw error;
  }
};

export const validateMediaFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    return {
      isValid: false,
      error: 'يرجى اختيار ملف صورة أو PDF فقط'
    };
  }

  if (file.size > 3 * 1024 * 1024) {
    return {
      isValid: false,
      error: 'حجم الملف يجب أن لا يتجاوز 3 ميجابايت'
    };
  }

  return { isValid: true };
};

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