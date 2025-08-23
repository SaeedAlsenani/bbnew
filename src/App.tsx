import React, { useState, useEffect, useMemo } from 'react';
import BubbleCanvas from './components/BubbleCanvas';
import GiftModal from './components/GiftModal';

// SVG Icons (kept as is)
const LuEye = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const LuChevronUp = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const LuChevronDown = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

// واجهة Gift الرئيسية - تستخدم min_price_ton و min_price_usd
interface Gift {
  id: string;
  model_name: string;
  variant_name?: string;
  min_price_ton: number; // التسمية المستخدمة في الواجهة الرئيسية
  min_price_usd: number; // التسمية المستخدمة في الواجهة الرئيسية
  image: string;
  name: string;
  symbol: string;
  market_cap: number;
  current_price: number;
  price_change_percentage_24h?: number;
  isBot?: boolean;
}

// واجهة للاستجابة من /min_gift - تستخدم price_ton و price_usd
interface MinGiftResponse {
  min_price_gift?: {
    id: string;
    name: string;
    price_ton: number; // التسمية المستخدمة في استجابة API
    price_usd: number; // التسمية المستخدمة في استجابة API
    image: string;
  };
  ton_price: number;
}

const App = () => {
    const [giftsData, setGiftsData] = useState<Gift[]>([]);
    const [overallMinGift, setOverallMinGift] = useState<Gift | null>(null);
    const [tonPrice, setTonPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
    const [sortMethod, setSortMethod] = useState<'random' | 'price'>('random');
    const [selectedTimeframe, setSelectedTimeframe] = useState('Day');
    const [selectedBubbleData, setSelectedBubbleData] = useState<Gift | null>(null);

    const API_BASE_URL = '/api';

    const fetchGiftsData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [minGiftResponse, allGiftsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/min_gift?pretty=true`),
                fetch(`${API_BASE_URL}/gifts?sort_by=min_price_usd_asc&pretty=true`)
            ]);

            if (!minGiftResponse.ok || !allGiftsResponse.ok) {
                throw new Error(`خطأ HTTP! الحالة: ${minGiftResponse.status}/${allGiftsResponse.status}`);
            }

            // معالجة استجابة min_gift - نستخدم الواجهة الجديدة
            const minGiftJson: MinGiftResponse = await minGiftResponse.json();
            console.log('API /min_gift response:', minGiftJson);

            if (!minGiftJson || !minGiftJson.min_price_gift) {
                throw new Error('تنسيق استجابة غير صالح من API');
            }

            if (minGiftJson.min_price_gift) {
                 // تحويل البيانات من price_ton/price_usd إلى min_price_ton/min_price_usd
                 setOverallMinGift({
                    id: minGiftJson.min_price_gift.id || 'overall_min',
                    name: minGiftJson.min_price_gift.name,
                    model_name: minGiftJson.min_price_gift.name,
                    min_price_ton: minGiftJson.min_price_gift.price_ton, // تحويل price_ton إلى min_price_ton
                    min_price_usd: minGiftJson.min_price_gift.price_usd, // تحويل price_usd إلى min_price_usd
                    image: minGiftJson.min_price_gift.image,
                    symbol: minGiftJson.min_price_gift.name.substring(0, 3).toUpperCase(),
                    market_cap: minGiftJson.min_price_gift.price_usd,
                    current_price: minGiftJson.min_price_gift.price_usd,
                    price_change_percentage_24h: Math.random() > 0.5 ? Math.random() * 10 : Math.random() * -10
                });
            }
            setTonPrice(minGiftJson.ton_price);

            // معالجة استجابة gifts - البيانات هنا تستخدم min_price_ton و min_price_usd بالفعل
            const allGiftsJson = await allGiftsResponse.json();
            console.log('API /gifts response:', allGiftsJson);
            
            const transformedGifts: Gift[] = allGiftsJson.map((gift: any) => ({
                id: gift.model_name,
                model_name: gift.model_name,
                name: gift.model_name,
                min_price_ton: gift.min_price_ton, // بالفعل min_price_ton
                min_price_usd: gift.min_price_usd, // بالفعل min_price_usd
                image: gift.image,
                symbol: gift.model_name.substring(0, 3).toUpperCase(),
                market_cap: gift.min_price_usd,
                current_price: gift.min_price_usd,
                price_change_percentage_24h: Math.random() > 0.5 ? 
                    Math.random() * 10 : 
                    Math.random() * -10
            }));
            
            setGiftsData(transformedGifts);
            setSelectedGifts(transformedGifts.map(g => g.id));

        } catch (err: any) {
            console.error("Failed to fetch gift data:", err);
            setError(`فشل في جلب بيانات الهدايا: ${err.message}. يرجى التأكد من تشغيل API الخاص بك على ${API_BASE_URL}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGiftsData();
        const interval = setInterval(fetchGiftsData, 300000);
        return () => clearInterval(interval);
    }, []);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100 font-sans">
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');`}
                </style>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-300 mx-auto"></div>
                    <p className="mt-4 text-xl">جاري تحميل بيانات الهدايا...</p>
                    <p className="text-sm text-gray-300">تأكد من تشغيل API الخاص بك على {API_BASE_URL}</p>
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
                        الرجاء التأكد من أن الـ API الخاص بـ physbubble-bot يعمل ويستجيب على العنوان:
                        <br/><code className="text-yellow-200">{API_BASE_URL}</code>
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
