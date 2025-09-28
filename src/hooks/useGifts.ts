import { useState, useCallback } from 'react';
import { Gift } from '../interfaces/gift.interface';

export const useGifts = (collections: string[]) => {
  const [giftsData, setGiftsData] = useState<Gift[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGiftsData = useCallback(async (useCache: boolean = true) => {
    if (collections.length === 0) return;

    try {
      setLoading(true);

      const placeholderGifts = collections.map(collection => ({
        id: `placeholder_${collection}`,
        model_name: collection,
        name: collection,
        min_price_ton: 0,
        min_price_usd: 0,
        image: '',
        symbol: collection.substring(0, 3).toUpperCase(),
        market_cap: 0,
        current_price: 0,
        is_valid: false,
        isLoading: true,
        isPlaceholder: true
      }));

      setGiftsData(placeholderGifts);
      setSelectedGifts(placeholderGifts.map(g => g.id));

      let apiData;
      
      if (useCache) {
        try {
          const { fetchCachedGiftPrices } = await import('../services/api');
          apiData = await fetchCachedGiftPrices(collections);
          console.log('✅ تم جلب الهدايا من الكاش بنجاح:', apiData.gifts.length);
        } catch (cacheError) {
          console.warn('فشل جلب الهدايا من الكاش، جاري المحاولة بالطريقة العادية', cacheError);
          const { fetchGiftPrices } = await import('../services/api');
          apiData = await fetchGiftPrices(collections);
        }
      } else {
        const { fetchGiftPrices } = await import('../services/api');
        apiData = await fetchGiftPrices(collections);
      }

      const transformedGifts: Gift[] = apiData.gifts;

      const finalGifts = collections.map(collection => {
        const realGifts = transformedGifts.filter(g => 
          g.model_name === collection && g.is_valid && g.min_price_usd > 0
        );
        
        if (realGifts.length > 0) {
          return realGifts.reduce((min, gift) => 
            gift.min_price_usd < min.min_price_usd ? gift : min
          );
        }
        
        return {
          id: `placeholder_${collection}`,
          model_name: collection,
          name: collection,
          min_price_ton: 0,
          min_price_usd: 0,
          image: `https://placehold.co/100x100/666/FFF?text=${collection.substring(0,3)}`,
          symbol: collection.substring(0, 3).toUpperCase(),
          market_cap: 1000000,
          current_price: 0,
          price_change_percentage_24h: 0,
          is_valid: false,
          isLoading: true,
          isPlaceholder: true
        };
      });

      setGiftsData(finalGifts);
      setSelectedGifts(finalGifts.map(g => g.id));

    } catch (err: any) {
      console.error("فشل في جلب بيانات الهدايا:", err);
      
      const errorPlaceholders = collections.map(collection => ({
        id: `error_${collection}`,
        model_name: collection,
        name: collection,
        min_price_ton: 0,
        min_price_usd: 0,
        image: '',
        symbol: collection.substring(0, 3).toUpperCase(),
        market_cap: 0,
        current_price: 0,
        is_valid: false,
        isLoading: false,
        isPlaceholder: true
      }));
      
      setGiftsData(errorPlaceholders);
      setSelectedGifts(errorPlaceholders.map(g => g.id));
    } finally {
      setLoading(false);
    }
  }, [collections]);

  const isGiftLoaded = useCallback((gift: Gift) => {
    return gift.is_valid && gift.min_price_usd > 0 && !gift.isLoading;
  }, []);

  const handleFilterChange = useCallback((giftId: string) => {
    setSelectedGifts(prevSelected => 
      prevSelected.includes(giftId)
        ? prevSelected.filter(id => id !== giftId)
        : [...prevSelected, giftId]
    );
  }, []);

  return {
    giftsData,
    selectedGifts,
    loading,
    fetchGiftsData,
    isGiftLoaded,
    handleFilterChange
  };
};
