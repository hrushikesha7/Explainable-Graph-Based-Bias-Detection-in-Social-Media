"use client";
import { useState } from "react";
import { useFairVGNNData } from "@/hooks/useFairVGNNData";
import { useAuditData } from "@/hooks/useAuditData";
import DashboardLayout from "./DashboardLayout";
import ControlsSidebar from "@/component/ControlsSidebar";
import GroupedMetrics from "@/component/GroupedMetrics";
import MetricChart from "@/component/MetricChart";
import FairnessAccuracyChart from "@/component/FairnessAccuracyChart";
import GroupComparisonChart from "@/component/GroupComparisonChart";
import RadarChartComponent from "@/component/RadarChartComponent";
import PerformanceDistribution from "@/component/PerformanceDistribution";
import AUCTrendChart from "@/component/AUCTrendChart";
import SummaryTable from "@/component/SummaryTable";
import LoadingSpinner from "@/component/ui/LoadingSpinner";
import FeatureImportanceChart from "@/component/FeatureImportanceChart";
import FairnessMetrics from "@/component/FairnessMetrics";
import { useREAuditData } from "@/hooks/useReData";
import { REPolarizationChart } from "@/component/ReAuditComponents/PolarizationGraph";
import { RENetworkGraph } from "@/component/ReAuditComponents/NetworkGraph";
import FeatureChart from "@/component/ReAuditComponents/FeatureAttribution";
import {
    BarChart3,
    TrendingUp,
    Network,
    Target,
    PieChart,
    Activity,
    Shield,
    Users,
    Zap,
    ArrowDown,
    ArrowUp,
    Globe,
    Cpu,
    AlertTriangle,
    Filter
} from "lucide-react";

export default function Dashboard() {
    // Fair VGNN Data
    const {
        raw,
        loading: fairLoading,
        rows,
        selectedFiles,
        setSelectedFiles,
        metricSeries,
        fairnessAccuracyData,
        groupComparisonData,
        performanceDistribution,
        topModels,
        selectedRows,
        radarData,
        groupedMetrics
    } = useFairVGNNData();

    // Model Audit Data
    const {
        features,
        network,
        polarization,
        audit4Data,
        isLoading: auditLoading,
        error: auditError
    } = useAuditData();

    const {
        isLoading: reLoading,
        error: reError,
        features: reFeatures,
        recommendations,
        network: reNetwork,
        polarization: rePolarization,
        fairness: reFairness
    } = useREAuditData()

    const [metricToPlot, setMetricToPlot] = useState("ACC");
    const [chartType, setChartType] = useState("bar");
    const [activeSection, setActiveSection] = useState(null);

    // Combined loading state
    if (fairLoading || auditLoading || reLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-400 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    // Error states
    if (!raw) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center max-w-md mx-auto">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">No Data Found</h2>
                    <p className="text-gray-400 mb-6">Unable to fetch data from /api/metrics</p>
                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (auditError || reError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6">
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-red-300">Error Loading Audit Data</h2>
                            <p className="text-red-400">{auditError || reError}</p>
                        </div>
                    </div>
                    <button className="mt-4 bg-gradient-to-r from-red-600 to-orange-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-red-700 hover:to-orange-700 transition-all duration-300">
                        Refresh Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const metricCards = [
        {
            title: 'Fairness Gap Before',
            value: audit4Data.fairness_gap_before.toFixed(4),
            description: 'Initial bias measure',
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/30',
            icon: ArrowUp,
            trend: 'negative'
        },
        {
            title: 'Fairness Gap After',
            value: audit4Data.fairness_gap_after.toFixed(4),
            description: 'Post-mitigation bias',
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/30',
            icon: ArrowDown,
            trend: 'positive'
        },
        {
            title: 'Improvement',
            value: `${audit4Data.improvement_percent.toFixed(1)}%`,
            description: 'Bias reduction',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/30',
            icon: Zap,
            trend: 'positive'
        },
        {
            title: 'Mean Risk Group 0',
            value: audit4Data.mean_risk_group_0.toFixed(4),
            description: 'Protected group',
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/30',
            icon: Target,
            trend: 'neutral'
        },
        {
            title: 'Mean Risk Group 1',
            value: audit4Data.mean_risk_group_1.toFixed(4),
            description: 'Reference group',
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/30',
            icon: Target,
            trend: 'neutral'
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Main Content */}
                <main className="space-y-8">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 rounded-2xl p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                        <div className="relative ">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <Network className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Social Media Bias Detection Dashboard</h1>
                                    <p className="text-blue-100 text-lg opacity-90">Advanced Graph Analytics for Pokec Social Media Platform</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 mt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-blue-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-200">Pokec-n Dataset</p>
                                        <p className="text-xs text-blue-300/70">Nationality vs Gender</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                        <Cpu className="w-5 h-5 text-purple-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-purple-200">Pokec-z Dataset</p>
                                        <p className="text-xs text-purple-300/70">Region vs Gender</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-red-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-red-200">95% Homophily</p>
                                        <p className="text-xs text-red-300/70">Pokec-z shows extreme bias</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Model Audit Dashboard Section */}
                    <section className="space-y-6">
                        {/* Quick Stats & Grouped Metrics */}
                        <div className="space-x-2 space-y-2">
                            {/* Grouped Metrics */}
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Performance Overview</h3>
                                </div>
                                <GroupedMetrics
                                    groupedMetrics={groupedMetrics}
                                    activeSection={activeSection}
                                    setActiveSection={setActiveSection}
                                />

                                <h3 className="mt-6 text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-blue-400" />
                                    Fairness Metrics
                                </h3>
                                <div className="grid grid-flow-col gap-4">
                                    {metricCards.map((card, index) => {
                                        const Icon = card.icon;
                                        return (
                                            <div
                                                key={index}
                                                className={`${card.bgColor} ${card.borderColor} border rounded-xl p-5 hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-sm`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <Icon className={`w-3 h-3 ${card.color}`} />
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.trend === 'positive' ? 'bg-green-500/20 text-green-400' : card.trend === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                        {card.trend}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-gray-400 mb-2">{card.title}</p>
                                                <p className={`text-xl font-bold ${card.color} mb-1`}>{card.value}</p>
                                                <p className="text-xs text-gray-500">{card.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Visualization Grid */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Fairness Metrics */}
                                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                            <Filter className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Fairness Analysis</h3>
                                            <p className="text-sm text-gray-400">Detailed fairness metrics</p>
                                        </div>
                                    </div>
                                    <FairnessMetrics audit4Data={audit4Data} />
                                </div>


                                {/* Polarization Metrics */}
                                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                                            <Target className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Polarization Metrics</h3>
                                            <p className="text-sm text-gray-400">Group opinion divergence</p>
                                        </div>
                                    </div>
                                    <REPolarizationChart polarization={rePolarization} />
                                </div>

                                {/* Feature Attribution */}
                                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                                            <PieChart className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Feature Attribution</h3>
                                            <p className="text-sm text-gray-400">Attribute influence analysis</p>
                                        </div>
                                    </div>
                                    <FeatureChart features={reFeatures} />
                                </div>
                            </div>

                            {/* Additional Metrics Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Network Analysis */}
                                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                            <Network className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Network Analysis</h3>
                                            <p className="text-sm text-gray-400">Social graph visualization</p>
                                        </div>
                                    </div>
                                    <RENetworkGraph network={reNetwork} />
                                </div>

                                {/* Feature Importance */}
                                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                            <BarChart3 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Feature Importance</h3>
                                            <p className="text-sm text-gray-400">Attribute significance ranking</p>
                                        </div>
                                    </div>
                                    <FeatureImportanceChart features={features} />
                                </div>
                            </div>
                        </div>

                        {/* Model Analysis Section */}
                        <div className="mt-8">
                            {/* Section Header */}
                            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 backdrop-blur-sm rounded-2xl p-6 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center">
                                        <TrendingUp className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Model Performance Analysis</h2>
                                        <p className="text-gray-300">Detailed comparison across all GNN models and datasets</p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Grid - Controls & Main Chart */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Controls Sidebar */}
                                <div className="lg:col-span-1">
                                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 h-full">
                                        <ControlsSidebar
                                            raw={raw}
                                            selectedFiles={selectedFiles}
                                            setSelectedFiles={setSelectedFiles}
                                            metricToPlot={metricToPlot}
                                            setMetricToPlot={setMetricToPlot}
                                            chartType={chartType}
                                            setChartType={setChartType}
                                            rows={rows}
                                        />
                                    </div>
                                </div>

                                {/* Main Charts */}
                                <div className="flex flex-col gap-6 lg:col-span-2">
                                    {/* Metric Chart */}
                                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Model Performance Metrics</h3>
                                                <p className="text-sm text-gray-400">Comparison across selected models</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm text-gray-300">Vanilla GNN</span>
                                                <div className="w-3 h-3 bg-green-500 rounded-full ml-3"></div>
                                                <span className="text-sm text-gray-300">FairGNN</span>
                                                <div className="w-3 h-3 bg-purple-500 rounded-full ml-3"></div>
                                                <span className="text-sm text-gray-300">FairVGNN</span>
                                            </div>
                                        </div>
                                        <MetricChart
                                            metricSeries={metricSeries}
                                            metricToPlot={metricToPlot}
                                            chartType={chartType}
                                            selectedFiles={selectedFiles}
                                        />
                                    </div>

                                    {/* AUC Trend Chart */}
                                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                        <AUCTrendChart selectedRows={selectedRows} />
                                    </div>
                                </div>
                            </div>

                            {/* Charts Grid - Row 2 */}
                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Fairness Accuracy */}
                                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                    <FairnessAccuracyChart fairnessAccuracyData={fairnessAccuracyData} />
                                </div>

                                {/* Group Comparison */}
                                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                    <GroupComparisonChart groupComparisonData={groupComparisonData} />
                                </div>

                                {/* Radar Chart */}
                                <div className="bg-gray-800/50 text-white backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                    <RadarChartComponent
                                        radarData={radarData}
                                        selectedFiles={selectedFiles}
                                    />
                                </div>

                                {/* Performance Distribution */}
                                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                                    <PerformanceDistribution performanceDistribution={performanceDistribution} />
                                </div>
                            </div>

                            {/* Summary Table */}
                            <div className="mt-8">
                                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden">
                                    <div className="p-6 border-b border-gray-700">
                                        <h3 className="text-lg font-bold text-white">Model Performance Summary</h3>
                                        <p className="text-sm text-gray-400 mt-1">Detailed metrics across all evaluated models</p>
                                    </div>
                                    <SummaryTable rows={rows} />
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </DashboardLayout>
    );
}