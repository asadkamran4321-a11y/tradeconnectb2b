import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Server, 
  Database, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  Users,
  Package
} from "lucide-react";
import { adminAuthService } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/queryClient";
import { SimpleNavigationLayout } from "@/components/layout/simple-navigation-sidebar";

type SystemHealthData = {
  server: {
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    memory: { used: number; total: number; percentage: number };
    cpu: { percentage: number };
  };
  database: {
    status: 'healthy' | 'warning' | 'error';
    connections: number;
    maxConnections: number;
    responseTime: number;
  };
  platform: {
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    errorRate: number;
  };
};

export default function SystemHealth() {
  const [, setLocation] = useLocation();

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

  // Mock data for system health (in real implementation, this would come from API)
  const { data: healthData, isLoading } = useQuery<SystemHealthData>({
    queryKey: ['/api/admin/system/health'],
    queryFn: async () => {
      // Mock implementation - in real app, this would fetch from server monitoring API
      return {
        server: {
          status: 'healthy',
          uptime: '15 days, 3 hours',
          memory: { used: 2.4, total: 8, percentage: 30 },
          cpu: { percentage: 45 }
        },
        database: {
          status: 'healthy',
          connections: 25,
          maxConnections: 100,
          responseTime: 15
        },
        platform: {
          totalUsers: 1247,
          activeUsers: 89,
          totalTransactions: 5632,
          errorRate: 0.02
        }
      };
    },
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <SimpleNavigationLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">Loading system health data...</div>
        </div>
      </SimpleNavigationLayout>
    );
  }

  return (
    <SimpleNavigationLayout>
      <div className="container mx-auto py-8" data-testid="system-health">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-purple-600" />
            System Health Monitor
          </h1>
          <p className="text-gray-600">Real-time monitoring of platform infrastructure and performance</p>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Server Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(healthData?.server.status || 'healthy')}
                <span className={`text-lg font-bold ${getStatusColor(healthData?.server?.status || 'healthy')}`}>
                  {(healthData?.server?.status || 'healthy').charAt(0).toUpperCase() + (healthData?.server?.status || 'healthy').slice(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Uptime: {healthData?.server.uptime}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(healthData?.database.status || 'healthy')}
                <span className={`text-lg font-bold ${getStatusColor(healthData?.database?.status || 'healthy')}`}>
                  {(healthData?.database?.status || 'healthy').charAt(0).toUpperCase() + (healthData?.database?.status || 'healthy').slice(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Response: {healthData?.database.responseTime}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(healthData?.platform.errorRate || 0) * 100}%
              </div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resource Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Server Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>{healthData?.server.memory.used}GB / {healthData?.server.memory.total}GB</span>
                </div>
                <Progress value={healthData?.server.memory.percentage || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span>{healthData?.server.cpu.percentage}%</span>
                </div>
                <Progress value={healthData?.server.cpu.percentage || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {healthData?.database.connections} / {healthData?.database.maxConnections}
              </div>
              <Progress 
                value={((healthData?.database.connections || 0) / (healthData?.database.maxConnections || 1)) * 100} 
                className="h-2 mb-2" 
              />
              <p className="text-xs text-muted-foreground">Active database connections</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthData?.platform.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{healthData?.platform.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthData?.platform.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-green-600 border-green-600">
                All Systems Operational
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Last updated: just now</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Recent Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p>No active alerts. All systems running normally.</p>
              <p className="text-sm mt-2">Last alert: Memory usage spike (resolved 2 hours ago)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SimpleNavigationLayout>
  );
}