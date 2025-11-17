import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Search, 
  Download, 
  RefreshCw,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
  Clock,
  Terminal
} from "lucide-react";
import { adminAuthService } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/queryClient";
import { SimpleNavigationLayout } from "@/components/layout/simple-navigation-sidebar";

type LogEntry = {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
  details?: string;
};

type LogStats = {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  debug: number;
};

export default function SystemLogs() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Check admin authentication and super admin status
  useEffect(() => {
    if (!adminAuthService.isAuthenticated()) {
      setLocation('/admin/login');
      return;
    }
    if (!adminAuthService.isSuperAdmin()) {
      setLocation('/dashboard/admin');
      return;
    }
  }, [setLocation]);

  // Mock data for system logs (in real implementation, this would come from API)
  const { data: logStats, isLoading: statsLoading } = useQuery<LogStats>({
    queryKey: ['/api/admin/logs/stats'],
    queryFn: async () => {
      return {
        total: 15847,
        errors: 23,
        warnings: 156,
        info: 14892,
        debug: 776
      };
    },
    retry: false,
  });

  const { data: logs, isLoading: logsLoading } = useQuery<LogEntry[]>({
    queryKey: ['/api/admin/logs'],
    queryFn: async () => {
      // Mock data - in real implementation, this would fetch from API
      return [
        {
          id: "1",
          timestamp: "2024-12-18T16:45:32Z",
          level: "info",
          service: "api-server",
          message: "User authentication successful",
          details: "User ID: 123, Role: supplier"
        },
        {
          id: "2",
          timestamp: "2024-12-18T16:44:15Z",
          level: "error",
          service: "database",
          message: "Connection timeout to primary database",
          details: "Connection attempt failed after 30s timeout. Retrying with backup connection."
        },
        {
          id: "3",
          timestamp: "2024-12-18T16:43:08Z",
          level: "warn",
          service: "payment-processor",
          message: "High API response time detected",
          details: "Average response time: 2.3s (threshold: 1.5s)"
        },
        {
          id: "4",
          timestamp: "2024-12-18T16:42:55Z",
          level: "info",
          service: "notification-service",
          message: "Email notification sent successfully",
          details: "Recipient: supplier@example.com, Type: product_approved"
        },
        {
          id: "5",
          timestamp: "2024-12-18T16:42:30Z",
          level: "debug",
          service: "cache-manager",
          message: "Cache invalidation completed",
          details: "Invalidated 45 cache entries for product updates"
        },
        {
          id: "6",
          timestamp: "2024-12-18T16:41:12Z",
          level: "info",
          service: "file-upload",
          message: "Product image uploaded successfully",
          details: "File: product_image_123.jpg, Size: 2.4MB, User: supplier_456"
        },
        {
          id: "7",
          timestamp: "2024-12-18T16:40:47Z",
          level: "error",
          service: "email-service",
          message: "Failed to send verification email",
          details: "SMTP connection refused. Error: connect ECONNREFUSED 587"
        },
        {
          id: "8",
          timestamp: "2024-12-18T16:39:23Z",
          level: "info",
          service: "api-server",
          message: "Product approval workflow initiated",
          details: "Product ID: 789, Submitted by: supplier_456"
        }
      ];
    },
    retry: false,
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds if auto-refresh is on
  });

  // Filter logs based on search and filters
  const filteredLogs = logs?.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesService = serviceFilter === "all" || log.service === serviceFilter;
    return matchesSearch && matchesLevel && matchesService;
  }) || [];

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'debug':
        return <Terminal className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLogBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>;
      case 'warn':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">WARN</Badge>;
      case 'info':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">INFO</Badge>;
      case 'debug':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">DEBUG</Badge>;
      default:
        return <Badge variant="outline">{level.toUpperCase()}</Badge>;
    }
  };

  const getServiceColor = (service: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800'
    ];
    return colors[service.length % colors.length];
  };

  if (statsLoading || logsLoading) {
    return (
      <SimpleNavigationLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">Loading system logs...</div>
        </div>
      </SimpleNavigationLayout>
    );
  }

  return (
    <SimpleNavigationLayout>
      <div className="container mx-auto py-8" data-testid="system-logs">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <FileText className="h-8 w-8 mr-3 text-purple-600" />
            System Logs
          </h1>
          <p className="text-gray-600">Monitor application logs and system events in real-time</p>
        </div>

        {/* Log Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logStats?.total?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{logStats?.errors}</div>
              <p className="text-xs text-muted-foreground">Critical issues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{logStats?.warnings}</div>
              <p className="text-xs text-muted-foreground">Attention needed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Info</CardTitle>
              <Info className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{logStats?.info?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Information logs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Debug</CardTitle>
              <Terminal className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{logStats?.debug}</div>
              <p className="text-xs text-muted-foreground">Debug entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search & Filter Logs
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin text-green-600' : ''}`} />
                  Auto Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search logs by message, service, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-4">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="api-server">API Server</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="payment-processor">Payment</SelectItem>
                    <SelectItem value="notification-service">Notifications</SelectItem>
                    <SelectItem value="cache-manager">Cache</SelectItem>
                    <SelectItem value="file-upload">File Upload</SelectItem>
                    <SelectItem value="email-service">Email Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Logs ({filteredLogs.length})
              {autoRefresh && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0 mt-1">
                    {getLogIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getLogBadge(log.level)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getServiceColor(log.service)}`}>
                        {log.service}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{log.message}</p>
                    {log.details && (
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded font-mono">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SimpleNavigationLayout>
  );
}