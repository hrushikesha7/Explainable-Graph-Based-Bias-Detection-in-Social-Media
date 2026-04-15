import Card from "./ui/Card";
import { Settings, BarChart3, Filter, Activity, ChevronDown, X, Check, PieChart, LineChart, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

export default function ControlsSidebar({
    raw,
    selectedFiles,
    setSelectedFiles,
    metricToPlot,
    setMetricToPlot,
    chartType,
    setChartType,
    rows
}) {
    const [showFileDropdown, setShowFileDropdown] = useState(false);

    // Select all files by default on component mount
    useEffect(() => {
        if (raw && Object.keys(raw).length > 0 && selectedFiles.length === 0) {
            setSelectedFiles(Object.keys(raw));
        }
    }, [raw, selectedFiles.length, setSelectedFiles]);

    const metricOptions = [
        { value: "ACC", label: "Accuracy", color: "text-green-400", bg: "bg-green-500/20", icon: "✓" },
        { value: "AUCROC", label: "AUC-ROC", color: "text-purple-400", bg: "bg-purple-500/20", icon: "📊" },
        { value: "F1", label: "F1 Score", color: "text-blue-400", bg: "bg-blue-500/20", icon: "⚡" },
        { value: "SP", label: "Stat Parity", color: "text-orange-400", bg: "bg-orange-500/20", icon: "⚖️" },
        { value: "EO", label: "Equal Opp", color: "text-red-400", bg: "bg-red-500/20", icon: "=" },
    ];

    const chartTypes = [
        { type: "bar", label: "Bar", icon: <BarChart3 className="w-4 h-4" /> },
        { type: "line", label: "Line", icon: <LineChart className="w-4 h-4" /> },
        { type: "area", label: "Area", icon: <TrendingUp className="w-4 h-4" /> }
    ];

    // Quick stats
    const uniqueModels = [...new Set(rows.map(r => r.model))].length;
    const avgAccuracy = rows.length > 0
        ? (rows.reduce((sum, r) => sum + (r.ACC || 0), 0) / rows.length).toFixed(3)
        : "0.000";

    const avgFairness = rows.length > 0
        ? ((Math.abs(rows.reduce((sum, r) => sum + (r.SP || 0), 0) / rows.length) +
            Math.abs(rows.reduce((sum, r) => sum + (r.EO || 0), 0) / rows.length)) / 2).toFixed(3)
        : "0.000";

    // Get all available files from raw data
    const allFiles = raw ? Object.keys(raw) : [];

    // Select/Deselect all files
    const handleSelectAll = () => {
        if (selectedFiles.length === allFiles.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles([...allFiles]);
        }
    };

    // Select/Deselect individual file
    const handleFileToggle = (file) => {
        if (selectedFiles.includes(file)) {
            setSelectedFiles(prev => prev.filter(x => x !== file));
        } else {
            setSelectedFiles(prev => [...prev, file]);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">Chart Controls</h3>
                        <p className="text-sm text-gray-400">Configure visualization parameters</p>
                    </div>
                </div>
                <div className="text-xs font-medium text-blue-400 bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
                    {selectedFiles.length}/{allFiles.length}
                </div>
            </div>

            {/* Chart Type & Metric Selection */}
            <div className="space-y-6">
                {/* Chart Type Selection */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-gray-300">Chart Type</span>
                    </div>
                    <div className="flex gap-2 bg-gray-800/50 p-1.5 rounded-xl border border-gray-700">
                        {chartTypes.map(({ type, label, icon }) => (
                            <button
                                key={type}
                                onClick={() => setChartType(type)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all duration-200 ${chartType === type
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
                            >
                                <div className={`${chartType === type ? 'text-white' : 'text-gray-500'}`}>
                                    {icon}
                                </div>
                                <span className="text-sm font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Metric Selection */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-gray-300">Performance Metric</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {metricOptions.map(({ value, label, color, bg, icon }) => (
                            <button
                                key={value}
                                onClick={() => setMetricToPlot(value)}
                                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl transition-all duration-200 border ${metricToPlot === value
                                    ? `${bg} border-blue-500/50 text-white shadow-md`
                                    : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:bg-gray-800/50 hover:border-gray-600'
                                    }`}
                            >
                                <span className="text-sm">{icon}</span>
                                <span className="text-sm font-medium">{label}</span>
                                <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`}></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* File Selection - Dropdown Button */}
            <div className="relative">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-gray-300">Dataset Files</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSelectAll}
                            className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 transition-all"
                        >
                            {selectedFiles.length === allFiles.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                </div>

                {/* Dropdown Trigger Button */}
                <button
                    onClick={() => setShowFileDropdown(!showFileDropdown)}
                    className="w-full flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800/80 hover:border-blue-500/50 transition-all duration-200 group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-pink-500/30">
                            <Filter className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-medium text-white">
                                {selectedFiles.length > 0
                                    ? `${selectedFiles.length} files selected`
                                    : 'Select files'}
                            </div>
                            <div className="text-xs text-gray-400">
                                Click to choose files
                            </div>
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-transform duration-200 ${showFileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {selectedFiles.slice(0, 4).map(file => (
                            <div key={file} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 flex items-center gap-2 hover:bg-blue-500/30 transition-colors">
                                <span className="truncate max-w-[100px]">{file}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileToggle(file);
                                    }}
                                    className="text-blue-400 hover:text-red-400 transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {selectedFiles.length > 4 && (
                            <div className="text-xs text-gray-400 px-3 py-1.5">
                                +{selectedFiles.length - 4} more
                            </div>
                        )}
                    </div>
                )}

                {/* File Selection Dropdown */}
                {showFileDropdown && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-2xl border border-gray-700 max-h-96 overflow-hidden backdrop-blur-sm">
                        <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-800/80 to-gray-900/80">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-lg text-white">Dataset Files</h4>
                                <button
                                    onClick={() => setShowFileDropdown(false)}
                                    className="text-gray-500 hover:text-white p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 mt-3">
                                <div className="text-sm text-gray-400">
                                    {selectedFiles.length} of {allFiles.length} selected
                                </div>
                                <div className="flex-1"></div>
                                <button
                                    onClick={handleSelectAll}
                                    className="text-sm px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 rounded-lg hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 transition-all"
                                >
                                    {selectedFiles.length === allFiles.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-72">
                            {allFiles.map((file) => {
                                const isSelected = selectedFiles.includes(file);
                                const fileData = raw[file];
                                const accuracy = fileData?.best?.ACC || 0;
                                const modelCount = Object.keys(fileData?.all || {}).length;

                                return (
                                    <button
                                        key={file}
                                        onClick={() => handleFileToggle(file)}
                                        className={`w-full flex items-center justify-between p-4 transition-all duration-200 ${isSelected
                                            ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-l-4 border-blue-500'
                                            : 'hover:bg-gray-800/50 border-l-4 border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 border-2 rounded-lg flex items-center justify-center ${isSelected
                                                ? 'bg-blue-500 border-blue-500'
                                                : 'border-gray-600 hover:border-gray-500'}`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-white truncate max-w-[220px]">
                                                    {file}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`text-xs ${accuracy > 0.7 ? 'text-green-400' : accuracy > 0.6 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                        {accuracy.toFixed(3)} ACC
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {modelCount} models
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-xs font-medium px-2 py-1 rounded ${isSelected
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-gray-800 text-gray-400'}`}>
                                            {file.includes('z') ? 'Pokec-z' : 'Pokec-n'}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-gray-800 bg-gradient-to-r from-gray-900/80 to-black/80">
                            <div className="text-sm text-gray-400">
                                Select files for comparison. No limit on selection.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="pt-4 border-t border-gray-800">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Summary Statistics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-3 rounded-xl border border-gray-700 hover:border-blue-500/30 transition-all duration-200">
                        <div className="text-xs text-gray-400 font-medium">Total Runs</div>
                        <div className="text-lg font-bold text-white mt-1">{rows.length}</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-3 rounded-xl border border-gray-700 hover:border-green-500/30 transition-all duration-200">
                        <div className="text-xs text-gray-400 font-medium">Avg ACC</div>
                        <div className={`text-lg font-bold mt-1 ${parseFloat(avgAccuracy) > 0.7 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {avgAccuracy}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-3 rounded-xl border border-gray-700 hover:border-purple-500/30 transition-all duration-200">
                        <div className="text-xs text-gray-400 font-medium">Models</div>
                        <div className="text-lg font-bold text-purple-400 mt-1">{uniqueModels}</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-3 rounded-xl border border-gray-700 hover:border-orange-500/30 transition-all duration-200">
                        <div className="text-xs text-gray-400 font-medium">Avg Fairness</div>
                        <div className={`text-lg font-bold mt-1 ${parseFloat(avgFairness) < 0.05 ? 'text-green-400' : 'text-orange-400'}`}>
                            {avgFairness}
                        </div>
                    </div>
                </div>
            </div>

            {/* Backdrop for dropdown */}
            {showFileDropdown && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={() => setShowFileDropdown(false)}
                />
            )}
        </div>
    );
}