import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import Card from "./ui/Card";
import { formatVal } from "@/hooks/formatter";

export default function AUCTrendChart({ selectedRows }) {
    return (
        <Card className="p-4">
            <h3 className="font-semibold text-white mb-4">AUC-ROC & Accuracy Trend</h3>
            <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer>
                    <LineChart data={selectedRows.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="file" angle={-45} textAnchor="end" height={40} fontSize={10} />
                        <YAxis />
                        <Tooltip formatter={(value) => formatVal(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="AUCROC" name="AUC-ROC" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="ACC" name="Accuracy" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}