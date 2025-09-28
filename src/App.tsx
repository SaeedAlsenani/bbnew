// src/App.tsx - النسخة المحدثة بعد الفصل
import React, { useState, useEffect, useMemo } from 'react';
import BubbleCanvas from './components/BubbleCanvas';
import GiftModal from './components/GiftModal';
import { GiftFilter } from './components/GiftFilter';
import { DataSourceIndicator } from './components/DataSourceIndicator';
import { FooterInfoBar } from './components/FooterInfoBar';
import { useCollections } from './hooks/useCollections';
import { useGifts } from './hooks/useGifts';
import { Gift } from './interfaces/gift.interface';

// SVG Icons (تبقى كما هي)
const LuEye = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const LuChevronUp = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const LuChevronDown = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

const App = () => {
    // استخدام الـ hooks الجديدة
    const { collections, loading: collectionsLoading, error: collectionsError, fetchCollectionsData } = useCollections();
    const { 
        giftsData, 
        overallMinGift, 
        tonPrice, 
        loading: giftsLoading, 
        error: giftsError, 
        dataSource, 
        hasPlaceholderData, 
        fetchGiftsData, 
        isGiftLoaded 
    } = useGifts(collections);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
    const [sortMethod, setSortMethod] = useState<'random' | 'price'>('random');
    const [selectedTimeframe, setSelectedTimeframe] = useState('Day');
    const [selectedBubbleData, setSelectedBubbleData] = useState<Gift | null>(null);

    useEffect(() => {
        fetchCollectionsData();
    }, [fetchCollectionsData]);

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
                        <GiftFilter
                            gifts={filteredGifts}
                            selectedGifts={selectedGifts}
                            onFilterChange={handleFilterChange}
                            isGiftLoaded={isGiftLoaded}
                            isOpen={isFilterOpen}
                        />
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
            
            <DataSourceIndicator 
                dataSource={dataSource}
                hasPlaceholderData={hasPlaceholderData}
            />

            <BubbleCanvas
                cryptoData={filteredGifts}
                loading={giftsLoading}
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

            <FooterInfoBar 
                tonPrice={tonPrice}
                overallMinGift={overallMinGift}
            />
        </div>
    );
};

export default App;
