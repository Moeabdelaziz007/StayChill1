import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  generateSourceSet, 
  getLowQualityPlaceholder, 
  createPlaceholderDataUrl, 
  parseImageUrl,
  detectImageSupport,
  IMAGE_QUALITY
} from '@/lib/image-optimizer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  quality?: number;
  placeholder?: 'blur' | 'empty' | 'none';
  placeholderColor?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente optimizado para imágenes que implementa carga perezosa,
 * placeholders, y optimización de formato
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  className = '',
  priority = false,
  loading = 'lazy',
  quality = IMAGE_QUALITY,
  placeholder = 'blur',
  placeholderColor = '#f0f0f0',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  
  // Manejar error de carga de imagen
  const handleError = () => {
    setError(true);
    if (onError) onError();
  };
  
  // Manejar carga exitosa de imagen
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };
  
  // Generar srcSet para diferentes tamaños
  const srcSet = src ? generateSourceSet(src) : '';
  
  // Determinar el placeholder basado en las opciones
  const blurDataUrl = placeholder === 'blur' 
    ? getLowQualityPlaceholder(src)
    : placeholder === 'empty' 
      ? createPlaceholderDataUrl(placeholderColor) 
      : undefined;
  
  // Usar efecto para actualizar src basado en las capacidades del navegador
  useEffect(() => {
    // Si tenemos un error, no intentar actualizar más el src
    if (error) return;
    
    // Intentar optimizar el formato de la imagen
    const { isExternal } = parseImageUrl(src);
    if (!isExternal) {
      const support = detectImageSupport();
      
      if (support.webp) {
        // Si el navegador soporta WebP, usar ese formato
        setImgSrc(`${src}?format=webp&q=${quality}`);
      } else {
        // De lo contrario, usar el formato original con la calidad especificada
        setImgSrc(`${src}?q=${quality}`);
      }
    }
  }, [src, error, quality]);
  
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{ 
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
      }}
    >
      {/* Placeholder mientras la imagen carga */}
      {placeholder !== 'none' && !isLoaded && !error && (
        <div 
          className="absolute inset-0 bg-cover bg-center animate-pulse"
          style={{ 
            backgroundImage: blurDataUrl ? `url(${blurDataUrl})` : undefined,
            backgroundColor: placeholderColor,
          }}
        />
      )}
      
      {/* Imagen */}
      <img
        src={imgSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          error ? 'hidden' : 'block'
        )}
      />
      
      {/* Fallback para errores */}
      {error && (
        <div 
          className="flex items-center justify-center w-full h-full bg-slate-200 dark:bg-slate-800"
          style={{ 
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : '200px',
          }}
        >
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {alt || 'Error al cargar la imagen'}
          </span>
        </div>
      )}
    </div>
  );
}