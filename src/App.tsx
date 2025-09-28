// src/App.tsx - التعديلات الرئيسية
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BubbleCanvas from './components/BubbleCanvas';
import GiftModal from './components/GiftModal';
import Portfolio from './components/Portfolio'; // المكون الجديد
import { fetchCachedGiftPrices, fetchGiftPrices, fetchCachedCollections, fetchCollections } from './services/api';
import GiftCardSkeleton from './components/GiftCardSkeleton';

// SVG Icons (إضافة أيقونة المحفظة)
const LuEye = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const LuChevronUp = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const LuChevronDown = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const LuWallet = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>;

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
  is_valid?: boolean;
  isLoading?: boolean;
  isPlaceholder?: boolean;
}

// واجهة عنصر المحفظة
interface PortfolioItem {
  id: string;
  giftId: string;
  giftName: string;
  giftImage: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: Date;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

// قائمة المجموعات الافتراضية كاحتياطي
const FALLBACK_COLLECTIONS = [
  "Plush Pepe", "Eternal Candle", "Snoop Dogg", "Jingle Bells", "Pet Snake",
  // ... بقية القائمة كما هي
];

// أنواع التبويبات
type TabType = 'market' | 'portfolio';

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
    const [dataSource, setDataSource] = useState<'cache' | 'live' | 'stale' | 'placeholder'>('cache');
    const [hasPlaceholderData, setHasPlaceholderData] = useState(false);
    
    // الحالة الجديدة للمحفظة
    const [activeTab, setActiveTab] = useState<TabType>('market');
    const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
    const [portfolioLoading, setPortfolioLoading] = useState(false);

    // جلب بيانات المحفظة من localStorage أو API
    const loadPortfolioData = useCallback(async () => {
        setPortfolioLoading(true);
        try {
            // محاكاة جلب بيانات المحفظة (يمكن استبدالها بـ API حقيقي)
            const savedPortfolio = localStorage.getItem('giftGraphsPortfolio');
            if (savedPortfolio) {
                const parsedData = JSON.parse(savedPortfolio);
                setPortfolioItems(parsedData);
            } else {
                // بيانات نموذجية للمحفظة
                const samplePortfolio: PortfolioItem[] = [
                    {
                        id: '1',
                        giftId: 'plush_pepe_1',
                        giftName: 'Plush Pepe',
                        giftImage: 'https://example.com/pepe.jpg',
                        quantity: 5,
                        purchasePrice: 15.50,
                        currentPrice: 18.75,
                        purchaseDate: new Date('2024-01-15'),
                        totalValue: 93.75,
                        profitLoss: 16.25,
                        profitLossPercentage: 21.0
                    },
                    {
                        id: '2',
                        giftId: 'eternal_candle_1',
                        giftName: 'Eternal Candle',
                        giftImage: 'https://example.com/candle.jpg',
                        quantity: 3,
                        purchasePrice: 25.00,
                        currentPrice: 28.50,
                        purchaseDate: new Date('2024-02-01'),
                        totalValue: 85.50,
                        profitLoss: 10.50,
                        profitLossPercentage: 14.0
                    }
                ];
                setPortfolioItems(samplePortfolio);
                localStorage.setItem('giftGraphsPortfolio', JSON.stringify(samplePortfolio));
            }
        } catch (error) {
            console.error('Error loading portfolio:', error);
        } finally {
            setPortfolioLoading(false);
        }
    }, []);

    // إضافة عنصر إلى المحفظة
    const addToPortfolio = useCallback((gift: Gift, quantity: number, purchasePrice: number) => {
        const newItem: PortfolioItem = {
            id: Date.now().toString(),
            giftId: gift.id,
            giftName: gift.name,
            giftImage: gift.image,
            quantity,
            purchasePrice,
            currentPrice: gift.min_price_usd,
            purchaseDate: new Date(),
            totalValue: quantity * gift.min_price_usd,
            profitLoss: quantity * (gift.min_price_usd - purchasePrice),
            profitLossPercentage: ((gift.min_price_usd - purchasePrice) / purchasePrice) * 100
        };

        const updatedPortfolio = [...portfolioItems, newItem];
        setPortfolioItems(updatedPortfolio);
        localStorage.setItem('giftGraphsPortfolio', JSON.stringify(updatedPortfolio));
    }, [portfolioItems]);

    // إزالة عنصر من المحفظة
    const removeFromPortfolio = useCallback((itemId: string) => {
        const updatedPortfolio = portfolioItems.filter(item => item.id !== itemId);
        setPortfolioItems(updatedPortfolio);
        localStorage.setItem('giftGraphsPortfolio', JSON.stringify(updatedPortfolio));
    }, [portfolioItems]);

    // تحديث أسعار المحفظة بناءً على بيانات السوق الحالية
    const updatePortfolioPrices = useCallback(() => {
        const updatedPortfolio = portfolioItems.map(item => {
            const currentGift = giftsData.find(gift => gift.id === item.giftId);
            if (currentGift && currentGift.is_valid) {
                const currentPrice = currentGift.min_price_usd;
                const totalValue = item.quantity * currentPrice;
                const profitLoss = item.quantity * (currentPrice - item.purchasePrice);
                const profitLossPercentage = ((currentPrice - item.purchasePrice) / item.purchasePrice) * 100;
                
                return {
                    ...item,
                    currentPrice,
                    totalValue,
                    profitLoss,
                    profitLossPercentage
                };
            }
            return item;
        });
        
        setPortfolioItems(updatedPortfolio);
        localStorage.setItem('giftGraphsPortfolio', JSON.stringify(updatedPortfolio));
    }, [giftsData, portfolioItems]);

    // جلب قائمة المجموعات من API
    const fetchCollectionsData = useCallback(async () => {
        try {
            setCollectionsLoading(true);
            setCollectionsError(null);
            
            let collectionsData;
            try {
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
                console.warn('استجابة API للمجموعات فارغة، استخدام القائمة الافتراضية');
                setCollections(FALLBACK_COLLECTIONS);
            }
            
        } catch (err: any) {
            console.error("فشل في جلب قائمة المجموعات:", err);
            setCollectionsError(`فشل في جلب قائمة المجموعات: ${err.message}`);
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
            setHasPlaceholderData(false);

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
            let dataSourceType: 'cache' | 'live' | 'stale' | 'placeholder' = 'cache';
            
            if (useCache) {
                try {
                    apiData = await fetchCachedGiftPrices(collections);
                    dataSourceType = apiData.source === 'placeholder' ? 'placeholder' : 'cache';
                } catch (cacheError) {
                    apiData = await fetchGiftPrices(collections);
                    dataSourceType = apiData.source === 'placeholder' ? 'placeholder' : 'live';
                }
            } else {
                apiData = await fetchGiftPrices(collections);
                dataSourceType = apiData.source === 'placeholder' ? 'placeholder' : 'live';
            }

            setDataSource(dataSourceType);

            if (apiData.source === 'placeholder' || apiData.gifts.some((g: any) => 
                g.price_usd === 0 || g.min_price_usd === 0 || !g.is_valid)) {
                setHasPlaceholderData(true);
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

            const validGifts = transformedGifts.filter(g => g.is_valid && g.min_price_usd > 0);
            if (validGifts.length > 0) {
                const minGift = validGifts.reduce((min, gift) => 
                    gift.min_price_usd < min.min_price_usd ? gift : min
                );
                
                setOverallMinGift({
                    ...minGift,
                    id: minGift.id || 'overall_min',
                    name: minGift.name || 'أرخص هدية'
                });
            } else {
                setOverallMinGift(null);
            }
            
            setTonPrice(apiData.ton_price);

            // تحديث أسعار المحفظة بعد جلب البيانات الجديدة
            updatePortfolioPrices();

        } catch (err: any) {
            console.error("فشل في جلب بيانات الهدايا:", err);
            setError(`فشل في جلب بيانات الهدايا: ${err.message}`);
            setHasPlaceholderData(true);
            
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
    }, [collections, updatePortfolioPrices]);
  
    useEffect(() => {
        fetchCollectionsData();
        loadPortfolioData();
    }, [fetchCollectionsData, loadPortfolioData]);

    useEffect(() => {
        if (collections.length > 0 && !collectionsLoading) {
            fetchGiftsData(true);
            
            const interval = setInterval(() => {
                fetchGiftsData(false);
            }, 300000);
            
            return () => clearInterval(interval);
        }
    }, [fetchGiftsData, collections, collectionsLoading]);

    const filteredGifts = useMemo(() => 
        giftsData.filter(gift => selectedGifts.includes(gift.id)),
        [giftsData, selectedGifts]
    );

    const isGiftLoaded = (gift: Gift) => {
        return gift.is_valid && gift.min_price_usd > 0 && !gift.isLoading;
    };

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

    // إحصائيات المحفظة
    const portfolioStats = useMemo(() => {
        const totalValue = portfolioItems.reduce((sum, item) => sum + item.totalValue, 0);
        const totalInvestment = portfolioItems.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
        const totalProfitLoss = portfolioItems.reduce((sum, item) => sum + item.profitLoss, 0);
        const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

        return {
            totalValue,
            totalInvestment,
            totalProfitLoss,
            totalProfitLossPercentage
        };
    }, [portfolioItems]);

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

    return (
        <div className="bg-gray-900 h-screen text-gray-100 flex flex-col p-2 font-sans">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                    body { font-family: 'Inter', sans-serif; }
                `}
            </style>
            
            {/* شريط التبويبات */}
            <div className="w-full flex items-center justify-between p-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 mb-2">
                <div className="flex items-center space-x-1 md:space-x-2">
                    {/* زر السوق */}
                    <button 
                        className={`font-bold py-1 px-3 rounded-lg text-xs md:text-sm transition-colors duration-200 flex items-center ${
                            activeTab === 'market' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        }`}
                        onClick={() => setActiveTab('market')}
                    >
                        <LuEye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        السوق
                    </button>

                    {/* زر المحفظة */}
                    <button 
                        className={`font-bold py-1 px-3 rounded-lg text-xs md:text-sm transition-colors duration-200 flex items-center ${
                            activeTab === 'portfolio' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        }`}
                        onClick={() => setActiveTab('portfolio')}
                    >
                        <LuWallet className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        المحفظة
                        {portfolioItems.length > 0 && (
                            <span className="ml-1 bg-blue-600 text-xs rounded-full px-1.5 py-0.5">
                                {portfolioItems.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* عناصر التحكم الخاصة بكل تبويب */}
                <div className="flex items-center space-x-1 md:space-x-2">
                    {activeTab === 'market' ? (
                        <>
                            <div className="flex items-center text-green-400 font-bold text-xs md:text-sm">
                                <LuChevronUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                <span>{upCount}</span>
                            </div>
                            <div className="flex items-center text-red-400 font-bold text-xs md:text-sm">
                                <LuChevronDown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                <span>{downCount}</span>
                            </div>
                            
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
                                className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm transition-colors duration-200 ${sortMethod === 'price' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                                onClick={() => setSortMethod(sortMethod === 'price' ? 'random' : 'price')}
                            >
                                {sortMethod === 'price' ? 'Default Sort' : 'Sort by Price'} 
                            </button>
                        </>
                    ) : (
                        /* إحصائيات المحفظة */
                        <div className="flex items-center space-x-3 text-xs md:text-sm">
                            <div className="text-center">
                                <div className="text-gray-400">القيمة الإجمالية</div>
                                <div className={`font-bold ${portfolioStats.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${portfolioStats.totalValue.toFixed(2)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-400">الأرباح/الخسائر</div>
                                <div className={`font-bold ${portfolioStats.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {portfolioStats.totalProfitLoss >= 0 ? '+' : ''}{portfolioStats.totalProfitLoss.toFixed(2)} USD
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* محتوى التبويب النشط */}
            {activeTab === 'market' ? (
                <>
                    {/* فلتر الهدايا (يظهر فقط في تبويب السوق) */}
                    <div className="relative mb-2">
                        <button 
                            className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-1 px-2 rounded-lg flex items-center text-xs md:text-sm transition-colors duration-200"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <LuEye className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden md:block ml-1">Filter</span>
                        </button>
                        
                        {isFilterOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 md:w-64 h-80 overflow-y-auto bg-gray-700 rounded-lg shadow-lg z-50 p-2 border border-gray-600">
                                {filteredGifts.map((gift) => (
                                    <div key={gift.id}>
                                        {isGiftLoaded(gift) ? (
                                            <div className="flex items-center p-2 hover:bg-gray-600 rounded-md cursor-pointer transition-colors duration-150">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedGifts.includes(gift.id)}
                                                    onChange={() => handleFilterChange(gift.id)}
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
                        )}
                    </div>

                    {/* مؤشر مصدر البيانات */}
                    <div className="w-full text-center mb-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            dataSource === 'cache' ? 'bg-green-500 text-white' :
                            dataSource === 'stale' ? 'bg-yellow-500 text-black' :
                            dataSource === 'placeholder' ? 'bg-gray-500 text-white' :
                            'bg-blue-500 text-white'
                        }`}>
                            {dataSource === 'cache' ? 'بيانات مخبأة ✓' :
                             dataSource === 'stale' ? 'بيانات قديمة ⚡' :
                             dataSource === 'placeholder' ? 'بيانات وهمية ⏳' :
                             'بيانات حية 🔄'}
                        </span>
                        
                        {hasPlaceholderData && (
                            <div className="mt-1 text-xs text-yellow-300 bg-yellow-900/30 px-2 py-1 rounded">
                                ⚠️ بعض البيانات لا تزال قيد التحميل...
                            </div>
                        )}
                    </div>

                    {/* مخطط الفقاعات */}
                    <BubbleCanvas
                        cryptoData={filteredGifts}
                        loading={loading}
                        selectedCryptos={selectedGifts}
                        sortMethod={sortMethod === 'price' ? 'marketCap' : 'random'}
                        onBubbleClick={setSelectedBubbleData}
                        activeTab={activeTab}
                    />

                    {/* النافذة المنبثقة للهدية */}
                    {selectedBubbleData && (
                        <GiftModal 
                            bubbleData={selectedBubbleData}
                            onClose={() => setSelectedBubbleData(null)}
                            onAddToPortfolio={addToPortfolio}
                        />
                    )}

                    {/* معلومات السوق */}
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
                </>
            ) : (
                /* تبويب المحفظة */
                <Portfolio
                    items={portfolioItems}
                    loading={portfolioLoading}
                    onRemoveItem={removeFromPortfolio}
                    onUpdatePortfolio={updatePortfolioPrices}
                    stats={portfolioStats}
                />
            )}
        </div>
    );
};

export default App;
