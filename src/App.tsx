<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crypto Bubble Visualizer</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts - Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <!-- React and ReactDOM CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <!-- Babel for JSX transformation in browser (for development/single-file scenarios) -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- Three.js CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <!-- OrbitControls CDN -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js"></script>

    <style>
        body { font-family: 'Inter', sans-serif; margin: 0; overflow: hidden; }
        #root { height: 100vh; display: flex; flex-direction: column; }
        canvas { display: block; } /* Ensure canvas takes full available space */
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        // Using inline SVG for icons to avoid build issues with external libraries
        const LuEye = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
        const LuChevronUp = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
        const LuChevronDown = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

        // Helper function to format currency
        const formatCurrency = (number) => {
            if (number === null || number === undefined) return 'N/A';
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                compactDisplay: 'short'
            }).format(number);
        };

        // Helper function to format percentage
        const formatPercentage = (number) => {
            if (number === null || number === undefined) return 'N/A';
            const sign = number > 0 ? '+' : '';
            return `${sign}${number.toFixed(2)}%`;
        };

        // GiftModal Component
        const GiftModal = ({ bubbleData, onClose }) => {
            if (!bubbleData) return null;

            const { name, symbol, current_price, market_cap, price_change_percentage_24h, image } = bubbleData;

            const isPositive = price_change_percentage_24h > 0;
            const textColorClass = isPositive ? 'text-green-400' : 'text-red-400';

            return (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm md:max-w-md lg:max-w-lg relative border border-gray-700">
                        <button 
                            onClick={onClose}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-2xl font-bold rounded-full p-1 leading-none"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <div className="flex flex-col items-center mb-4">
                            <img 
                                src={image || `https://placehold.co/64x64/333333/FFFFFF?text=${symbol.toUpperCase()}`} 
                                alt={`${name} icon`} 
                                className="w-16 h-16 rounded-full mb-3 border-2 border-gray-600"
                                onError={(e) => { 
                                    // Explicitly cast e.target to HTMLImageElement
                                    const imgElement = e.target;
                                    imgElement.onerror = null; // Prevent infinite loop if placeholder also fails
                                    imgElement.src = `https://placehold.co/64x64/333333/FFFFFF?text=${symbol.toUpperCase()}`; 
                                }}
                            />
                            <h2 className="text-3xl font-extrabold text-white text-center">{name} <span className="text-gray-400">({symbol.toUpperCase()})</span></h2>
                        </div>
                        <div className="space-y-3 text-lg">
                            <p className="flex justify-between items-center text-gray-300">
                                <span className="font-semibold">Current Price:</span> 
                                <span className="text-white font-bold">{formatCurrency(current_price)}</span>
                            </p>
                            <p className="flex justify-between items-center text-gray-300">
                                <span className="font-semibold">Market Cap:</span> 
                                <span className="text-white font-bold">{formatCurrency(market_cap)}</span>
                            </p>
                            <p className="flex justify-between items-center text-gray-300">
                                <span className="font-semibold">24h Change:</span> 
                                <span className={`font-bold ${textColorClass}`}>{formatPercentage(price_change_percentage_24h)}</span>
                            </p>
                        </div>
                    </div>
                </div>
            );
        };

        // BubbleCanvas Component
        const BubbleCanvas = ({ cryptoData, loading, selectedCryptos, sortMethod, onBubbleClick }) => {
            const mountRef = React.useRef(null);
            const scene = React.useRef(null);
            const camera = React.useRef(null);
            const renderer = React.useRef(null);
            const controls = React.useRef(null);
            const raycaster = React.useRef(new THREE.Raycaster());
            const mouse = React.useRef(new THREE.Vector2());
            const bubblesGroup = React.useRef(new THREE.Group()); // Group to hold all bubbles

            const bubbleMeshes = React.useRef([]); // Store references to actual THREE.Mesh objects

            const setupScene = React.useCallback(() => {
                if (!mountRef.current) return;

                // Explicitly cast mountRef.current to HTMLDivElement
                const currentMount = mountRef.current;

                // Scene
                scene.current = new THREE.Scene();
                scene.current.background = new THREE.Color(0x1a202c); // Dark gray background

                // Camera
                const aspectRatio = currentMount.clientWidth / currentMount.clientHeight;
                camera.current = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
                camera.current.position.z = 100;

                // Renderer
                renderer.current = new THREE.WebGLRenderer({ antialias: true });
                renderer.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
                currentMount.appendChild(renderer.current.domElement);

                // Controls
                controls.current = new THREE.OrbitControls(camera.current, renderer.current.domElement);
                controls.current.enableDamping = true; // Smooth camera movement
                controls.current.dampingFactor = 0.05;
                controls.current.screenSpacePanning = false;
                controls.current.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground

                // Lighting
                const ambientLight = new THREE.AmbientLight(0x404040, 2); // soft white light
                scene.current.add(ambientLight);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                directionalLight.position.set(1, 1, 1).normalize();
                scene.current.add(directionalLight);

                // Add the bubbles group to the scene
                scene.current.add(bubblesGroup.current);

                // Handle window resize
                const handleResize = () => {
                    if (mountRef.current && camera.current && renderer.current) {
                        const width = mountRef.current.clientWidth;
                        const height = mountRef.current.clientHeight;
                        renderer.current.setSize(width, height);
                        camera.current.aspect = width / height;
                        camera.current.updateProjectionMatrix();
                    }
                };
                window.addEventListener('resize', handleResize);

                // Cleanup function for unmounting
                return () => {
                    window.removeEventListener('resize', handleResize);
                    if (mountRef.current && renderer.current && renderer.current.domElement) {
                        mountRef.current.removeChild(renderer.current.domElement);
                        renderer.current.dispose();
                    }
                    if (controls.current) {
                        controls.current.dispose();
                    }
                    // Dispose of geometries and materials to prevent memory leaks
                    bubblesGroup.current.children.forEach(mesh => {
                        if (mesh.geometry) mesh.geometry.dispose();
                        if (mesh.material) mesh.material.dispose();
                    });
                    bubblesGroup.current.clear();
                };
            }, []);

            // Animation loop
            const animate = React.useCallback(() => {
                if (renderer.current && scene.current && camera.current && controls.current) {
                    requestAnimationFrame(animate);
                    controls.current.update(); // only required if controls.enableDamping is set to true
                    renderer.current.render(scene.current, camera.current);
                }
            }, []);

            // Effect for initial setup and animation start
            React.useEffect(() => {
                const cleanup = setupScene();
                animate();
                return cleanup;
            }, [setupScene, animate]);

            // Function to update bubbles based on data and filters
            React.useEffect(() => {
                if (!scene.current || !cryptoData.length) return;

                // Clear existing bubbles
                bubblesGroup.current.children.forEach(mesh => {
                    if (mesh.geometry) mesh.geometry.dispose();
                    if (mesh.material) mesh.material.dispose();
                });
                bubblesGroup.current.clear();
                bubbleMeshes.current = [];

                const filteredData = cryptoData.filter(d => selectedCryptos.includes(d.id));

                const maxMarketCap = Math.max(...filteredData.map(d => d.market_cap || 1));
                const minMarketCap = Math.min(...filteredData.map(d => d.market_cap || 1));

                const getBubbleRadius = (marketCap) => {
                    if (filteredData.length === 0) return 1;
                    const normalized = (Math.log(marketCap || 1) - Math.log(minMarketCap || 1)) / (Math.log(maxMarketCap || 1) - Math.log(minMarketCap || 1));
                    return Math.max(0.5, normalized * 5 + 1); // Scale radius from 0.5 to 6
                };

                const geometry = new THREE.SphereGeometry(1, 32, 32); // Base geometry, radius will be scaled

                filteredData.forEach((crypto, index) => {
                    const radius = getBubbleRadius(crypto.market_cap);
                    const materialColor = crypto.price_change_percentage_24h > 0 ? 0x00ff00 : 0xff0000; // Green for up, Red for down
                    const material = new THREE.MeshPhongMaterial({ color: materialColor, transparent: true, opacity: 0.9 });
                    
                    const sphere = new THREE.Mesh(geometry, material);
                    sphere.scale.set(radius, radius, radius); // Apply scaling here
                    sphere.userData = { cryptoData: crypto }; // Store original data for click events

                    // Positioning logic based on sortMethod
                    if (sortMethod === 'random') {
                        sphere.position.set(
                            (Math.random() - 0.5) * 80, // X
                            (Math.random() - 0.5) * 80, // Y
                            (Math.random() - 0.5) * 80  // Z
                        );
                    } else { // 'marketCap' - arrange in a grid-like structure
                        const cols = Math.ceil(Math.sqrt(filteredData.length));
                        const row = Math.floor(index / cols);
                        const col = index % cols;

                        const spacing = 10; // Adjust spacing as needed
                        sphere.position.set(
                            (col - cols / 2 + 0.5) * spacing,
                            (row - filteredData.length / cols / 2 + 0.5) * spacing,
                            0 // Keep them mostly on a plane for market cap sort
                        );
                    }
                    bubblesGroup.current.add(sphere);
                    bubbleMeshes.current.push(sphere);
                });

                // Adjust camera to fit all bubbles
                const box = new THREE.Box3().setFromObject(bubblesGroup.current);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.current.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                cameraZ *= 1.2; // Add some padding
                
                camera.current.position.set(center.x, center.y, cameraZ);
                camera.current.lookAt(center);

            }, [cryptoData, selectedCryptos, sortMethod]);

            // Handle bubble clicks
            const onCanvasClick = React.useCallback((event) => {
                if (!mountRef.current || !raycaster.current || !camera.current || !renderer.current) return;

                // Explicitly cast mountRef.current to HTMLDivElement for getBoundingClientRect
                const rect = mountRef.current.getBoundingClientRect();
                mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.current.setFromCamera(mouse.current, camera.current);

                const intersects = raycaster.current.intersectObjects(bubblesGroup.current.children);

                if (intersects.length > 0) {
                    const clickedBubble = intersects[0].object;
                    if (clickedBubble.userData && clickedBubble.userData.cryptoData) {
                        onBubbleClick(clickedBubble.userData.cryptoData);
                    }
                }
            }, [onBubbleClick]);

            React.useEffect(() => {
                const canvasElement = mountRef.current;
                if (canvasElement) {
                    canvasElement.addEventListener('click', onCanvasClick);
                }
                return () => {
                    if (canvasElement) {
                        canvasElement.removeEventListener('click', onCanvasClick);
                    }
                };
            }, [onCanvasClick]);

            if (loading) {
                return (
                    <div className="flex flex-grow items-center justify-center bg-gray-900 text-gray-100">
                        <p>Loading 3D visualization...</p>
                    </div>
                );
            }

            return (
                <div 
                    ref={mountRef} 
                    className="flex-grow w-full rounded-lg overflow-hidden relative"
                    style={{ minHeight: '300px' }} // Ensure a minimum height for the canvas
                >
                    {/* Three.js canvas will be appended here */}
                </div>
            );
        };

        // Main App Component
        const App = () => {
            const [cryptoData, setCryptoData] = React.useState([]);
            const [loading, setLoading] = React.useState(true);
            const [error, setError] = React.useState(null);
            const [isFilterOpen, setIsFilterOpen] = React.useState(false);
            const [selectedCryptos, setSelectedCryptos] = React.useState([]);
            const [sortMethod, setSortMethod] = React.useState('random'); // 'random' or 'marketCap'
            // State for selected timeframe
            const [selectedTimeframe, setSelectedTimeframe] = React.useState('Day'); 
            
            // State to control the visibility and data of the modal
            const [selectedBubbleData, setSelectedBubbleData] = React.useState(null); 

            React.useEffect(() => {
                const fetchData = async () => {
                    try {
                        // Fetch cryptocurrency data from CoinGecko API
                        const response = await fetch(
                            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h'
                        );
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const data = await response.json();
                        setCryptoData(data);
                        setSelectedCryptos(data.map(d => d.id)); // Select all by default
                    } catch (err) {
                        setError('Failed to fetch cryptocurrency data. Please try again later.');
                        console.error("Fetch error:", err);
                    } finally {
                        setLoading(false);
                    }
                };

                fetchData();
                // Refresh data every 5 minutes (300000 ms)
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

            // Handler for timeframe buttons
            const handleTimeframeChange = (timeframe) => {
                setSelectedTimeframe(timeframe);
                // You would add logic here to refetch data for the selected timeframe
                // For now, it only changes the active button style.
            };

            const upCount = cryptoData.filter(d => d.price_change_percentage_24h > 0).length;
            const downCount = cryptoData.filter(d => d.price_change_percentage_24h < 0).length;

            if (loading) {
                return (
                    <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100 font-sans">
                        <p className="text-xl">Loading cryptocurrency data...</p>
                    </div>
                );
            }

            if (error) {
                return (
                    <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500 font-sans">
                        <p className="text-xl">{error}</p>
                    </div>
                );
            }

            return (
                // Main container: takes full screen height and arranges content vertically
                <div className="bg-gray-900 h-screen text-gray-100 flex flex-col p-2 font-sans">
                    {/* Compact and responsive control bar */}
                    <div className="w-full flex items-center justify-between p-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 mb-2">
                        {/* Left side: Filter button and counts */}
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
                                        {cryptoData.map((crypto) => (
                                            <div key={crypto.id} className="flex items-center p-2 hover:bg-gray-600 rounded-md cursor-pointer transition-colors duration-150">
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
                                onClick={() => handleTimeframeChange('All time')}
                            >
                                All time
                            </button>
                            <button 
                                className={`font-bold py-1 px-2 rounded-lg text-xs md:text-sm transition-colors duration-200 ${sortMethod === 'marketCap' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
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

        // Render the App component into the root div
        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>

