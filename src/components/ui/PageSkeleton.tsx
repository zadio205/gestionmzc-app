import React from 'react';

interface PageSkeletonProps {
  title?: string;
  showStats?: boolean;
  showCards?: number;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ 
  title = "Chargement", 
  showStats = false,
  showCards = 0 
}) => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="h-4 bg-gray-100 rounded w-96"></div>
      </div>

      {/* Stats cards skeleton */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-300 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content cards skeleton */}
      {showCards > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(showCards)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageSkeleton;
