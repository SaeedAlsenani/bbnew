// src/components/Portfolio.tsx
import React, { useState, useMemo } from 'react';
import { Gift, PortfolioItem as PortfolioItemType } from '../types';

// SVG Icons
const LuTrash2 = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const LuRefreshCw = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
const LuTrendingUp = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const LuTrendingDown = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>;

interface PortfolioProps {
    items: PortfolioItemType[];
    loading: boolean;
    onRemoveItem: (itemId: string) => void;
    onUpdatePortfolio: () => void;
    stats: {
        totalValue: number;
        totalInvestment: number;
        totalProfitLoss: number;
        totalProfitLossPercentage: number;
    };
}

const Portfolio: React.FC<PortfolioProps> = ({ 
    items, 
    loading, 
    onRemoveItem, 
    onUpdatePortfolio,
    stats 
}) => {
    const [sortBy, setSortBy] = useState<'name' | 'value' | 'profit' | 'date'>('value');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // فرز العناصر
    const sortedItems = useMemo(() => {
        const sorted = [...items].sort((a, b) => {
            let aValue: number, bValue: number;
            
            switch (sortBy) {
                case 'name':
                    return sortOrder === 'asc' 
                        ? a.giftName.localeCompare(b.giftName)
                        : b.giftName.localeCompare(a.giftName);
                case 'value':
                    aValue = a.totalValue;
                    bValue = b.totalValue;
                    break;
                case 'profit':
                    aValue = a.profitLossPercentage;
                    bValue = b.profitLossPercentage;
                    break;
                case 'date':
                    aValue = new Date(a.purchaseDate).getTime();
                    bValue = new Date(b.purchaseDate).getTime();
                    break;
                default:
                    return 0;
            }
            
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        });
        
        return sorted;
    }, [items, sortBy, sortOrder]);

    const handleSort = (column: 'name' | 'value' | 'profit' | 'date') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
                <p className="ml-3 text-gray-400">جاري تحميل المحفظة...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <LuTrendingUp className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">المحفظة فارغة</h3>
                <p className="text-center mb-4">لم تقم بإضافة أي هدايا إلى محفظتك بعد.</p>
                <p className="text-sm text-gray-500">انتقل إلى تبويب "السوق" وأضف بعض الهدايا لمتابعة استثماراتك!</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            {/* بطاقة إحصائيات المحفظة */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-gray-400 text-sm">القيمة الإجمالية</div>
                        <div className="text-2xl font-bold text-white">
                            ${stats.totalValue.toFixed(2)}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-gray-400 text-sm">إجمالي الاستثمار</div>
                        <div className="text-xl text-gray-300">
                            ${stats.totalInvestment.toFixed(2)}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-gray-400 text-sm">الأرباح/الخسائر</div>
                        <div className={`text-xl font-bold ${stats.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.totalProfitLoss >= 0 ? '+' : ''}${stats.totalProfitLoss.toFixed(2)}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-gray-400 text-sm">النسبة المئوية</div>
                        <div className={`text-xl font-bold ${stats.totalProfitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.totalProfitLossPercentage >= 0 ? '+' : ''}{stats.totalProfitLossPercentage.toFixed(2)}%
                        </div>
                    </div>
                </div>
                
                <div className="mt-3 flex justify-center">
                    <button 
                        onClick={onUpdatePortfolio}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                        <LuRefreshCw className="w-4 h-4 mr-1" />
                        تحديث الأسعار
                    </button>
                </div>
            </div>

            {/* قائمة العناصر */}
            <div className="flex-1 overflow-auto">
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                    {/* رأس الجدول */}
                    <div className="grid grid-cols-12 gap-2 p-3 border-b border-gray-700 text-sm font-bold text-gray-300">
                        <div className="col-span-4 md:col-span-3">الهدية</div>
                        <div 
                            className="col-span-2 text-center cursor-pointer hover:text-white"
                            onClick={() => handleSort('value')}
                        >
                            القيمة {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </div>
                        <div 
                            className="col-span-2 text-center cursor-pointer hover:text-white"
                            onClick={() => handleSort('profit')}
                        >
                            الأرباح {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </div>
                        <div className="col-span-2 text-center">الكمية</div>
                        <div 
                            className="col-span-2 text-center cursor-pointer hover:text-white"
                            onClick={() => handleSort('date')}
                        >
                            التاريخ {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </div>
                        <div className="col-span-1 text-center">إجراءات</div>
                    </div>

                    {/* العناصر */}
                    <div className="max-h-96 overflow-y-auto">
                        {sortedItems.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 p-3 border-b border-gray-700/50 hover:bg-gray-750 transition-colors">
                                {/* الهدية */}
                                <div className="col-span-4 md:col-span-3 flex items-center">
                                    <img 
                                        src={item.giftImage} 
                                        alt={item.giftName}
                                        className="w-8 h-8 rounded-full object-cover mr-2"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://placehold.co/32x32/333/FFF?text=G';
                                        }}
                                    />
                                    <div>
                                        <div className="font-medium text-white text-sm">{item.giftName}</div>
                                        <div className="text-xs text-gray-400">
                                            شراء: ${item.purchasePrice.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* القيمة */}
                                <div className="col-span-2 text-center flex flex-col justify-center">
                                    <div className="text-white font-bold">${item.totalValue.toFixed(2)}</div>
                                    <div className="text-xs text-gray-400">حالي: ${item.currentPrice.toFixed(2)}</div>
                                </div>

                                {/* الأرباح */}
                                <div className="col-span-2 text-center flex flex-col justify-center">
                                    <div className={`font-bold ${item.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {item.profitLoss >= 0 ? '+' : ''}${item.profitLoss.toFixed(2)}
                                    </div>
                                    <div className={`text-xs ${item.profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {item.profitLossPercentage >= 0 ? '+' : ''}{item.profitLossPercentage.toFixed(2)}%
                                    </div>
                                </div>

                                {/* الكمية */}
                                <div className="col-span-2 text-center flex items-center justify-center">
                                    <span className="bg-gray-700 px-2 py-1 rounded text-sm">
                                        {item.quantity}
                                    </span>
                                </div>

                                {/* التاريخ */}
                                <div className="col-span-2 text-center flex items-center justify-center text-xs text-gray-400">
                                    {new Date(item.purchaseDate).toLocaleDateString('ar-EG')}
                                </div>

                                {/* الإجراءات */}
                                <div className="col-span-1 flex items-center justify-center">
                                    <button 
                                        onClick={() => onRemoveItem(item.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                                        title="إزالة من المحفظة"
                                    >
                                        <LuTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ملخص المحفظة */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="font-bold text-gray-300 mb-2">ملخص المحفظة</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-400">عدد العناصر:</span>
                        <span className="float-left font-bold text-white">{items.length}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">متوسط العائد:</span>
                        <span className={`float-left font-bold ${stats.totalProfitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.totalProfitLossPercentage.toFixed(2)}%
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">أفضل أداء:</span>
                        <span className="float-left font-bold text-green-400">
                            {Math.max(...items.map(i => i.profitLossPercentage)).toFixed(2)}%
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">أسوأ أداء:</span>
                        <span className="float-left font-bold text-red-400">
                            {Math.min(...items.map(i => i.profitLossPercentage)).toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Portfolio;
