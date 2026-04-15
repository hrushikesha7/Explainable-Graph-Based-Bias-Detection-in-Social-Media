import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, LabelList } from 'recharts'
import ChartContainer from './ChartContainer'

export default function FairnessMetrics({ audit4Data }) {
    // Use provided data or fallback to hardcoded values
    const data = audit4Data || {
        before: 0.0350,
        after: 0.0158,
        improvement_percent: ((0.0350 - 0.0158) / 0.0350 * 100).toFixed(1)
    }

    // Determine bias level for each value
    const getBiasLevel = (value) => {
        if (value >= 0.03) return "High Bias"
        if (value >= 0.02) return "Moderate Bias"
        if (value >= 0.01) return "Low Bias"
        return "Fair"
    }

    const getBiasColor = (value) => {
        if (value >= 0.03) return "#ef4444" // red-500
        if (value >= 0.02) return "#f59e0b" // amber-500
        if (value >= 0.01) return "#3b82f6" // blue-500
        return "#10b981" // emerald-500
    }

    const chartData = [
        {
            name: "Before (Raw Data)",
            value: data.before || 0.0350,
            label: getBiasLevel(data.before || 0.0350),
            color: getBiasColor(data.before || 0.0350)
        },
        {
            name: "After (FairVGNN)",
            value: data.after || 0.0158,
            label: getBiasLevel(data.after || 0.0158),
            color: getBiasColor(data.after || 0.0158)
        }
    ]

    // Custom label component for inside bars
    const renderCustomLabel = (props) => {
        const { x, y, width, height, value } = props;
        return (
            <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                fill="white"
                fontWeight="bold"
                fontSize={12}
                dy={4}
            >
                {typeof value === 'number' ? value.toFixed(4) : value}
            </text>
        );
    };

    return (
        <ChartContainer title="Bias Mitigation: Before vs. After" className="">
            <div className="mb-4">
                <h3 className="text-xs font-normal text-gray-700 mb-1">
                    Demographic Parity Gap (Lower is Better)
                </h3>
            </div>

            {/* Chart */}
            <div className="mb-8">
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 40, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 5, fontWeight: 500 }}
                        />
                        <YAxis
                            domain={[0, 0.045]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 5 }}
                            tickFormatter={(value) => value.toFixed(3)}
                        />
                        <Tooltip
                            formatter={(value) => [
                                <div key="tooltip">
                                    <span className="font-normal">{typeof value === 'number' ? value.toFixed(4) : value}</span>
                                </div>,
                                'Demographic Parity Gap'
                            ]}
                            labelFormatter={(name) => name}
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        />
                        <Legend />
                        <Bar
                            dataKey="value"
                            name="Demographic Parity Gap"
                            radius={[4, 4, 4, 4]}
                            barSize={80}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <LabelList dataKey="value" content={renderCustomLabel} />
                        </Bar>

                        {/* Add bias level labels above bars */}
                        {chartData.map((entry, index) => (
                            <text
                                key={`label-${index}`}
                                x={index * 109 + 100} // Adjust based on your chart width
                                y={30}
                                textAnchor="middle"
                                fill={entry.color}
                                fontWeight="bold"
                                fontSize={11}
                            >
                                {entry.label}
                            </text>
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>



            {/* Summary
            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-2">Summary</h3>
                <p className="text-blue-700">
                    The fairness gap improved by{' '}
                    <span className="font-bold text-green-600">
                        {data.improvement_percent || ((0.0350 - 0.0158) / 0.0350 * 100).toFixed(1)}%
                    </span>
                    , reducing from {(data.before || 0.0350).toFixed(4)} to {(data.after || 0.0158).toFixed(4)}.
                    This represents a significant reduction in model bias across demographic groups.
                </p>
            </div> */}
        </ChartContainer>
    )
}