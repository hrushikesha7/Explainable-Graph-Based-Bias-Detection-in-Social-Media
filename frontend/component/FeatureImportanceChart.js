import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import ChartContainer from './ChartContainer'

export default function FeatureImportanceChart({ features = [] }) {
    if (!features.length) {
        return (
            <ChartContainer title="Feature Attention">
                <div className="flex items-center justify-center h-[300px]">
                    <p className="text-gray-500">No feature data available</p>
                </div>
            </ChartContainer>
        )
    }

    return (
        <ChartContainer title="Feature Audit: Top Ten Features Hidden by Model">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={features}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="feature"
                        angle={-35}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 7 }}
                    />
                    <YAxis />
                    <Tooltip
                        formatter={(value) => [value.toFixed(4), 'Attention Score']}
                        labelStyle={{ fontWeight: 'normal', fontSize: '1px' }}
                    />
                    <Legend />
                    <Bar
                        dataKey="attention_score"
                        fill="#8884d8"
                        name="Attention Score"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    )
}