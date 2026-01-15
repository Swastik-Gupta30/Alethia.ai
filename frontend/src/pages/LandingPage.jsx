import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, BarChart3, ShieldCheck, Zap, Activity } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="bg-gray-950 min-h-screen">
            {/* Background Gradients */}
            <div className="absolute top-0 inset-x-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                    style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56 text-center">
                    <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                        <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-400 ring-1 ring-white/10 hover:ring-white/20">
                            Announcing our new reliability engine. <Link to="#" className="font-semibold text-indigo-400"><span className="absolute inset-0" aria-hidden="true"></span>Read more <span aria-hidden="true">&rarr;</span></Link>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-7xl">
                        Financial intelligence that tells you when <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">insights can’t be trusted.</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-300">
                        Modern markets generate drifting, unreliable data. Our platform makes uncertainty a first-class citizen, delivering unified latent representations to surface unseen risks before they impact your portfolio.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            to="/signup"
                            className="rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all hover:scale-105"
                        >
                            Get Started
                        </Link>
                        <Link to="/login" className="text-sm font-semibold leading-6 text-white hover:text-indigo-300 transition-colors">
                            Log in <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats / Trust Banner (Mock) */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
                    <div className="mx-auto flex max-w-xs flex-col gap-y-4">
                        <dt className="text-base leading-7 text-gray-400">Reliability Score</dt>
                        <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">99.9%</dd>
                    </div>
                    <div className="mx-auto flex max-w-xs flex-col gap-y-4">
                        <dt className="text-base leading-7 text-gray-400">Data Points Analyzed</dt>
                        <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">10B+</dd>
                    </div>
                    <div className="mx-auto flex max-w-xs flex-col gap-y-4">
                        <dt className="text-base leading-7 text-gray-400">Market Coverage</dt>
                        <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">Global</dd>
                    </div>
                </dl>
            </div>

            {/* Problem Snapshot */}
            <div className="bg-gray-900/50 py-24 sm:py-32 backdrop-blur-sm border-y border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-indigo-400">The Problem</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Data isn't just numbers. It's noise.
                        </p>
                        <p className="mt-6 text-lg leading-8 text-gray-400">
                            Prices drift, narratives contradict, and signals desynchronize. Traditional dashboards ignore this, leading to silent failures during volatile market conditions.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-5xl">
                        <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-2xl ring-1 ring-white/10">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                            <div className="p-12 flex flex-col items-center text-center">
                                <AlertTriangle className="h-20 w-20 text-yellow-500 mb-6" />
                                <h3 className="text-xl font-semibold text-white mb-2">Concept Drift Detected</h3>
                                <p className="text-gray-400 max-w-lg">
                                    "Warning: The correlation between asset class A and B has broken down in the last 4 hours. Historical models are currently unreliable."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="py-24 sm:py-32 relative">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center mb-16">
                        <h2 className="text-base font-semibold leading-7 text-indigo-400">How It Works</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Reliability as a Service
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {[
                            { icon: Zap, title: "Ingest Data", desc: "Real-time processing of heterogeneous financial data from multiple conflicting sources." },
                            { icon: ShieldCheck, title: "Analyze Reliability", desc: "Our engine computes time-varying reliability scores modeling cross-modal agreement." },
                            { icon: BarChart3, title: "Visualize Uncertainty", desc: "See trust scores directly alongside data, highlighting regime shifts instantly." }
                        ].map((item, idx) => (
                            <div key={idx} className="relative group bg-gray-800/50 p-8 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-all hover:bg-gray-800">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition duration-500 blur"></div>
                                <div className="relative">
                                    <div className="inline-flex items-center justify-center p-3 bg-indigo-900/50 rounded-xl text-indigo-400 mb-6 group-hover:text-white group-hover:bg-indigo-600 transition-colors">
                                        <item.icon size={28} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Who Is It For */}
            <div className="relative py-24 sm:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gray-900/80"></div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                    <div className="mx-auto max-w-2xl lg:text-center text-white mb-16">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Built for the Modern Market</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-16">
                        <div className="relative group rounded-3xl bg-gray-800/40 p-10 ring-1 ring-white/10 hover:ring-indigo-500/50 transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Activity size={100} />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">Startups</h3>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                Submit your data and track its reliability score. Prove your data's quality to potential investors with transparent, cryptographic-grade reliability metrics.
                            </p>
                            <ul className="mt-8 space-y-3 text-gray-400">
                                <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>Asset Verification</li>
                                <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>Confidence Scouting</li>
                            </ul>
                        </div>
                        <div className="relative group rounded-3xl bg-gray-800/40 p-10 ring-1 ring-white/10 hover:ring-indigo-500/50 transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <BarChart3 size={100} />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">Investors</h3>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                Consume insights with confidence. Know exactly when to trust the numbers and when to wait. Filter signals from noise with our AI-driven truth scores.
                            </p>
                            <ul className="mt-8 space-y-3 text-gray-400">
                                <li className="flex items-center"><div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>Regime Shift Alerts</li>
                                <li className="flex items-center"><div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>Drift Detection</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-950 border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
                    <div className="mt-8 md:order-1 md:mt-0">
                        <p className="text-center text-xs leading-5 text-gray-500">&copy; 2026 FinIntel Inc. All rights reserved.</p>
                    </div>
                    <div className="flex justify-center space-x-6 md:order-2">
                        <Link to="#" className="text-gray-500 hover:text-white transition-colors">About</Link>
                        <Link to="#" className="text-gray-500 hover:text-white transition-colors">Privacy</Link>
                        <Link to="#" className="text-gray-500 hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
