// GroupComparisonChart.js - Updated
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import Card from "./ui/Card";

export default function GroupComparisonChart({ groupComparisonData }) {
    return (
        <Card className="p-4">
            <h3 className="font-semibold text-white mb-4">Performance by Sensitive Group</h3>
            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={groupComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="file"
                            tickFormatter={(value) => value.length > 10 ? value.substring(0, 8) + '...' : value}
                        />
                        <YAxis />
                        <Tooltip
                            formatter={(value, name, props) => {
                                const group = props.payload.group;
                                const model = props.payload.model;
                                const dataset = props.payload.dataset;
                                return [
                                    value?.toFixed(3) || 'N/A',
                                    `${name} (${group}) - ${model} on ${dataset}`
                                ];
                            }}
                        />
                        <Legend />
                        <Bar dataKey="ACC" name="sens0" fill="#3B82F6" />
                        <Bar dataKey="ACC" name="sens1" fill="#10B981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}