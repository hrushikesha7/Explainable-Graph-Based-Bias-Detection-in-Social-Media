// RadarChartComponent.js - WITH DEBUGGING
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from "recharts";
import Card from "./ui/Card";
import { COLORS } from "@/hooks/constants";
import { formatVal } from "@/hooks/formatter";
import { useEffect } from "react";

export default function RadarChartComponent({ radarData, selectedFiles }) {
    // Debug: Check what's in radarData
    useEffect(() => {
        if (radarData && radarData.length > 0) {
            console.log("Radar Data Structure:", radarData);
            console.log("First data point keys:", Object.keys(radarData[0]));
            console.log("Selected files:", selectedFiles);
        }
    }, [radarData, selectedFiles]);

    // If no data, show a message
    if (!radarData || radarData.length === 0) {
        return (
            <Card className="p-4">
                <h3 className="font-semibold text-white mb-4">Multi-Metric Comparison (Radar)</h3>
                <div className="h-[300px] flex items-center justify-center">
                    <p className="text-gray-500">No radar data available</p>
                </div>
            </Card>
        );
    }

    // Get the actual keys that exist in the data (excluding 'metric')
    const firstDataPoint = radarData[0];
    const availableKeys = Object.keys(firstDataPoint).filter(key => key !== 'metric');

    console.log("Available keys in radar data:", availableKeys);

    return (
        <Card className="p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Multi-Metric Comparison (Radar)</h3>
            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                    <RadarChart data={radarData}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="metric" stroke="#4B5563" />
                        <PolarRadiusAxis stroke="#4B5563" />
                        {/* Use the actual keys that exist in the data */}
                        {availableKeys.slice(0, 3).map((key, idx) => (
                            <Radar
                                key={key}
                                name={key}
                                dataKey={key}
                                stroke={COLORS[idx % COLORS.length]}
                                fill={COLORS[idx % COLORS.length]}
                                fillOpacity={0.2}
                                strokeWidth={1.5}
                            />
                        ))}
                        <Legend />
                        <Tooltip formatter={(value) => formatVal(value)} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}