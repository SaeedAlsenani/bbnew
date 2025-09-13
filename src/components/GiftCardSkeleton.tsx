// src/components/GiftCardSkeleton.tsx
import React from 'react';

interface GiftCardSkeletonProps {
  name: string;
  isError?: boolean;
}

const GiftCardSkeleton: React.FC<GiftCardSkeletonProps> = ({ name, isError = false }) => {
  return (
    <div className={`flex items-center p-2 rounded-md cursor-pointer transition-colors duration-150 ${
      isError ? 'bg-red-100 border border-red-300' : 'bg-gray-100 animate-pulse'
    }`}>
      <div className="flex items-center">
        {/* صورة placeholder */}
        <div className={`w-6 h-6 rounded-full ${
          isError ? 'bg-red-300' : 'bg-gray-300'
        }`}></div>
        
        {/* نص placeholder */}
        <div className="ml-2">
          <div className={`text-sm ${
            isError ? 'text-red-600' : 'text-gray-400'
          }`}>
            {isError ? '❌ فشل التحميل' : name}
          </div>
          <div className={`text-xs ${
            isError ? 'text-red-500' : 'text-gray-300'
          }`}>
            {isError ? 'يرجى المحاولة لاحقاً' : 'جار التحميل...'}
          </div>
        </div>
      </div>
      
      {/* خانة الاختيار */}
      <input 
        type="checkbox" 
        disabled
        className="form-checkbox h-4 w-4 ml-auto bg-gray-200 border-gray-300 rounded"
      />
    </div>
  );
};

export default GiftCardSkeleton;
