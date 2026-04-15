// GroupedMetrics.js - Updated with fixed key reference
import Card from "./ui/Card";
import Modal from "./ui/Modal";
import { formatVal } from "@/hooks/formatter";
import {
    BarChart3,
    Network,
    Target,
    TrendingUp,
    Users,
    Hash,
    Activity,
    X,
    ChevronRight,
    AlertTriangle,
    Filter,
    PieChart,
    Zap,
    Shield
} from "lucide-react";

const sectionIcons = {
    "ECHO_CHAMBER": Filter,
    "POLARIZATION": Target,
    "RAW_GRAPH": Network,
    "LEARNED_GRAPH": TrendingUp,
    "FAIRNESS": Shield,
    "PERFORMANCE": Activity,
    "NETWORK": PieChart
};

const sectionColors = {
    "ECHO_CHAMBER": "from-purple-500 to-pink-500",
    "POLARIZATION": "from-orange-500 to-red-500",
    "RAW_GRAPH": "from-blue-500 to-cyan-500",
    "LEARNED_GRAPH": "from-green-500 to-emerald-500",
    "FAIRNESS": "from-indigo-500 to-violet-500",
    "PERFORMANCE": "from-amber-500 to-yellow-500",
    "NETWORK": "from-gray-500 to-blue-500"
};

const sectionDescriptions = {
    "ECHO_CHAMBER": "Homophily & filter bubble effects",
    "POLARIZATION": "Division & opinion segregation",
    "RAW_GRAPH": "Original network structure analysis",
    "LEARNED_GRAPH": "Post-learning network metrics",
    "FAIRNESS": "Bias detection & fairness metrics",
    "PERFORMANCE": "Model performance evaluation",
    "NETWORK": "Graph topology & connectivity"
};

export default function GroupedMetrics({ groupedMetrics, activeSection, setActiveSection }) {
    // Helper function to get color based on value and key
    const getValueColor = (value, key = '') => {
        if (typeof value !== 'number') return 'text-gray-400';

        // For fairness metrics, lower is better
        if (activeSection === 'FAIRNESS' || key.includes('SP') || key.includes('EO')) {
            return value < 0.05 ? 'text-green-400' :
                value < 0.1 ? 'text-yellow-400' :
                    'text-red-400';
        }

        // For accuracy metrics, higher is better
        if (key.includes('ACC') || key.includes('AUC') || key.includes('F1')) {
            return value > 0.8 ? 'text-green-400' :
                value > 0.7 ? 'text-blue-400' :
                    value > 0.6 ? 'text-yellow-400' :
                        'text-red-400';
        }

        // For echo chamber metrics (intra-group edges, assortativity)
        if (key.includes('intra') || key.includes('assort')) {
            return value > 0.8 ? 'text-red-400' :
                value > 0.6 ? 'text-orange-400' :
                    value > 0.4 ? 'text-yellow-400' :
                        'text-green-400';
        }

        return 'text-gray-300';
    };

    const getValueBg = (value, key = '') => {
        if (typeof value !== 'number') return 'bg-gray-700';

        if (activeSection === 'FAIRNESS' || key.includes('SP') || key.includes('EO')) {
            return value < 0.05 ? 'bg-green-500/20' :
                value < 0.1 ? 'bg-yellow-500/20' :
                    'bg-red-500/20';
        }

        if (key.includes('ACC') || key.includes('AUC') || key.includes('F1')) {
            return value > 0.8 ? 'bg-green-500/20' :
                value > 0.7 ? 'bg-blue-500/20' :
                    value > 0.6 ? 'bg-yellow-500/20' :
                        'bg-red-500/20';
        }

        if (key.includes('intra') || key.includes('assort')) {
            return value > 0.8 ? 'bg-red-500/20' :
                value > 0.6 ? 'bg-orange-500/20' :
                    value > 0.4 ? 'bg-yellow-500/20' :
                        'bg-green-500/20';
        }

        return 'bg-gray-700';
    };

    // Helper to get status label
    const getStatusLabel = (value, key = '') => {
        if (typeof value !== 'number') return 'N/A';

        if (activeSection === 'FAIRNESS' || key.includes('SP') || key.includes('EO')) {
            return value < 0.05 ? 'Excellent' :
                value < 0.1 ? 'Good' :
                    'Needs Work';
        }

        if (key.includes('intra') || key.includes('assort')) {
            return value > 0.8 ? 'High Bias' :
                value > 0.6 ? 'Moderate' :
                    value > 0.4 ? 'Low' :
                        'Excellent';
        }

        if (key.includes('ACC') || key.includes('AUC') || key.includes('F1')) {
            return value > 0.8 ? 'Excellent' :
                value > 0.7 ? 'Good' :
                    value > 0.6 ? 'Fair' :
                        'Poor';
        }

        return 'Standard';
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Echo Chamber & Polarization Analysis</h3>
                            <p className="text-sm text-gray-400 mt-0.5">Click any metric group to explore details</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-flow-col gap-4">
                    {Object.entries(groupedMetrics).map(([section, metrics]) => {
                        const Icon = sectionIcons[section] || BarChart3;
                        const gradient = sectionColors[section] || "from-gray-600 to-gray-800";

                        return (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-5 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all duration-300 hover:scale-[1.02]"
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-xs font-semibold px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
                                            {Object.keys(metrics).length} metrics
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-white mb-1 line-clamp-1">
                                            {section.replace(/_/g, ' ')}
                                        </h4>
                                        <p className="text-xs text-gray-400 line-clamp-2">
                                            {sectionDescriptions[section] || "Detailed metrics analysis"}
                                        </p>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                                            Explore details
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeSection && (
                <Modal onClose={() => setActiveSection(null)} className="z-9999">
                    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden max-w-7xl z-9999">
                        {/* Modal Header */}
                        <div className={`bg-gradient-to-r ${sectionColors[activeSection]} p-6 text-white`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">

                                    <div>
                                        <h3 className="text-2xl font-bold">
                                            {activeSection.replace(/_/g, ' ')}
                                        </h3>
                                        <p className="text-white/80 text-sm mt-0.5">
                                            {sectionDescriptions[activeSection]}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveSection(null)}
                                    className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors hover:scale-110"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span>Excellent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span>Good</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span>Needs Attention</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {Object.entries(groupedMetrics[activeSection]).map(([key, value]) => {
                                    const valueColor = getValueColor(value, key);
                                    const valueBg = getValueBg(value, key);
                                    const statusLabel = getStatusLabel(value, key);

                                    return (
                                        <div
                                            key={key}
                                            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-800/80 transition-all duration-200 hover:scale-[1.02] group"
                                        >
                                            <div className="flex flex-col h-full">
                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium text-gray-400 truncate">
                                                            {key.split('_').slice(0, 2).join(' ')}
                                                        </span>
                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate mt-1">
                                                        {key}
                                                    </div>
                                                </div>

                                                <div className="mt-auto">
                                                    <div className="text-lg font-bold font-mono mb-2">
                                                        <span className={valueColor}>
                                                            {formatVal(value)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-xs text-gray-400">
                                                            Current value
                                                        </div>
                                                        <div className={`text-xs font-medium px-2 py-1 rounded-lg ${valueBg} ${valueColor}`}>
                                                            {statusLabel}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>


                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}