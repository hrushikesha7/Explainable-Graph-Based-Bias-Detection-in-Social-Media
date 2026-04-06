import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import ChartContainer from './ChartContainer'

export default function PolarizationChart({ polarization = [] }) {
    const polarizationData = polarization.map((v, i) => ({
        index: i,
        score: v,
        label: `Instance ${i + 1}`
    }))

    if (!polarization.length) {
        return (
            <ChartContainer title="Polarization Scores">
                <div className="flex items-center justify-center h-[300px]">
                    <p className="text-gray-500">No polarization data available</p>
                </div>
            </ChartContainer>
        )
    }

    return (
        <ChartContainer title="Polarization Scores">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={polarizationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="index"
                        tickFormatter={(index) => index + 1}
                        label={{ value: 'Instance Index', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                        formatter={(value) => [value.toFixed(4), 'Score']}
                        labelFormatter={(index) => `Instance ${index + 1}`}
                    />
                    <Legend />
                    <Bar
                        dataKey="score"
                        fill="#82ca9d"
                        name="Polarization Score"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    )
}