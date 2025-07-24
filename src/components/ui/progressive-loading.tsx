import React from 'react';
import { LoadingSpinner } from './loading-spinner';

interface ProgressiveLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showSpinner?: boolean;
  className?: string;
}

export function ProgressiveLoading({ 
  isLoading, 
  children, 
  fallback,
  showSpinner = true,
  className = ""
}: ProgressiveLoadingProps) {
  if (isLoading && showSpinner) {
    return (
      <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
        {fallback || (
          <div className="text-center">
            <LoadingSpinner size="md" className="mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

interface SkeletonLoadingProps {
  count?: number;
  className?: string;
}

export function SkeletonLoading({ count = 3, className = "" }: SkeletonLoadingProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

interface ContentLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeletonCount?: number;
  skeletonClassName?: string;
  showSkeleton?: boolean;
}

export function ContentLoader({ 
  isLoading, 
  children, 
  skeletonCount = 3,
  skeletonClassName = "",
  showSkeleton = true
}: ContentLoaderProps) {
  if (isLoading && showSkeleton) {
    return <SkeletonLoading count={skeletonCount} className={skeletonClassName} />;
  }

  return <>{children}</>;
} 