import React, { useState, useEffect, useMemo } from 'react';
import BubbleCanvas from './components/BubbleCanvas';
import GiftModal from './components/GiftModal';

// SVG Icons (kept as is)
const LuEye = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const LuChevronUp = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const LuChevronDown = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

// Define the Gift interface to match the API response structure from physbubble-bot
interface Gift {
  id: string; // المعرف الفريد من API الخاص بالبوت للمتغيرات، أو معرف مُنشأ للنماذج
  model_name: string; // Used for identifying the model in BubbleCanvas
  variant_name?: string; // اسم المتغير المحدد إذا كان متاحاً
  min_price_ton: number; // السعر بـ TON
  min_price_usd: number; // السعر بـ USD
  image: string; // رابط الصورة
  // الخصائص المطلوبة من BubbleCanvas (مُعينة من استجابة API البوت)
  name: string; // تم تغيير model_name إلى name لـ BubbleCanvas
  symbol: string; // سيتم استخدام model_name أو variant_name كرمز
  market_cap: number; // سيتم استخدام min_price_usd كـ market_cap للتحديد الحجمي
  current_price: number; // سيتم استخدام min_price_usd كـ current_price
  price_change_percentage_24h?: number; // محاكاة أو محسوبة إذا كانت متاحة من API
  isBot?: boolean; // للفقاعة الخاصة بالبوت
}

const App = () => {
    // State لتخزين جميع نماذج الهدايا المُجلبَة من /api/gifts
    const [giftsData, setGiftsData] = useState<Gift[]>([]);
    // State لتخزين أقل هدية整體ية المُجلبَة من /api/min_gift
    const [overallMinGift, setOverallMinGift] = useState<Gift | null>(null);
    // State لسعر TON من API
    const [tonPrice, setTonPrice] = useState<number | null>(null);
    // حالة التحميل لجلب البيانات
    const [loading, setLoading] = useState(true);
    // حالة الخطأ لعرض أخطاء الجلب
    const [error, setError] = useState<string | null>(null);
    // UI states (الفلاتر، طريقة الترتيب، الفقاعة المحددة)
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedGifts, setSelectedGifts] = useState<string[]>([]); // يتتبع معرفات الهدايا المحددة للتصفية
    const [sortMethod, setSortMethod] = useState<'random' | 'price'>('random'); // 'price' سيتم تعيينها إلى 'marketCap'
    const [selectedTimeframe, setSelectedTimeframe] = useState('Day'); // للاستخدام المستقبلي المحتمل
    const [selectedBubbleData, setSelectedBubbleData] = useState<Gift | null>(null); // البيانات للمodal

    // تعريف عنوان API الأساسي
    // IMPORTANT: تأكد من أن API الخاص بـ physbubble-bot يعمل على هذا العنوان (مثال: http://localhost:8000)
    const API_BASE_URL = '/api'; // سيتم إعادة توجيهه بواسطة Vercel

    // دالة لجلب بيانات الهدايا من backend الخاص بـ FastAPI
    const fetchGiftsData = async () => {
        try {
            setLoading(true); // بدء التحميل
            setError(null); // مسح أي أخطاء سابقة

            // استخدام Promise.all لجلب نقاط نهاية API بشكل متزامن
            const [minGiftResponse, allGiftsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/min_gift?pretty=true`), // تم إصلاح المسار: إزالة /api الإضافية
                fetch(`${API_BASE_URL}/gifts?sort_by=min_price_usd_asc&pretty=true`) // تم إصلاح المسار: إزالة /api الإضافية
            ]);

            // فحص استجابات HTTP قبل معالجة JSON
            if (!minGiftResponse.ok || !allGiftsResponse.ok) {
                throw new Error(`خطأ HTTP! الحالة: ${minGiftResponse.status}/${allGiftsResponse.status}`);
            }

            // معالجة استجابة minGiftResponse
            const minGiftJson = await minGiftResponse.json();
            console.log('API /min_gift response:', minGiftJson); // تسجيل استجابة API

            // فحص صحة تنسيق البيانات
            if (!minGiftJson || !minGiftJson.min_price_gift) {
                throw new Error('تنسيق استجابة غير صالح من API');
            }

            if (minGiftJson.min_price_gift) {
                 setOverallMinGift({
                    id: minGiftJson.min_price_gift.id || 'overall_min',
                    name: minGiftJson.min_price_gift.name,
                    model_name: minGiftJson.min_price_gift.name,
                    min_price_ton: minGiftJson.min_price_gift.price_ton,
                    min_price_usd: minGiftJson.min_price_gift.price_usd,
                    image: minGiftJson.min_price_gift.image,
                    symbol: minGiftJson.min_price_gift.name.substring(0, 3).toUpperCase(),
                    market_cap: minGiftJson.min_price_gift.price_usd,
                    current_price: minGiftJson.min_price_gift.price_usd,
                    price_change_percentage_24h: Math.random() > 0.5 ? Math.random() * 10 : Math.random() * -10
                });
            }
            setTonPrice(minGiftJson.ton_price);

            // معالجة استجابة allGiftsResponse
            const allGiftsJson = await allGiftsResponse.json();
            console.log('API /gifts response:', allGiftsJson); // تسجيل استجابة API
            
            // تحويل البيانات المُجلبَة لتطابق واجهة 'Gift' المطلوبة من BubbleCanvas
            const transformedGifts: Gift[] = allGiftsJson.map((gift: any) => ({
                id: gift.model_name, // استخدام model_name كمعرف فريد للتصفية/الاختيار
                model_name: gift.model_name,
                name: gift.model_name, // BubbleCanvas تتوقع 'name'
                min_price_ton: gift.min_price_ton,
                min_price_usd: gift.min_price_usd,
                image: gift.image,
                symbol: gift.model_name.substring(0, 3).toUpperCase(),
                market_cap: gift.min_price_usd,
                current_price: gift.min_price_usd,
                price_change_percentage_24h: Math.random() > 0.5 ? 
                    Math.random() * 10 : 
                    Math.random() * -10
            }));
            
            setGiftsData(transformedGifts);
            // تحديد جميع الهدايا initially للعرض
            setSelectedGifts(transformedGifts.map(g => g.id));

            console.log('Transformed Gifts Data:', transformedGifts);
            console.log('Selected Gifts IDs:', transformedGifts.map(g => g.id));

        } catch (err: any) {
            console.error("Failed to fetch gift data:", err);
            setError(`فشل في جلب بيانات الهدايا: ${err.message}. يرجى التأكد من تشغيل API الخاص بك على ${API_BASE_URL}`);
        } finally {
            setLoading(false); // إنهاء التحميل بعد كل عمليات الجلب (نجاح أو خطأ)
        }
    };

    // Effect hook لجلب البيانات عند تركيب المكون وإعداد التحديث التلقائي
    useEffect(() => {
        fetchGiftsData();
        // التحديث التلقائي للبيانات كل 5 دقائق (300000 ميلي ثانية)
        const interval = setInterval(fetchGiftsData, 300000);
        return () => clearInterval(interval); // التنظيف عند فك التركيب
    }, []); // مصفوفة dependency فارغة تعني أن هذا يعمل مرة واحدة عند التركيب

    // استخدام useMemo لتحسين أداء التصفية - منع إعادة الحساب عند كل render
    const filteredGifts = useMemo(() => 
        giftsData.filter(gift => selectedGifts.includes(gift.id)),
        [giftsData, selectedGifts]
    );

    // معالج لتغيير تصفية الهدايا (checkboxes)
    const handleFilterChange = (giftId: string) => {
        setSelectedGifts(prevSelected => 
            prevSelected.includes(giftId)
                ? prevSelected.filter(id => id !== giftId)
                : [...prevSelected, giftId]
        );
    };

    // معالج لتغيير الإطار الزمني (حاليا لا يؤثر على البيانات، ولكن يمكن توسيعه)
    const handleTimeframeChange = (timeframe: string) => {
        setSelectedTimeframe(timeframe);
    };

    // حساب عدد الصاعد والهابط بناءً على نسبة تغير السعر
    const upCount = giftsData.filter(d => d.price_change_percentage_24h && d.price_change_percentage_24h > 0).length;
    const downCount = giftsData.filter(d => d.price_change_percentage_24h && d.price_change_percentage_24h < 0).length;

    // واجهات حالات التحميل والخطأ
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
            
            {/* Control Bar - شريط التحكم */}
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
            
            {/* Bubble Canvas Component - تمرير البيانات المحولة والمصفاة */}
            <BubbleCanvas
                cryptoData={filteredGifts} // استخدام البيانات المصفاة المحسنة بالأداء
                loading={loading}
                selectedCryptos={selectedGifts} // تمرير selectedCryptos صراحةً إلى BubbleCanvas
                sortMethod={sortMethod === 'price' ? 'marketCap' : 'random'}
                onBubbleClick={setSelectedBubbleData}
            />

            {/* Gift Modal Component - تمرير بيانات الفقاعة المحددة */}
            {selectedBubbleData && (
                <GiftModal 
                    bubbleData={selectedBubbleData}
                    onClose={() => setSelectedBubbleData(null)} 
                />
            )}

            {/* عرض سعر TON وأقل هدية整體ية في قسم مخصص */}
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
