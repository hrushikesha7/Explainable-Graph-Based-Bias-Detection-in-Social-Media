import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Card from "./ui/Card";
import { COLORS } from "@/hooks/constants";
import { formatVal } from "@/hooks/formatter";

export default function TopModelsPieChart({ topModels }) {
    return (
        <Card className="p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Top 5 Models by Accuracy</h3>
            <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={topModels}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ file, ACC }) => `${file.split('_')[0]}\n${formatVal(ACC)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="ACC"
                            nameKey="file"
                        >
                            {topModels.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatVal(value)} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}