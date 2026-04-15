import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell, ResponsiveContainer } from "recharts";
import Card from "./ui/Card";
import { formatVal } from "@/hooks/formatter";

export default function FairnessAccuracyChart({ fairnessAccuracyData }) {
    return (
        <Card className="p-4">
            <h3 className="font-semibold text-white mb-4">Fairness vs Accuracy Trade-off</h3>
            <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                    <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="fairnessIndex"
                            name="Fairness Index (√(SP² + EO²))"
                            type="number"
                            label={{ value: 'Fairness Index', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                            dataKey="ACC"
                            name="Accuracy"
                            label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                            formatter={(value, name) => [formatVal(value), name]}
                            labelFormatter={(label) => `File: ${label}`}
                        />
                        <Legend />
                        <Scatter
                            name="Runs"
                            data={fairnessAccuracyData}
                            fill="#8884d8"
                            shape="circle"
                        >
                            {fairnessAccuracyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.SP > 0.1 ? "#EF4444" : entry.EO > 0.1 ? "#F59E0B" : "#10B981"} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}