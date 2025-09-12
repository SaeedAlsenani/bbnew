// src/App.tsx - التعديلات الرئيسية
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BubbleCanvas from './components/BubbleCanvas';
import GiftModal from './components/GiftModal';
import { fetchCachedGiftPrices, fetchGiftPrices, fetchCachedCollections, fetchCollections } from './services/api'; // استيراد دوال الخدمة

// SVG Icons (تبقى كما هي)
const LuEye = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const LuChevronUp = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const LuChevronDown = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

// واجهة Gift الرئيسية
interface Gift {
  id: string;
  model_name: string;
  variant_name?: string;
  min_price_ton: number;
  min_price_usd: number;
  image: string;
  name: string;
  symbol: string;
  market_cap: number;
  current_price: number;
  price_change_percentage_24h?: number;
  isBot?: boolean;
}

// قائمة المجموعات الافتراضية كاحتياطي
const FALLBACK_COLLECTIONS = [
  "Plush Pepe", "Eternal Candle", "Snoop Dogg", "Jingle Bells", "Pet Snake",
  "Tama Gadget", "Lunar Snake", "Snow Mittens", "Witch Hat", "Lol Pop",
  "Spy Agaric", "Bunny Muffin", "Low Rider", "Whip Cupcake", "Berry Box",
  "Swag Bag", "Precious Peach", "Light Sword", "Durov's Cap", "Bow Tie",
  "Candy Cane", "Heroic Helmet", "Sleigh Bell", "Snake Box", "Neko Helmet",
  "Diamond Ring", "Sakura Flower", "Westside Sign", "Evil Eye", "Record Player",
  "Skull Flower", "Easter Egg", "B-Day Candle", "Desk Calendar", "Star Notepad",
  "Joyful Bundle", "Plush Pepe", "Eternal Candle", "Snoop Dogg", "Sharp Tongue",
  "Snow Globe", "Holiday Drink", "Flying Broom", "Big Year", "Hypno Lollipop",
  "Genie Lamp", "Bonded Ring", "Spiced Wine", "Snoop Cigar", "Xmas Stocking",
  "Homemade Cake", "Toy Bear", "Vintage Cigar", "Signet Ring", "Gem Signet",
  "Lush Bouquet", "Santa Hat", "Winter Wreath", "Nail Bracelet", "Ginger Cookie",
  "Perfume Bottle", "Crystal Ball", "Mini Oscar", "Jelly Bunny", "Jester Hat",
  "Cookie Heart", "Jack-in-the-Box", "Hanging Star", "Trapped Heart", "Heart Locket",
  "Magic Potion", "Mad Pumpkin", "Party Sparkler", "Cupid Charm", "Kissed Frog",
  "Loot Bag", "Eternal Rose", "Love Candle", "Electric Skull", "Valentine Box",
  "Hex Pot", "Swiss Watch", "Top Hat", "Scared Cat", "Love Potion", "Astral Shard",
  "Ion Gem", "Voodoo Doll", "Restless Jar"
];

const App = () => {
    const [giftsData, setGiftsData] = useState<Gift[]>([]);
    const [overallMinGift, setOverallMinGift] = useState<Gift | null>(null);
    const [tonPrice, setTonPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collectionsError, setCollectionsError] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
    const [sortMethod, setSortMethod] = useState<'random' | 'price'>('random');
    const [selectedTimeframe, setSelectedTimeframe] = useState('Day');
    const [selectedBubbleData, setSelectedBubbleData] = useState<Gift | null>(null); 
    const [collections, setCollections] = useState<string[]>([]);
    const [dataSource, setDataSource] = useState<'cache' | 'live' | 'stale'>('cache'); // تتبع مصدر البيانات

    // جلب قائمة المجموعات من API
    const fetchCollectionsData = useCallback(async () => {
        try {
            setCollectionsLoading(true);
            setCollectionsError(null);
            
            let collectionsData;
            try {
                // محاولة استخدام الكاش أولاً للحصول على استجابة سريعة
                console.log('🔍 جلب قائمة المجموعات من الكاش...');
                const cachedResponse = await fetchCachedCollections();
                collectionsData = cachedResponse.collections;
                console.log('✅ تم جلب المجموعات من الكاش بنجاح:', collectionsData.length);
                setDataSource('cache');
            } catch (cacheError) {
                console.warn('⚠️ فشل جلب المجموعات من الكاش، جاري المحاولة بالطريقة العادية', cacheError);
                const liveResponse = await fetchCollections();
                collectionsData = liveResponse.collections;
                setDataSource(liveResponse.is_stale ? 'stale' : 'live');
            }
            
            if (collectionsData && collectionsData.length > 0) {
                const collectionNames = collectionsData.map((col: any) => col.name);
                setCollections(collectionNames);
                console.log('تم جلب المجموعات بنجاح:', collectionNames.length);
            } else {
                // استخدام القائمة الافتراضية إذا كانت الاستجابة فارغة
                console.warn('استجابة API للمجموعات فارغة، استخدام القائمة الافتراضية');
                setCollections(FALLBACK_COLLECTIONS);
            }
            
        } catch (err: any) {
            console.error("فشل في جلب قائمة المجموعات:", err);
            setCollectionsError(`فشل في جلب قائمة المجموعات: ${err.message}`);
            
            // استخدام القائمة الافتراضية كاحتياطي في حالة الخطأ
            setCollections(FALLBACK_COLLECTIONS);
            
        } finally {
            setCollectionsLoading(false);
        }
    }, []);

    const fetchGiftsData = useCallback(async (useCache: boolean = true) => {
        if (collections.length === 0) return;

        try {
            setLoading(true);
            setError(null);

            let apiData;
            let dataSource: 'cache' | 'live' | 'stale' = 'cache';
            
            if (useCache) {
                // محاولة استخدام الكاش أولاً للحصول على استجابة سريعة
                try {
                    console.log('🔍 جلب الهدايا من الكاش...');
                    apiData = await fetchCachedGiftPrices(collections);
                    console.log('✅ تم جلب الهدايا من الكاش بنجاح:', apiData.gifts.length);
                    dataSource = apiData.is_stale ? 'stale' : 'cache';
                } catch (cacheError) {
                    console.warn('⚠️ فشل جلب الهدايا من الكاش، جاري المحاولة بالطريقة العادية', cacheError);
                    apiData = await fetchGiftPrices(collections);
                    dataSource = apiData.is_stale ? 'stale' : 'live';
                }
            } else {
                // الطريقة العادية مع تحديث خلفي
                console.log('🔄 جلب بيانات محدثة من الخادم...');
                apiData = await fetchGiftPrices(collections);
                dataSource = apiData.is_stale ? 'stale' : 'live';
            }

            setDataSource(dataSource);
            console.log('API response:', apiData);

            // محاكاة هيكل البيانات القديم من API الجديد
            const mockMinGiftResponse = {
                min_price_gift: apiData.gifts && apiData.gifts.length > 0 ? {
                    id: apiData.gifts[0].id,
                    name: apiData.gifts[0].name,
                    price_ton: apiData.gifts[0].price_ton,
                    price_usd: apiData.gifts[0].price_usd,
                    image: apiData.gifts[0].image
                } : undefined,
                ton_price: apiData.ton_price,
                timestamp: apiData.timestamp,
                last_updated: new Date().toISOString(),
                _sort_order: "min_price_usd_asc",
                total_models: apiData.total_items || 0,
                success_rate: apiData.success_rate || "100%"
            };

            const mockAllGiftsResponse = {
                gift_models_min_prices: apiData.gifts ? apiData.gifts.map((gift: any) => ({
                    model_name: gift.collection || gift.model_name || 'Unknown',
                    min_price_ton: gift.price_ton,
                    min_price_usd: gift.price_usd,
                    image: gift.image,
                    variant_id: gift.id || gift.variant_id,
                    variant_name: gift.name || gift.variant_name,
                    is_valid: gift.is_valid !== undefined ? gift.is_valid : true
                })) : [],
                ton_price: apiData.ton_price,
                timestamp: apiData.timestamp,
                last_updated: apiData.last_updated,
                _sort_order: "min_price_usd_asc",
                total_models: apiData.total_items || 0,
                success_rate: apiData.success_rate || "100%"
            };

            // معالجة استجابة min_gift
            console.log('Mock Min Gift response:', mockMinGiftResponse);

            if (mockMinGiftResponse && mockMinGiftResponse.min_price_gift) {
                setOverallMinGift({
                    id: mockMinGiftResponse.min_price_gift.id || 'overall_min',
                    name: mockMinGiftResponse.min_price_gift.name || 'أرخص هدية',
                    model_name: mockMinGiftResponse.min_price_gift.name || 'أرخص هدية',
                    min_price_ton: mockMinGiftResponse.min_price_gift.price_ton,
                    min_price_usd: mockMinGiftResponse.min_price_gift.price_usd,
                    image: mockMinGiftResponse.min_price_gift.image || 'https://placehold.co/60x60/333/FFF?text=Gift',
                    symbol: (mockMinGiftResponse.min_price_gift.name || 'ARG').substring(0, 3).toUpperCase(),
                    market_cap: mockMinGiftResponse.min_price_gift.price_usd,
                    current_price: mockMinGiftResponse.min_price_gift.price_usd,
                    price_change_percentage_24h: Math.random() > 0.5 ? Math.random() * 10 : Math.random() * -10
                });
            } else {
                setOverallMinGift(null);
            }
            setTonPrice(mockMinGiftResponse.ton_price);

            // معالجة استجابة models
            console.log('Mock All Gifts response:', mockAllGiftsResponse);
            
            const transformedGifts: Gift[] = mockAllGiftsResponse.gift_models_min_prices
                .filter((gift: any) => gift.is_valid)
                .map((gift: any) => ({
                    id: gift.variant_id || gift.model_name,
                    model_name: gift.model_name,
                    variant_name: gift.variant_name,
                    name: gift.variant_name || gift.model_name,
                    min_price_ton: gift.min_price_ton,
                    min_price_usd: gift.min_price_usd,
                    image: gift.image || 'https://placehold.co/60x60/333/FFF?text=Gift',
                    symbol: (gift.model_name || 'Unknown').substring(0, 3).toUpperCase(),
                    market_cap: gift.min_price_usd,
                    current_price: gift.min_price_usd,
                    price_change_percentage_24h: Math.random() > 0.5 ? 
                        Math.random() * 10 : 
                        Math.random() * -10
                }));
            
            setGiftsData(transformedGifts);
            setSelectedGifts(transformedGifts.map(g => g.id));

        } catch (err: any) {
            console.error("فشل في جلب بيانات الهدايا:", err);
            setError(`فشل في جلب بيانات الهدايا: ${err.message}. يرجى التأكد من أن الـ API يعمل بشكل صحيح.`);
        } finally {
            setLoading(false);
        }
    }, [collections]);

    useEffect(() => {
        fetchCollectionsData();
    }, [fetchCollectionsData]);

    useEffect(() => {
        if (collections.length > 0 && !collectionsLoading) {
            // جلب البيانات من الكاش أولاً لعرض سريع
            fetchGiftsData(true);
            
            const interval = setInterval(() => {
                // تحديث البيانات في الخلفية
                fetchGiftsData(false);
            }, 300000); // 5 دقائق
            
            return () => clearInterval(interval);
        }
    }, [fetchGiftsData, collections, collectionsLoading]);

    const filteredGifts = useMemo(() => 
        giftsData.filter(gift => selectedGifts.includes(gift.id)),
        [giftsData, selectedGifts]
    );

    const handleFilterChange = (giftId: string) => {
        setSelectedGifts(prevSelected => 
            prevSelected.includes(giftId)
                ? prevSelected.filter(id => id !== giftId)
                : [...prevSelected, giftId]
        );
    };

    const handleTimeframeChange = (timeframe: string) => {
        setSelectedTimeframe(timeframe);
    };

    const upCount = giftsData.filter(d => d.price_change_percentage_24h && d.price_change_percentage_24h > 0).length;
    const downCount = giftsData.filter(d => d.price_change_percentage_24h && d.price_change_percentage_24h < 0).length;

    // حالة التحميل للمجموعات
    if (collectionsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100 font-sans">
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');`}
                </style>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-300 mx-auto"></div>
                    <p className="mt-4 text-xl">جاري تحميل قائمة المجموعات...</p>
                </div>
            </div>
        );
    }

    if (collectionsError) {
        return (
            <div className="flex items-center justify-center h-screen bg-red-800 text-white font-sans p-4">
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');`}
                </style>
                 <div className="text-center bg-red-900 p-6 rounded-lg shadow-xl">
                    <p className="text-xl font-bold mb-4">خطأ في جلب قائمة المجموعات:</p>
                    <p>{collectionsError}</p>
                    <p className="mt-4 text-sm text-red-200">
                        تم استخدام قائمة افتراضية كاحتياطي.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100 font-sans">
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');`}
                </style>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-300 mx-auto"></div>
                    <p className="mt-4 text-xl">جاري تحميل بيانات الهدايا...</p>
                    <p className="text-sm text-gray-400 mt-2">يتم استخدام البيانات المخبأة لأسرع تجربة</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-red-800 text-white font-sans p-4">
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');`}
                </style>
                 <div className="text-center bg-red-900 p-6 rounded-lg shadow-xl">
                    <p className="text-xl font-bold mb-4">خطأ في جلب البيانات:</p>
                    <p>{error}</p>
                    <p className="mt-4 text-sm text-red-200">
                        الرجاء التأكد من أن الـ API يعمل بشكل صحيح.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 h-screen text-gray-100 flex flex-col p-2 font-sans">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                    body { font-family: 'Inter', sans-serif; }
                `}
            </style>
            
            <div className="w-full flex items-center justify-between p-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 mb-2">
                <div className="flex items-center space-x-1 md:space-x-2">
                    <div className="relative">
                        <button 
                            className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-1 px-2 rounded-lg flex items-center text-xs md:text-sm transition-colors duration-200"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <LuEye className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden md:block ml-1">Filter</span>
                        </button>
                        {isFilterOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 md:w-64 h-80 overflow-y-auto bg-gray-700 rounded-lg shadow-lg z-50 p-2 border border-gray-600">
                                {giftsData.map((gift) => (
                                    <div key={gift.id} className="flex items-center p-2 hover:bg-gray-600 rounded-md cursor-pointer transition-colors duration-150">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedGifts.includes(gift.id)}
                                            onChange={() => handleFilterChange(gift.id)}
                                            className="form-checkbox h-4 w-4 text-green-500 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
                                        />
                                        <span className="ml-2 text-gray-200 text-sm">{gift.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center text-green-400 font-bold text-xs md:text-sm">
                        <LuChevronUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span>{upCount}</span>
                    </div>
                    <div className="flex items-center text-red-400 font-bold text-xs md:text-sm">
                        <LuChevronDown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span>{downCount}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-1 md:space-x-2">
                    <button 
                        className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm transition-colors duration-200 ${selectedTimeframe === 'Day' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        onClick={() => handleTimeframeChange('Day')}
                    >
                        Day
                    </button>
                    <button 
                        className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm transition-colors duration-200 ${selectedTimeframe === 'Week' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        onClick={() => handleTimeframeChange('Week')}
                    >
                        Week
                    </button>
                    <button 
                        className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm transition-colors duration-200 ${selectedTimeframe === 'All time' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        onClick={() => handleTimeframeChange('All')}
                    >
                        All
                    </button>
                    <button 
                        className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm transition-colors duration-200 ${sortMethod === 'price' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        onClick={() => setSortMethod(sortMethod === 'price' ? 'random' : 'price')}
                    >
                        {sortMethod === 'price' ? 'Default Sort' : 'Sort by Price'} 
                    </button>
                </div>
            </div>
            
            {/* مؤشر مصدر البيانات */}
            <div className="w-full text-center mb-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                    dataSource === 'cache' ? 'bg-green-500 text-white' :
                    dataSource === 'stale' ? 'bg-yellow-500 text-black' :
                    'bg-blue-500 text-white'
                }`}>
                    {dataSource === 'cache' ? 'بيانات مخبأة ✓' :
                     dataSource === 'stale' ? 'بيانات قديمة ⚡' :
                     'بيانات حية 🔄'}
                </span>
            </div>

            <BubbleCanvas
                cryptoData={filteredGifts}
                loading={loading}
                selectedCryptos={selectedGifts}
                sortMethod={sortMethod === 'price' ? 'marketCap' : 'random'}
                onBubbleClick={setSelectedBubbleData}
            />

            {selectedBubbleData && (
                <GiftModal 
                    bubbleData={selectedBubbleData}
                    onClose={() => setSelectedBubbleData(null)} 
                />
            )}

            <div className="flex flex-col sm:flex-row justify-around items-center bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-3 mt-2 text-sm md:text-base">
                {tonPrice !== null && (
                    <div className="text-center flex-1 p-1">
                        <p className="text-gray-400">سعر TON الحالي:</p>
                        <p className="text-green-400 font-bold text-lg">${tonPrice.toFixed(4)}</p>
                    </div>
                )}
                {overallMinGift && (
                    <div className="text-center flex-1 p-1 mt-2 sm:mt-0">
                        <p className="text-gray-400">أرخص هدية:</p>
                        <p className="text-yellow-400 font-bold text-lg">{overallMinGift.name}</p>
                        <p className="text-blue-300">(${overallMinGift.min_price_usd.toFixed(2)} USD)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
