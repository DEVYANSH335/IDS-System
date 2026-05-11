import { useEffect, useState } from "react";
import {
LineChart,
Line,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer,
} from "recharts";
import { getTraffic } from "@/api/idsApi";

interface TrafficData {
time: string;
traffic: number;
}

export default function TrafficChart() {
const [data, setData] = useState<TrafficData[]>([]);

useEffect(() => {
const loadTraffic = async () => {
const result = await getTraffic();
setData(result);
};


loadTraffic();

const interval = setInterval(loadTraffic, 5000);
return () => clearInterval(interval);


}, []);

return ( <div className="rounded-xl border border-border bg-card p-6 gradient-border"> <div className="mb-6"> <h3 className="text-lg font-semibold text-foreground">
Network Traffic </h3> <p className="text-sm text-muted-foreground">
Real-time traffic monitoring </p> </div>

  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="traffic" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>


);
}
