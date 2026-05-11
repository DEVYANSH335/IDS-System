import { useState } from "react";
import { Upload, RefreshCw, Bell, Database, Cpu, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Settings() {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [autoRetrain, setAutoRetrain] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);

  const handleFileUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success("Dataset uploaded successfully", {
        description: "15,432 new samples added to training data",
      });
    }, 2000);
  };

  const handleRetrain = () => {
    setIsRetraining(true);
    setTimeout(() => {
      setIsRetraining(false);
      toast.success("Model retrained successfully", {
        description: "New accuracy: 98.9% (+0.2%)",
      });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure system preferences and model training
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dataset Management */}
        <div className="rounded-xl border border-border bg-card p-6 gradient-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Dataset Management</h3>
              <p className="text-sm text-muted-foreground">Upload new training data</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-foreground mb-1">
                Drag and drop your CSV file here
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                or click to browse files
              </p>
              <Button
                variant="outline"
                onClick={handleFileUpload}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Select File
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Current Dataset:</strong> CICIDS2017
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                2,830,743 samples • Last updated: Jan 15, 2024
              </p>
            </div>
          </div>
        </div>

        {/* Model Training */}
        <div className="rounded-xl border border-border bg-card p-6 gradient-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
              <Cpu className="h-5 w-5 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Model Training</h3>
              <p className="text-sm text-muted-foreground">Retrain with updated data</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Model Version</span>
                <span className="text-sm font-medium text-foreground font-mono">v2.4.1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Trained</span>
                <span className="text-sm font-medium text-foreground">Jan 15, 2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <span className="text-sm font-medium text-success">98.7%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <CheckCircle className="h-4 w-4" />
                  Active
                </span>
              </div>
            </div>

            <Button
              onClick={handleRetrain}
              disabled={isRetraining}
              className="w-full gap-2"
            >
              {isRetraining ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Retraining Model...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Retrain Model
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-xl border border-border bg-card p-6 gradient-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
            <Bell className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Alert Settings</h3>
            <p className="text-sm text-muted-foreground">Configure notification preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="alerts" className="text-foreground">Enable Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive real-time alerts for detected attacks
              </p>
            </div>
            <Switch
              id="alerts"
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email" className="text-foreground">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send critical alerts to your email
              </p>
            </div>
            <Switch
              id="email"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-retrain" className="text-foreground">Auto Retrain</Label>
              <p className="text-sm text-muted-foreground">
                Automatically retrain model when new data is available
              </p>
            </div>
            <Switch
              id="auto-retrain"
              checked={autoRetrain}
              onCheckedChange={setAutoRetrain}
            />
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="rounded-xl border border-border bg-card p-6 gradient-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">System Information</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "System Version", value: "1.0.0" },
            { label: "Python Version", value: "3.10.12" },
            { label: "Scikit-learn", value: "1.3.2" },
            { label: "Uptime", value: "14d 7h 23m" },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-lg font-medium text-foreground font-mono">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
