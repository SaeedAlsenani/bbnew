import React, { useState, useEffect } from 'react';
import BubbleCanvas from './components/BubbleCanvas';
import GiftModal from './components/GiftModal';

// أيقونات SVG (كما هي)
const LuEye = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const LuChevronUp = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const LuChevronDown = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

// نوع بيانات الهدية
interface Gift {
  id: string;
  name: string;
  price_ton: number;
  price_usd: number;
  price_change_percentage_24h?: number; // إضافة اختيارية لمحاكاة تغير السعر
}

const App = () => {
    const [giftsData, setGiftsData] = useState<Gift[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
    const [sortMethod, setSortMethod] = useState<'random' | 'price'>('random');
    const [selectedTimeframe, setSelectedTimeframe] = useState('Day');
    const [selectedBubbleData, setSelectedBubbleData] = useState<Gift | null>(null);

    // دالة جلب بيانات الهدايا
    const fetchGiftsData = async () => {
        try {
            const response = await fetch('https://YOUR_API_DOMAIN/api/gifts');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // تحويل البيانات لتتناسب مع هيكل التطبيق
            const formattedData = data.map((gift: any, index: number) => ({
                id: `gift-${index}`,
                name: gift.name,
                price_ton: gift.price_ton,
                price_usd: gift.price_usd,
                // إضافة تغير سعر عشوائي لمحاكاة الوظيفة الأصلية
                price_change_percentage_24h: Math.random() > 0.5 ? 
                    Math.random() * 10 : 
                    Math.random() * -10
            }));
            
            setGiftsData(formattedData);
            setSelectedGifts(formattedData.map(g => g.id));
            setError(null);
        } catch (err) {
            setError('فشل في جلب بيانات الهدايا. يرجى المحاولة لاحقاً.');
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGiftsData();
        // التحديث التلقائي كل 5 دقائق (300000 مللي ثانية)
        const interval = setInterval(fetchGiftsData, 300000);
        return () => clearInterval(interval);
    }, []);

    const handleFilterChange = (giftId: string) => {
        if (selectedGifts.includes(giftId)) {
            setSelectedGifts(selectedGifts.filter(id => id !== giftId));
        } else {
            setSelectedGifts([...selectedGifts, giftId]);
        }
    };

    const handleTimeframeChange = (timeframe: string) => {
        setSelectedTimeframe(timeframe);
        // يمكنك إضافة منطق إضافي هنا حسب الفترة الزمنية
    };

    // حساب عدد الهدايا الصاعدة والهابطة (بناء على تغير السعر المحاكى)
    const upCount = giftsData.filter(d => d.price_change_percentage_24h && d.price_change_percentage_24h > 0).length;
    const downCount = giftsData.filter(d => d.price_change_percentage_24h && d.price_change_percentage_24h < 0).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100 font-sans">
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');`}
                </style>
                <p className="text-xl">جاري تحميل...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500 font-sans">
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');`}
                </style>
                <p className="text-xl">{error}</p>
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
            
            {/* شريط التحكم (يبقى كما هو مع تغيير البيانات فقط) */}
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
                        Market Cap
                    </button>
                </div>
            </div>
            
            {/* مكون الفقاعات مع تعديل البيانات المرسلة */}
            <BubbleCanvas
                data={giftsData.filter(gift => selectedGifts.includes(gift.id))}
                loading={loading}
                sortMethod={sortMethod}
                onBubbleClick={setSelectedBubbleData}
                isCrypto={false} // إضافة خاصية لتمييز نوع البيانات
            />

            {/* نافذة التفاصيل */}
            {selectedBubbleData && (
                <GiftModal 
                    giftData={selectedBubbleData} 
                    onClose={() => setSelectedBubbleData(null)} 
                />
            )}
        </div>
    );
};

export default App;
