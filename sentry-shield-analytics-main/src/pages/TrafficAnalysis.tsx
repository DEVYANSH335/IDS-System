import { useEffect, useState } from "react";
import { Search, Download, ShieldAlert } from "lucide-react";

import { createDemoAttack, getPrediction, getTrafficAnalysis } from "@/api/idsApi";
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
import { Textarea } from "@/components/ui/textarea";
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

interface ManualPredictionResult {
  prediction: string;
  probability: number[];
  confidence?: number;
  dashboardUpdated?: boolean;
  dashboardMessage?: string;
}

const SAMPLE_PAYLOAD = `{
  "Dst Port": 445,
  "Protocol": 6,
  "Fwd Packet Length Min": 79.04,
  "Fwd Packet Length Std": 51.78,
  "Bwd Packet Length Min": 54.09,
  "Bwd Packet Length Mean": 771.86,
  "Bwd Packet Length Std": 56.27,
  "Bwd IAT Std": 1645203.26,
  "Bwd IAT Max": 4092175.67,
  "Bwd Packets/s": 8362.33,
  "Packet Length Min": 9.43,
  "FIN Flag Count": 1,
  "SYN Flag Count": 0,
  "Bwd Segment Size Avg": 1208.22,
  "Subflow Fwd Packets": 1071,
  "Fwd Seg Size Min": 40,
  "Idle Mean": 2333984.58,
  "Idle Std": 855567.25,
  "Idle Max": 9347025.49,
  "Idle Min": 2155983.06
}`;

export default function TrafficAnalysis() {
  const [trafficData, setTrafficData] = useState<TrafficEntry[]>([]);
  const [search, setSearch] = useState("");
  const [protocol, setProtocol] = useState("all");
  const [trafficType, setTrafficType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [manualPayload, setManualPayload] = useState(SAMPLE_PAYLOAD);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<ManualPredictionResult | null>(null);

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

  const handleManualPredict = async () => {
    setManualLoading(true);

    try {
      const parsedPayload = JSON.parse(manualPayload) as Record<string, number>;
      const result = await getPrediction(parsedPayload);
      setManualResult(result);
      await loadTrafficAnalysis();

      toast({
        title: result.prediction,
        description:
          result.dashboardMessage ??
          (result.prediction === "Intrusion Detected"
            ? "Malicious traffic was detected and added to the dashboard"
            : "Traffic was classified as normal"),
      });
    } catch (error) {
      toast({
        title: "Prediction Failed",
        description: "Check that the JSON is valid and the backend is running",
        variant: "destructive",
      });
    } finally {
      setManualLoading(false);
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

      <div className="rounded-xl border border-border bg-card p-6 gradient-border space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Manual Prediction Test</h2>
          <p className="text-sm text-muted-foreground">
            Paste feature JSON, send it to <span className="font-mono">/predict</span>, and show the result here.
          </p>
        </div>

        <Textarea
          value={manualPayload}
          onChange={(e) => setManualPayload(e.target.value)}
          className="min-h-[260px] font-mono text-sm"
        />

        <div className="flex items-center gap-3">
          <Button onClick={handleManualPredict} disabled={manualLoading}>
            {manualLoading ? "Classifying..." : "Run Prediction"}
          </Button>
          <Button variant="outline" onClick={() => setManualPayload(SAMPLE_PAYLOAD)} disabled={manualLoading}>
            Load Sample
          </Button>
        </div>

        {manualResult && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Badge
                className={cn(
                  manualResult.prediction === "Intrusion Detected"
                    ? "bg-destructive/20 text-destructive"
                    : "bg-success/20 text-success"
                )}
              >
                {manualResult.prediction}
              </Badge>
              {typeof manualResult.confidence === "number" && (
                <span className="text-sm text-muted-foreground">
                  Confidence: {manualResult.confidence}%
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Raw probabilities: {manualResult.probability.join(", ")}
            </p>
          </div>
        )}
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
