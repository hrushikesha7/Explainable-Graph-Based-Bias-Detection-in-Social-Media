import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import Card from "./ui/Card";

export default function PerformanceDistribution({ performanceDistribution }) {
    return (
        <Card className="p-4">
            <h3 className="font-semibold text-white mb-4">Performance Distribution</h3>
            <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer>
                    <BarChart data={performanceDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="metric" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avg" name="Average" fill="#3B82F6" />
                        <Bar dataKey="max" name="Maximum" fill="#10B981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}