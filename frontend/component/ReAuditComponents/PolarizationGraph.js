import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
    ReferenceLine
} from 'recharts'
import ChartContainer from '../ChartContainer'

export const REPolarizationChart = ({ polarization }) => {
    // Check if we have valid polarization data
    if (
        !Array.isArray(polarization) ||
        polarization.length !== 2 ||
        !polarization[0]?.values ||
        !polarization[1]?.values
    ) {
        console.warn('Invalid polarization data:', polarization)
        return (
            <ChartContainer title="Opinion Polarization Audit: Group Disparity">
                <div className="flex flex-col items-center justify-center h-[350px] p-4">
                    <p className="text-gray-500 mb-4">No polarization data available</p>
                    <div className="text-xs text-gray-400">
                        Expected data: Array with 2 groups containing score distributions
                    </div>
                </div>
            </ChartContainer>
        )
    }

    // Calculate means for both groups
    const mean0 = polarization[0].mean ||
        polarization[0].values.reduce((a, b) => a + b, 0) / polarization[0].values.length
    const mean1 = polarization[1].mean ||
        polarization[1].values.reduce((a, b) => a + b, 0) / polarization[1].values.length

    // Create histogram-like data from score distributions
    const createHistogramData = (scores, bins = 20) => {
        const histogram = {}
        scores.forEach(score => {
            // Bin the score to nearest 0.05
            const bin = Math.round(score * bins) / bins
            histogram[bin] = (histogram[bin] || 0) + 1
        })

        // Normalize to density
        const total = scores.length
        const data = Object.entries(histogram).map(([x, count]) => ({
            score: parseFloat(x),
            density: count / total
        }))

        return data.sort((a, b) => a.score - b.score)
    }

    // Generate histogram data for both groups
    const histogram0 = createHistogramData(polarization[0].values)
    const histogram1 = createHistogramData(polarization[1].values)

    // Combine into chart data (assuming same score bins)
    const chartData = histogram0.map((item, i) => ({
        score: item.score,
        group0: item.density,
        group1: histogram1[i]?.density || 0
    }))

    // Determine polarization status
    const getPolarizationStatus = () => {
        const meanDiff = Math.abs(mean0 - mean1)
        if (meanDiff < 0.05) return { status: "Minimal Polarization", color: "text-green-600" }
        if (meanDiff < 0.15) return { status: "Moderate Polarization", color: "text-yellow-600" }
        return { status: "High Polarization", color: "text-red-600" }
    }

    const polarizationStatus = getPolarizationStatus()

    return (
        <ChartContainer title="Opinion Polarization Audit: Group Disparity">
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8884d8]"></div>
                        <span className="text-xs font-medium">Group 0 (Mean: {mean0.toFixed(2)})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#82ca9d]"></div>
                        <span className="text-xs font-medium">Group 1 (Mean: {mean1.toFixed(2)})</span>
                    </div>
                </div>
                <div className={`text-xs font-semibold ${polarizationStatus.color}`}>
                    Result: {polarizationStatus.status}
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                    data={chartData}
                    margin={{ top: 0, right: 0, left: -5.5, bottom: 40 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                    <XAxis
                        dataKey="score"
                        type="number"
                        domain={[0, 1]}
                        tickCount={6}
                        label={{
                            value: 'Predicted Score (0=Low, 1=High)',
                            position: 'insideBottom',
                            offset: -20,
                            style: { fontSize: 12 }
                        }}
                        tick={{ fontSize: 11 }}
                    />

                    <YAxis
                        label={{
                            value: 'Density',
                            angle: -90,
                            position: 'insideLeft',
                            offset: 10,
                            style: { fontSize: 12 }
                        }}
                        tick={{ fontSize: 11 }}
                    />

                    <Tooltip
                        formatter={(value, name) => [
                            typeof value === 'number' ? value.toFixed(4) : value,
                            name === 'group0' ? 'Group 0 Density' : 'Group 1 Density'
                        ]}
                        labelFormatter={(score) => `Score: ${score.toFixed(2)}`}
                    />

                    <Legend
                        verticalAlign="top"
                        height={36}
                        wrapperStyle={{ paddingTop: 1 }}
                    />

                    {/* Reference lines for means */}
                    <ReferenceLine
                        x={mean0}
                        stroke="#8884d8"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                        label={{
                            value: `Mean: ${mean0.toFixed(2)}`,
                            position: 'top',  // Change to top
                            offset: 3,       // Add offset to push it up
                            fill: '#8884d8',
                            fontSize: 10
                        }}
                    />

                    <ReferenceLine
                        x={mean1}
                        stroke="#82ca9d"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                        label={{
                            value: `Mean: ${mean1.toFixed(2)}`,
                            position: 'bottom',  // Change to bottom
                            offset: 20,          // Add offset to push it down
                            fill: '#82ca9d',
                            fontSize: 10
                        }}
                    />

                    <Area
                        type="monotone"
                        dataKey="group0"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        strokeWidth={2}
                        name="Group 0"
                        connectNulls
                    />

                    <Area
                        type="monotone"
                        dataKey="group1"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.3}
                        strokeWidth={2}
                        name="Group 1"
                        connectNulls
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartContainer>
    )
}