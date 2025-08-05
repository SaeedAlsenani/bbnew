import React, { useState, useEffect } from 'react';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Import the separated components
import BubbleCanvas from './BubbleCanvas'; // Assuming BubbleCanvas.tsx is in the same directory
import GiftModal from './GiftModal';     // Assuming GiftModal.tsx is in the same directory

// Using inline SVG for icons to avoid build issues with external libraries
const LuEye = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const LuChevronUp = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const LuChevronDown = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

// App ID from the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Initialize Firebase
const app = initializeApp(firebaseConfig, 'crypto-bubbles-app-' + appId);
const auth = getAuth(app);

// Sign in anonymously on load
const setupAuth = async () => {
    try {
        if (!auth.currentUser) {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Error signing in anonymously:", error);
    }
};

setupAuth();

const App = () => {
    const [cryptoData, setCryptoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedCryptos, setSelectedCryptos] = useState([]);
    const [sortMethod, setSortMethod] = useState('random'); // 'random' or 'marketCap'
    
    // State to control the visibility and data of the modal
    const [selectedBubbleData, setSelectedBubbleData] = useState(null); 

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch cryptocurrency data from CoinGecko API
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h'
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const data = await response.json();
                setCryptoData(data);
                setSelectedCryptos(data.map(d => d.id)); // Select all by default
            } catch (err) {
                setError('Failed to fetch cryptocurrency data. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Refresh data every 5 minutes
        const interval = setInterval(fetchData, 300000);
        return () => clearInterval(interval);
    }, []);

    const handleFilterChange = (cryptoId) => {
        if (selectedCryptos.includes(cryptoId)) {
            setSelectedCryptos(selectedCryptos.filter(id => id !== cryptoId));
        } else {
            setSelectedCryptos([...selectedCryptos, cryptoId]);
        }
    };

    const formatCurrency = (number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            compactDisplay: 'short'
        }).format(number);
    };

    const formatPercentage = (number) => {
        const sign = number > 0 ? '+' : '';
        return `${sign}${number.toFixed(2)}%`;
    };

    const upCount = cryptoData.filter(d => d.price_change_percentage_24h > 0).length;
    const downCount = cryptoData.filter(d => d.price_change_percentage_24h < 0).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
                <p>جاري التحميل...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    return (
        // Main container: takes full screen height and arranges content vertically
        <div className="bg-gray-900 h-screen text-gray-100 flex flex-col p-2 font-sans">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                    body { font-family: 'Inter', sans-serif; }
                `}
            </style>
            
            {/* Compact and responsive control bar */}
            <div className="w-full flex items-center justify-between p-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 mb-2">
                {/* Left side: Filter button and counts */}
                <div className="flex items-center space-x-1 md:space-x-2">
                    <div className="relative">
                        <button 
                            className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-1 px-2 rounded-lg flex items-center text-xs md:text-sm"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <LuEye className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden md:block ml-1">Filter</span>
                        </button>
                        {isFilterOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 md:w-64 h-80 overflow-y-auto bg-gray-700 rounded-lg shadow-lg z-50 p-2">
                                {cryptoData.map((crypto) => (
                                    <div key={crypto.id} className="flex items-center p-2 hover:bg-gray-600 rounded-md cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedCryptos.includes(crypto.id)}
                                            onChange={() => handleFilterChange(crypto.id)}
                                            className="form-checkbox h-4 w-4 text-green-500 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
                                        />
                                        <span className="ml-2 text-gray-200 text-sm">{crypto.name} ({crypto.symbol.toUpperCase()})</span>
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

                {/* Right side: Timeframe and Market Cap buttons */}
                <div className="flex items-center space-x-1 md:space-x-2">
                    <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded-lg text-xs md:text-sm">Day</button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-1 px-2 rounded-lg text-xs md:text-sm">Week</button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-1 px-2 rounded-lg text-xs md:text-sm">All time</button>
                    <button 
                        className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm ${sortMethod === 'marketCap' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        onClick={() => setSortMethod(sortMethod === 'marketCap' ? 'random' : 'marketCap')}
                    >
                        Market Cap
                    </button>
                </div>
            </div>
            
            {/* Main bubble container - now handled by BubbleCanvas component */}
            <BubbleCanvas
                cryptoData={cryptoData}
                loading={loading}
                selectedCryptos={selectedCryptos}
                sortMethod={sortMethod}
                onBubbleClick={setSelectedBubbleData} // Callback to set the selected bubble for the modal
            />

            {/* Bubble Details Modal - conditionally rendered */}
            {selectedBubbleData && (
                <GiftModal 
                    bubbleData={selectedBubbleData} 
                    onClose={() => setSelectedBubbleData(null)} 
                />
            )}
        </div>
    );
};

export default App;

