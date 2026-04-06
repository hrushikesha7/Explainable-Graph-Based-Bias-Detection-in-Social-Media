// MetricChart.js - Updated
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line, AreaChart, Area, ResponsiveContainer } from "recharts";
import Card from "./ui/Card";
import { formatVal } from "@/hooks/formatter";

export default function MetricChart({ metricSeries, metricToPlot, chartType, selectedFiles }) {
    const chartConfig = {
        bar: {
            component: BarChart,
            element: (props) => <Bar {...props} fill="#3B82F6" radius={[4, 4, 0, 0]} />,
            extraProps: {}
        },
        line: {
            component: LineChart,
            element: (props) => <Line {...props} type="monotone" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />,
            extraProps: {}
        },
        area: {
            component: AreaChart,
            element: (props) => <Area {...props} type="monotone" fill="#93C5FD" stroke="#3B82F6" fillOpacity={0.3} />,
            extraProps: {}
        }
    };

    const ChartComponent = chartConfig[chartType]?.component || BarChart;
    const ChartElement = chartConfig[chartType]?.element;

    return (
        <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">{metricToPlot} across runs</h3>
                <div className="text-xs text-gray-500">
                    {metricSeries.length} runs selected
                </div>
            </div>
            <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                    <ChartComponent data={metricSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="label"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            fontSize={12}
                            tickFormatter={(value) => {
                                // Truncate long labels
                                if (value.length > 20) {
                                    return value.substring(0, 17) + '...';
                                }
                                return value;
                            }}
                        />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => [formatVal(value), metricToPlot]}
                            labelFormatter={(label) => `Run: ${label}`}
                        />
                        <Legend />
                        {ChartElement && <ChartElement dataKey={metricToPlot} name={metricToPlot} />}
                    </ChartComponent>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}