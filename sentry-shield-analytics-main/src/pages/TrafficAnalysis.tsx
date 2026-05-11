import { useEffect, useState } from "react";
import { Search, Download, ShieldAlert } from "lucide-react";

import { createDemoAttack, getTrafficAnalysis } from "@/api/idsApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface TrafficEntry {
  id: string;
  flowId: string;
  protocol: string;
  packetRate: number;
  flowDuration: number;
  prediction: "Normal" | "Attack";
  confidence: number;
  timestamp: string;
}

export default function TrafficAnalysis() {
  const [trafficData, setTrafficData] = useState<TrafficEntry[]>([]);
  const [search, setSearch] = useState("");
  const [protocol, setProtocol] = useState("all");
  const [trafficType, setTrafficType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const loadTrafficAnalysis = async () => {
    setLoading(true);

    try {
      const result = await getTrafficAnalysis();
      setTrafficData(result);
    } catch (error) {
      toast({
        title: "Backend Offline",
        description: "Live traffic analysis is not available",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrafficAnalysis();
    const interval = setInterval(loadTrafficAnalysis, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredData = trafficData.filter((entry) => {
    const matchesSearch = entry.flowId
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesProtocol =
      protocol === "all" || entry.protocol === protocol;
    const matchesType =
      trafficType === "all" || entry.prediction === trafficType;
    return matchesSearch && matchesProtocol && matchesType;
  });

  const handleExportCSV = () => {
    const headers = [
      "Flow ID",
      "Protocol",
      "Packet Rate",
      "Flow Duration",
      "Prediction",
      "Confidence",
      "Timestamp",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredData.map((e) =>
        [
          e.flowId,
          e.protocol,
          e.packetRate,
          e.flowDuration,
          e.prediction,
          e.confidence,
          e.timestamp,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "traffic-analysis.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "CSV Exported",
      description: `${filteredData.length} records exported`,
    });
  };

  const handleDemoAttack = async () => {
    setDemoLoading(true);

    try {
      await createDemoAttack();
      await loadTrafficAnalysis();
      toast({
        title: "Demo Attack Added",
        description: "Dashboard alerts and traffic analysis were updated",
      });
    } catch (error) {
      toast({
        title: "Demo Failed",
        description: "Backend demo endpoint is not available",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Traffic Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Live traffic analysis powered by AI backend
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDemoAttack} disabled={demoLoading}>
            <ShieldAlert className="h-4 w-4 mr-2" />
            {demoLoading ? "Injecting..." : "Demo Attack"}
          </Button>
          <Button onClick={loadTrafficAnalysis} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Traffic"}
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Flow ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={protocol} onValueChange={setProtocol}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Protocol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="TCP">TCP</SelectItem>
            <SelectItem value="UDP">UDP</SelectItem>
            <SelectItem value="ICMP">ICMP</SelectItem>
          </SelectContent>
        </Select>

        <Select value={trafficType} onValueChange={setTrafficType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Traffic Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Attack">Attack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Flow ID</TableHead>
            <TableHead>Protocol</TableHead>
            <TableHead>Packet Rate</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Prediction</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredData.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-mono">{entry.flowId}</TableCell>
              <TableCell>
                <Badge variant="outline">{entry.protocol}</Badge>
              </TableCell>
              <TableCell>{entry.packetRate}</TableCell>
              <TableCell>{entry.flowDuration.toFixed(2)}s</TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    entry.prediction === "Normal"
                      ? "bg-success/20 text-success"
                      : "bg-destructive/20 text-destructive"
                  )}
                >
                  {entry.prediction}
                </Badge>
              </TableCell>
              <TableCell>{entry.confidence}%</TableCell>
              <TableCell>{entry.timestamp}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-sm text-muted-foreground">
        Showing {filteredData.length} entries
      </p>
    </div>
  );
}
