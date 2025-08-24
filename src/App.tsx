    import React, { useState, useEffect, useMemo, useCallback } from 'react';
    import BubbleCanvas from './components/BubbleCanvas';
    import GiftModal from './components/GiftModal';

    // SVG Icons (kept as is)
    const LuEye = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
    const LuChevronUp = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
    const LuChevronDown = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

    // واجهة Gift الرئيسية - تستخدم min_price_ton و min_price_usd
    interface Gift {
      id: string; // قد يكون model_name أو variant_id
      model_name: string;
      variant_name?: string; // اسم النسخة (مثلاً Plush Pepe #123)
      min_price_ton: number;
      min_price_usd: number;
      image: string;
      // خصائص إضافية مطلوبة لـ BubbleCanvas
      name: string; // يستخدم لعرض اسم الهدية/النموذج
      symbol: string; // يستخدم لرمز العرض (أول 3 أحرف من الاسم)
      market_cap: number; // يستخدم لحجم الفقاعة
      current_price: number; // يستخدم لسعر العرض
      price_change_percentage_24h?: number; // يستخدم لتغيير السعر
      isBot?: boolean;
    }

    // واجهة لاستجابة MinGiftResponse من نقطة النهاية /api/min_gift
    interface MinGiftApiResponse {
      min_price_gift?: {
        id?: string; // قد يكون variant_id
        name?: string; // اسم النسخة (مثلاً Plush Pepe #123)
        price_ton: number;
        price_usd: number;
        image?: string;
      };
      ton_price: number;
      timestamp: number;
      last_updated: string;
      _sort_order: string;
      total_models: number;
      success_rate: string;
    }

    // واجهة لاستجابة AllGiftModelsResponse من نقطة النهاية /api/models
    interface AllGiftModelsApiResponse {
      gift_models_min_prices: {
        model_name: string;
        min_price_ton: number;
        min_price_usd: number;
        image?: string;
        variant_id?: string;
        variant_name?: string;
        is_valid: boolean;
      }[];
      ton_price: number;
      timestamp: number;
      last_updated: string;
      _sort_order: string;
      total_models: number;
      success_rate: string;
    }

    // واجهة لـ TargetItem لإرسالها في جسم الطلب
    interface TargetItem {
      collection: string;
      model?: string;
    }

    const App = () => {
        const [giftsData, setGiftsData] = useState<Gift[]>([]);
        const [overallMinGift, setOverallMinGift] = useState<Gift | null>(null);
        const [tonPrice, setTonPrice] = useState<number | null>(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [isFilterOpen, setIsFilterOpen] = useState(false);
        const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
        const [sortMethod, setSortMethod] = useState<'random' | 'price'>('random'); // 'price' for min_price_usd_asc
        const [selectedTimeframe, setSelectedTimeframe] = useState('Day');
        // تم التعديل هنا: قيمة useState الأولية يجب أن تكون `null` وليس متغيرًا
        const [selectedBubbleData, setSelectedBubbleData] = useState<Gift | null>(null); 

        // تغيير API_BASE_URL ليكون مساراً نسبياً ليتم التعامل معه بواسطة vercel.json
        const API_BASE_URL = '/api'; 

        // قائمة افتراضية بالأهداف
        // يمكنك تعديل هذه القائمة لتحديد المجموعات والنماذج التي تريد جلب بياناتها
        const defaultTargetItems: TargetItem[] = useMemo(() => [
            { "collection": "Plush Pepe" },
            { "collection": "Eternal Candle" },
            { "collection": "Snoop Dogg" },
            { "collection": "Jingle Bells" },
            { "collection": "Pet Snake" },
            { "collection": "Tama Gadget" },
            { "collection": "Lunar Snake" },
            { "collection": "Snow Mittens" },
            { "collection": "Witch Hat" },
            { "collection": "Lol Pop" },
            { "collection": "Spy Agaric" },
            { "collection": "Bunny Muffin" },
            { "collection": "Low Rider" },
            { "collection": "Whip Cupcake" },
            { "collection": "Berry Box" },
            { "collection": "Swag Bag" },
            { "collection": "Precious Peach" },
            { "collection": "Light Sword" },
            { "collection": "Durov's Cap" },
            { "collection": "Bow Tie" },
            { "collection": "Candy Cane" },
            { "collection": "Heroic Helmet" },
            { "collection": "Sleigh Bell" },
            { "collection": "Snake Box" },
            { "collection": "Neko Helmet" },
            { "collection": "Diamond Ring" },
            { "collection": "Sakura Flower" },
            { "collection": "Westside Sign" },
            { "collection": "Evil Eye" },
            { "collection": "Record Player" },
            { "collection": "Skull Flower" },
            { "collection": "Easter Egg" },
            { "collection": "B-Day Candle" },
            { "collection": "Desk Calendar" },
            { "collection": "Star Notepad" },
            { "collection": "Joyful Bundle" },
            { "collection": "Plush Pepe" },
            { "collection": "Eternal Candle" },
            { "collection": "Snoop Dogg" },
            { "collection": "Sharp Tongue" },
            { "collection": "Snow Globe" },
            { "collection": "Holiday Drink" },
            { "collection": "Flying Broom" },
            { "collection": "Big Year" },
            { "collection": "Hypno Lollipop" },
            { "collection": "Genie Lamp" },
            { "collection": "Bonded Ring" },
            { "collection": "Spiced Wine" },
            { "collection": "Snoop Cigar" },
            { "collection": "Xmas Stocking" },
            { "collection": "Homemade Cake" },
            { "collection": "Toy Bear" },
            { "collection": "Vintage Cigar" },
            { "collection": "Signet Ring" },
            { "collection": "Gem Signet" },
            { "collection": "Lush Bouquet" },
            { "collection": "Santa Hat" },
            { "collection": "Winter Wreath" },
            { "collection": "Nail Bracelet" },
            { "collection": "Ginger Cookie" },
            { "collection": "Perfume Bottle" },
            { "collection": "Crystal Ball" },
            { "collection": "Mini Oscar" },
            { "collection": "Jelly Bunny" },
            { "collection": "Jester Hat" },
            { "collection": "Cookie Heart" },
            { "collection": "Jack-in-the-Box" },
            { "collection": "Hanging Star" },
            { "collection": "Trapped Heart" },
            { "collection": "Heart Locket" },
            { "collection": "Magic Potion" },
            { "collection": "Mad Pumpkin" },
            { "collection": "Party Sparkler" },
            { "collection": "Cupid Charm" },
            { "collection": "Kissed Frog" },
            { "collection": "Loot Bag" },
            { "collection": "Eternal Rose" },
            { "collection": "Love Candle" },
            { "collection": "Electric Skull" },
            { "collection": "Valentine Box" },
            { "collection": "Hex Pot" },
            { "collection": "Swiss Watch" },
            { "collection": "Top Hat" },
            { "collection": "Scared Cat" },
            { "collection": "Love Potion" },
            { "collection": "Astral Shard" },
            { "collection": "Ion Gem" },
            { "collection": "Voodoo Doll" },
            { "collection": "Restless Jar" }
        ], []);

        const fetchGiftsData = useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                // إنشاء حمولة الطلب لجميع نقاط النهاية
                const requestBody = JSON.stringify(defaultTargetItems);
                const requestHeaders = {
                    'Content-Type': 'application/json',
                };

                // 1. جلب بيانات أرخص هدية شاملة من /api/min_gift (الآن POST)
                // استخدام مسار نسبي
                const minGiftResponse = await fetch(`${API_BASE_URL}/min_gift?pretty=true`, {
                    method: 'POST',
                    headers: requestHeaders,
                    body: requestBody,
                });

                // 2. جلب جميع نماذج الهدايا من /api/models (الآن POST)
                // استخدام مسار نسبي
                const allGiftsResponse = await fetch(`${API_BASE_URL}/models?sort_by=min_price_usd_asc&pretty=true`, {
                    method: 'POST',
                    headers: requestHeaders,
                    body: requestBody,
                });

                if (!minGiftResponse.ok || !allGiftsResponse.ok) {
                    const minGiftError = await minGiftResponse.text();
                    const allGiftsError = await allGiftsResponse.text();
                    console.error("Min Gift API Error:", minGiftError);
                    console.error("All Gifts API Error:", allGiftsError);
                    throw new Error(`خطأ HTTP! حالة /min_gift: ${minGiftResponse.status}, حالة /models: ${allGiftsResponse.status}`);
                }

                // معالجة استجابة min_gift
                const minGiftJson: MinGiftApiResponse = await minGiftResponse.json();
                console.log('API /min_gift response:', minGiftJson);

                if (minGiftJson && minGiftJson.min_price_gift) {
                    // تحويل البيانات من هيكل API إلى واجهة Gift الخاصة بنا
                    setOverallMinGift({
                        id: minGiftJson.min_price_gift.id || 'overall_min',
                        name: minGiftJson.min_price_gift.name || 'أرخص هدية',
                        model_name: minGiftJson.min_price_gift.name || 'أرخص هدية', // قد تحتاج لتحديد model_name بشكل أفضل
                        min_price_ton: minGiftJson.min_price_gift.price_ton,
                        min_price_usd: minGiftJson.min_price_gift.price_usd,
                        image: minGiftJson.min_price_gift.image || 'https://placehold.co/60x60/333/FFF?text=Gift',
                        symbol: (minGiftJson.min_price_gift.name || 'ARG').substring(0, 3).toUpperCase(),
                        market_cap: minGiftJson.min_price_gift.price_usd,
                        current_price: minGiftJson.min_price_gift.price_usd,
                        price_change_percentage_24h: Math.random() > 0.5 ? Math.random() * 10 : Math.random() * -10
                    });
                } else {
                    setOverallMinGift(null);
                }
                setTonPrice(minGiftJson.ton_price);

                // معالجة استجابة models
                const allGiftsJson: AllGiftModelsApiResponse = await allGiftsResponse.json();
                console.log('API /models response:', allGiftsJson);
                
                const transformedGifts: Gift[] = allGiftsJson.gift_models_min_prices
                    .filter(gift => gift.is_valid) // تصفية الهدايا غير الصالحة
                    .map((gift: any) => ({
                        id: gift.variant_id || gift.model_name, // استخدام variant_id أو model_name كـ id
                        model_name: gift.model_name,
                        variant_name: gift.variant_name,
                        name: gift.variant_name || gift.model_name, // الأفضل عرض variant_name إن وجد
                        min_price_ton: gift.min_price_ton,
                        min_price_usd: gift.min_price_usd,
                        image: gift.image || 'https://placehold.co/60x60/333/FFF?text=Gift',
                        symbol: gift.model_name.substring(0, 3).toUpperCase(),
                        market_cap: gift.min_price_usd,
                        current_price: gift.min_price_usd,
                        price_change_percentage_24h: Math.random() > 0.5 ? 
                            Math.random() * 10 : 
                            Math.random() * -10
                    }));
                
                setGiftsData(transformedGifts);
                // تحديد الهدايا المختارة لجميع الهدايا الصالحة تلقائياً
                setSelectedGifts(transformedGifts.map(g => g.id));

            } catch (err: any) {
                console.error("فشل في جلب بيانات الهدايا:", err);
                // تغيير رسالة الخطأ لتعكس استخدام Vercel proxy
                setError(`فشل في جلب بيانات الهدايا: ${err.message}. يرجى التأكد من أن الـ API الخلفي يعمل بشكل صحيح وأن vercel.json مهيأ بشكل صحيح.`);
            } finally {
                setLoading(false);
            }
        }, [defaultTargetItems, API_BASE_URL]); // إضافة defaultTargetItems و API_BASE_URL كـ dependencies

        useEffect(() => {
            fetchGiftsData();
            const interval = setInterval(fetchGiftsData, 300000); // 5 دقائق
            return () => clearInterval(interval);
        }, [fetchGiftsData]); // جعل fetchGiftsData dependency للـ useEffect

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
                        <p className="text-sm text-gray-300">تأكد من أن الـ API الخلفي يعمل وأن vercel.json مهيأ بشكل صحيح.</p>
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
                            الرجاء التأكد من أن الـ API الخلفي يعمل بشكل صحيح وأن vercel.json مهيأ بشكل صحيح.
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
    
