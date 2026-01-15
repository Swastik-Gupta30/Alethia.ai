import { TrendingUp, AlertTriangle, Shield, Eye } from "lucide-react";

export default function InvestorDashboard() {
    const mockCompanies = [
        { id: 1, name: "Acme Corp", ticker: "ACME", price: "$124.50", change: "+2.4%", reliability: "High", score: 92 },
        { id: 2, name: "Globex Inc", ticker: "GLBX", price: "$45.20", change: "-0.8%", reliability: "Medium", score: 65 },
        { id: 3, name: "Soylent Corp", ticker: "SOYL", price: "$89.10", change: "+5.1%", reliability: "Low", score: 34, alert: true },
    ];

    return (
        <div className="min-h-screen bg-gray-950 p-8 pt-24">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6">Market Overview</h1>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {mockCompanies.map((company) => (
                        <div key={company.id} className="bg-gray-900 overflow-hidden shadow-lg rounded-lg border border-white/5 hover:border-indigo-500/30 transition-colors">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium leading-6 text-white">{company.name}</h3>
                                        <p className="text-sm text-gray-400">{company.ticker}</p>
                                    </div>
                                    <div className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${company.reliability === 'High' ? 'bg-green-500/10 text-green-400 ring-green-500/20' :
                                            company.reliability === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20' :
                                                'bg-red-500/10 text-red-400 ring-red-500/20'
                                        }`}>
                                        {company.reliability === 'High' ? <Shield className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                                        {company.score}% Trust
                                    </div>
                                </div>

                                <div className="mt-4 flex items-baseline">
                                    <p className="text-2xl font-semibold text-white">{company.price}</p>
                                    <p className={`ml-2 flex items-baseline text-sm font-semibold ${company.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                        {company.change.startsWith('+') ? <TrendingUp className="h-4 w-4 mr-1 self-center shrink-0" /> : null}
                                        {company.change}
                                    </p>
                                </div>

                                {company.alert && (
                                    <div className="mt-4 bg-red-900/20 border-l-4 border-red-500/50 p-2">
                                        <div className="flex">
                                            <div className="ml-3">
                                                <p className="text-xs text-red-300">
                                                    Narrative mismatch detected in latest filing.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-5">
                                    <button className="w-full justify-center inline-flex items-center rounded-md bg-white/5 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/10 transition-colors">
                                        <Eye className="w-4 h-4 mr-2" /> View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
