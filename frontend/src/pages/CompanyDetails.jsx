import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, ArrowLeft, CheckCircle, Brain, Activity, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CompanyDetails() {
    const { ticker } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch from our Node backend
                const response = await axios.get(`http://localhost:8000/api/intelligence/${ticker}`);

                // Inject mock history if not present (for demo purposes)
                const enrichedData = {
                    ...response.data,
                    history: response.data.history || generateMockHistory(response.data.prediction)
                };

                setData(enrichedData);
            } catch (err) {
                console.error("Failed to fetch intelligence data", err);
                setError("Failed to load intelligence data.");
            } finally {
                setLoading(false);
            }
        };

        if (ticker) {
            fetchData();
        }
    }, [ticker]);

    // Helper to generate mock history based on trend
    const generateMockHistory = (prediction) => {
        const days = 20;
        const data = [];
        let price = 100; // Base price
        const trend = prediction > 0 ? 1 : -1;

        for (let i = 0; i < days; i++) {
            const volatility = (Math.random() - 0.5) * 5;
            price = price + (trend * 0.5) + volatility;
            data.push({
                date: `Day ${i + 1}`,
                price: parseFloat(price.toFixed(2))
            });
        }
        return data;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
                <Activity className="w-8 h-8 animate-spin text-indigo-500 mr-2" />
                Loading Intelligence...
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
                <p className="text-gray-400 mb-6">{error || "Company not found."}</p>
                <Link to="/dashboard/investor" className="text-indigo-400 hover:text-indigo-300 flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>
            </div>
        );
    }

    // Calculate generic color based on score
    const scoreColor = data.reliability_score >= 80 ? "text-green-400" :
        data.reliability_score >= 50 ? "text-yellow-400" : "text-red-400";
    const strokeColor = data.reliability_score >= 80 ? "#4ade80" : // green-400
        data.reliability_score >= 50 ? "#facc15" : // yellow-400
            "#f87171"; // red-400

    // Circular progress math
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const progress = data.reliability_score / 100;
    const dashoffset = circumference * (1 - progress);

    // Chart colors
    const isBullish = data.prediction > 0;
    const chartColor = isBullish ? "#4ade80" : "#f87171";

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <Link to="/dashboard/investor" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>

                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">
                            {ticker} <span className="text-gray-500 font-normal text-2xl">Intelligence Report</span>
                        </h1>
                        <div className="flex items-center space-x-3">
                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium ring-1 ring-inset ring-indigo-500/20">
                                AI Generated
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ring-1 ring-inset ${data.regime === "Stable" || data.regime === "Stable Growth"
                                ? "bg-green-500/10 text-green-400 ring-green-500/20"
                                : "bg-orange-500/10 text-orange-400 ring-orange-500/20"
                                }`}>
                                Regime: {data.regime}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column 1: Financial Performance (Chart) */}
                    <div className="md:col-span-2">
                        <div className="bg-gray-900 rounded-2xl p-6 border border-white/5 shadow-xl h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium text-gray-300">Projected Performance</h3>
                                <div className={`flex items-center text-sm font-bold ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
                                    <TrendingUp className={`w-4 h-4 mr-1 ${!isBullish && 'transform rotate-180'}`} />
                                    {isBullish ? 'Bullish Outlook' : 'Bearish Outlook'}
                                </div>
                            </div>

                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.history}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} vertical={false} />
                                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(value) => `$${value}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value) => [`$${value}`, 'Price']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="price"
                                            stroke={chartColor}
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorPrice)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Score */}
                    <div className="md:col-span-1">
                        <div className="bg-gray-900 rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col items-center justify-center h-full relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

                            <h3 className="text-lg font-medium text-gray-300 mb-6">Reliability Score</h3>

                            <div className="relative w-40 h-40 flex items-center justify-center">
                                {/* Background Circle */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="text-gray-800"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r={radius}
                                        stroke={strokeColor}
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={dashoffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className={`text-4xl font-bold ${scoreColor}`}>
                                        {Math.round(data.reliability_score)}
                                    </span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Score</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Narrative & Alerts (Full Width) */}
                    <div className="md:col-span-3 space-y-6">

                        {/* Alert Card if Inconsistent */}
                        {!data.is_consistent && (
                            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-4 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse-slow">
                                <div className="bg-red-500/20 p-2 rounded-full shrink-0 text-red-400">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-red-400 font-bold text-lg">Narrative Mismatch Detected</h3>
                                    <p className="text-red-300/80 text-sm mt-1">
                                        The sentiment of the generated narrative does not align with the underlying market data trends. Proceed with caution.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Narrative Card */}
                        <div className="bg-gray-900 rounded-2xl p-8 border border-white/5 shadow-xl">
                            <div className="flex items-center mb-6">
                                <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 mr-4">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-semibold text-white">Narrative Analysis</h2>
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-300 text-lg leading-relaxed">
                                    "{data.narrative_summary}"
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-sm text-gray-500">
                                <span>Source: Automated Market Analysis</span>
                                {data.is_consistent && (
                                    <span className="flex items-center text-green-400/80">
                                        <CheckCircle className="w-4 h-4 mr-1.5" /> Verified Consistent
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
