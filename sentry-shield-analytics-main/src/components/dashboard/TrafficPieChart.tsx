import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getTrafficDistribution } from "@/api/idsApi";

type TrafficDistribution = {
  normal: number;
  malicious: number;
};

export default function TrafficPieChart() {
  const [distribution, setDistribution] = useState<TrafficDistribution>({
    normal: 0,
    malicious: 0,
  });

  useEffect(() => {
    const loadDistribution = async () => {
      try {
        const result = await getTrafficDistribution();
        setDistribution({
          normal: result.normal ?? 0,
          malicious: result.malicious ?? 0,
        });
      } catch (error) {
        console.error("Failed to load traffic distribution", error);
      }
    };

    loadDistribution();
    const interval = setInterval(loadDistribution, 5000);

    return () => clearInterval(interval);
  }, []);

  const data = [
    { name: "Normal Traffic", value: distribution.normal, color: "hsl(142 76% 36%)" },
    { name: "Malicious Traffic", value: distribution.malicious, color: "hsl(0 72% 51%)" },
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = total > 0 ? data : [{ name: "No Traffic Yet", value: 1, color: "hsl(217 33% 24%)" }];

  return (
    <div className="rounded-xl border border-border bg-card p-6 gradient-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Traffic Distribution</h3>
        <p className="text-sm text-muted-foreground">Normal vs Malicious</p>
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222 47% 8%)",
                border: "1px solid hsl(217 33% 17%)",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [
                total > 0
                  ? `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`
                  : "Waiting for classified flows",
                "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
