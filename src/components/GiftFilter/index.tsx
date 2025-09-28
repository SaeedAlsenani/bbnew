import React from 'react';
import { Gift } from '../../interfaces/gift.interface';
import GiftCardSkeleton from '../GiftCardSkeleton';

interface GiftFilterProps {
  gifts: Gift[];
  selectedGifts: string[];
  onFilterChange: (giftId: string) => void;
  isGiftLoaded: (gift: Gift) => boolean;
  isOpen: boolean;
}

const LuEye = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;

export const GiftFilter: React.FC<GiftFilterProps> = ({
  gifts,
  selectedGifts,
  onFilterChange,
  isGiftLoaded,
  isOpen
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-56 md:w-64 h-80 overflow-y-auto bg-gray-700 rounded-lg shadow-lg z-50 p-2 border border-gray-600">
      {gifts.map((gift) => (
        <div key={gift.id}>
          {isGiftLoaded(gift) ? (
            <div className="flex items-center p-2 hover:bg-gray-600 rounded-md cursor-pointer transition-colors duration-150">
              <input 
                type="checkbox" 
                checked={selectedGifts.includes(gift.id)}
                onChange={() => onFilterChange(gift.id)}
                className="form-checkbox h-4 w-4 text-green-500 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
              />
              <img 
                src={gift.image} 
                alt={gift.name}
                className="w-6 h-6 rounded-full ml-2 object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/24x24/333/FFF?text=G';
                }}
              />
              <span className="ml-2 text-gray-200 text-sm truncate" title={gift.name}>
                {gift.name}
              </span>
              {gift.min_price_usd > 0 && (
                <span className="ml-auto text-green-400 text-xs">
                  ${gift.min_price_usd.toFixed(2)}
                </span>
              )}
            </div>
          ) : (
            <GiftCardSkeleton 
              name={gift.name} 
              isError={!gift.isLoading}
            />
          )}
        </div>
      ))}
    </div>
  );
};
