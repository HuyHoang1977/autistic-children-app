// src/components/ui/OptimizedImage.tsx - Optimized Image Component
import React, { useState, useEffect } from 'react';
import { getImageUrl, getProxyImageUrl, trackImageLoad } from '../../utils/imageUtils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  useProxy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  placeholder?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder-image.jpg',
  useProxy = false,
  onLoad,
  onError,
  loading = 'lazy',
  placeholder = true
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadStartTime] = useState(Date.now());

  const maxRetries = 2;

  useEffect(() => {
    if (src) {
      setIsLoading(true);
      setHasError(false);
      setRetryCount(0);

      const imageUrl = useProxy ? getProxyImageUrl(src) : getImageUrl(src);
      setImageSrc(imageUrl);
    }
  }, [src, useProxy]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    trackImageLoad(imageSrc, loadStartTime);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);

    // Try proxy as fallback if direct access failed and not already using proxy
    if (!useProxy && retryCount === 0) {
      console.log('🔄 Direct image failed, trying proxy...');
      setImageSrc(getProxyImageUrl(src));
      setRetryCount(1);
      return;
    }

    // Try fallback image if not already using it
    if (imageSrc !== fallbackSrc && retryCount < maxRetries) {
      console.log('🔄 Trying fallback image...');
      setImageSrc(fallbackSrc);
      setRetryCount(prev => prev + 1);
      return;
    }

    // All attempts failed
    setHasError(true);
    onError?.();
  };

  // Loading placeholder
  if (isLoading && placeholder) {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-gray-500">Image not available</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        display: isLoading ? 'none' : 'block'
      }}
    />
  );
};

export default OptimizedImage;