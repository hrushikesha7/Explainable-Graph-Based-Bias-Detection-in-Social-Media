// SummaryTable.js - Updated for dark theme
import Card from "./ui/Card";
import { formatVal } from "@/hooks/formatter";
import { TrendingUp, TrendingDown, Clock, BarChart3 } from "lucide-react";

export default function SummaryTable({ rows }) {
    const headers = ["File", "Model", "Dataset", "ACC", "AUCROC", "F1", "SP", "EO", "Time"];

    const getModelColor = (model) => {
        switch (model?.toLowerCase()) {
            case 'vanilla gnn': return 'text-blue-400';
            case 'fairgnn': return 'text-green-400';
            case 'fairvgnn': return 'text-purple-400';
            default: return 'text-gray-300';
        }
    };

    const getModelBg = (model) => {
        switch (model?.toLowerCase()) {
            case 'vanilla gnn': return 'bg-blue-500/10';
            case 'fairgnn': return 'bg-green-500/10';
            case 'fairvgnn': return 'bg-purple-500/10';
            default: return 'bg-gray-800';
        }
    };

    const getDatasetColor = (dataset) => {
        return dataset?.includes('z') ? 'text-purple-300' : 'text-blue-300';
    };

    const getDatasetBg = (dataset) => {
        return dataset?.includes('z') ? 'bg-purple-500/10' : 'bg-blue-500/10';
    };

    return (
        <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-white">Model Performance Results</h3>
                        <p className="text-sm text-gray-400">Detailed metrics across all model runs</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="text-sm text-gray-300 font-medium">{rows.length} total runs</span>

                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-700">
                <table className="w-full text-sm">
                    <thead className="bg-gray-900/80 border-b border-gray-700">
                        <tr>
                            {headers.map((h) => (
                                <th key={h} className="px-6 py-4 font-medium text-gray-300 text-left">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {rows.slice(0, 10).map((r, index) => (
                            <tr
                                key={r.id}
                                className="hover:bg-gray-700/50 transition-all duration-200 group"
                            >
                                {/* File */}
                                <td className="px-6 py-4 font-mono text-xs text-gray-400 group-hover:text-gray-300">
                                    {r.file}
                                </td>

                                {/* Model */}
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getModelBg(r.model)} ${getModelColor(r.model)}`}>
                                        {r.model}
                                    </span>
                                </td>

                                {/* Dataset */}
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getDatasetBg(r.dataset)} ${getDatasetColor(r.dataset)}`}>
                                        {r.dataset || 'N/A'}
                                    </span>
                                </td>

                                {/* Accuracy */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {r.ACC > 0.7 ? (
                                            <TrendingUp className="w-4 h-4 text-green-400" />
                                        ) : r.ACC > 0.6 ? (
                                            <TrendingUp className="w-4 h-4 text-yellow-400" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-400" />
                                        )}
                                        <span className={`font-medium ${r.ACC > 0.7 ? "text-green-400" :
                                            r.ACC > 0.6 ? "text-yellow-400" :
                                                "text-red-400"
                                            }`}>
                                            {formatVal(r.ACC)}
                                        </span>
                                    </div>
                                </td>

                                {/* AUCROC */}
                                <td className="px-6 py-4">
                                    <span className={`font-medium ${r.AUCROC > 0.8 ? "text-green-400" :
                                        r.AUCROC > 0.7 ? "text-blue-400" :
                                            "text-gray-400"
                                        }`}>
                                        {formatVal(r.AUCROC)}
                                    </span>
                                </td>

                                {/* F1 Score */}
                                <td className="px-6 py-4">
                                    <span className={`font-medium ${r.F1 > 0.75 ? "text-green-400" :
                                        r.F1 > 0.65 ? "text-blue-400" :
                                            "text-gray-400"
                                        }`}>
                                        {formatVal(r.F1)}
                                    </span>
                                </td>

                                {/* Statistical Parity */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${Math.abs(r.SP) < 0.05
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-red-500/20 text-red-400"
                                            }`}>
                                            {formatVal(r.SP)}
                                        </span>
                                        {Math.abs(r.SP) < 0.05 ? (
                                            <span className="text-xs text-green-400">✓ Fair</span>
                                        ) : (
                                            <span className="text-xs text-red-400">⚠ Bias</span>
                                        )}
                                    </div>
                                </td>

                                {/* Equality of Opportunity */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${Math.abs(r.EO) < 0.05
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-red-500/20 text-red-400"
                                            }`}>
                                            {formatVal(r.EO)}
                                        </span>
                                        {Math.abs(r.EO) < 0.05 ? (
                                            <span className="text-xs text-green-400">✓ Fair</span>
                                        ) : (
                                            <span className="text-xs text-red-400">⚠ Bias</span>
                                        )}
                                    </div>
                                </td>

                                {/* Time */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-300">
                                            {formatVal(r.time)}s
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Table Footer */}
                {rows.length > 10 && (
                    <div className="bg-gray-900/50 border-t border-gray-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                Showing 10 of {rows.length} runs. Scroll for more →
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-400">Excellent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <span className="text-gray-400">Good</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-gray-400">Needs Improvement</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="text-sm font-medium text-gray-300">Model Colors</h4>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>Vanilla GNN</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>FairGNN</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            <span>FairVGNN</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <h4 className="text-sm font-medium text-gray-300">Dataset Colors</h4>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>Pokec-n (Nationality)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            <span>Pokec-z (Region)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h4 className="text-sm font-medium text-gray-300">Fairness Indicators</h4>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                            <span className="text-green-400">✓ Fair</span>
                            <span>SP/EO &lt; 0.05</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-red-400">⚠ Bias</span>
                            <span>SP/EO ≥ 0.05</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <h4 className="text-sm font-medium text-gray-300">Performance Levels</h4>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                            <span className="text-green-400">≥ 0.7</span>
                            <span>Excellent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-400">0.6-0.7</span>
                            <span>Good</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-red-400">≤ 0.6</span>
                            <span>Needs Improvement</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}