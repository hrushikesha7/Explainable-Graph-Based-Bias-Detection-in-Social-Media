import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import ChartContainer from '../ChartContainer'

export default function FeatureChart() {
    const features = [
        { feature: "ist do posilkovne", impact: -0.028 },
        { feature: "priatelky", impact: -0.025 },
        { feature: "dlhodoby seriozny vztah", impact: 0.025 },
        { feature: "spanie", impact: 0.025 },
        { feature: "cestovanie", impact: -0.022 }
    ]

    const sortedFeatures = [...features].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

    return (
        <ChartContainer title="Feature Attribution for User 65965">
            <div className="mb-3">
                <p className="text-xs text-gray-600">
                    Impact on Prediction Score
                    <span className="ml-1 text-gray-500 italic">
                        (Positive = Increases Recommendation)
                    </span>
                </p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={sortedFeatures}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis
                        type="number"
                        domain={[-0.03, 0.03]}
                        tickFormatter={(value) => value.toFixed(3)}
                        ticks={[-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03]}
                        tick={{ fontSize: 11 }}
                    />
                    <YAxis
                        type="category"
                        dataKey="feature"
                        width={100}
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                    />
                    <Tooltip
                        formatter={(value) => {
                            const numValue = parseFloat(value)
                            return [`${numValue > 0 ? '+' : ''}${numValue.toFixed(3)}`, 'Impact']
                        }}
                        labelFormatter={(label) => label}
                        contentStyle={{ fontSize: 11, padding: 8 }}
                    />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={20}>
                        {sortedFeatures.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.impact > 0 ? "#3498db" : "#e74c3c"} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Compact Legend */}
            <div className="flex justify-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#3498db] rounded-sm"></div>
                    <span className="text-gray-600">Positive Impact</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#e74c3c] rounded-sm"></div>
                    <span className="text-gray-600">Negative Impact</span>
                </div>
            </div>
        </ChartContainer>
    )
}