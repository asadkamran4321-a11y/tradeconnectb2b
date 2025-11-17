import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";

export function NotificationBell() {
  const { data: unreadCount } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return { count: 0 };
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount?.count > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount.count > 99 ? '99+' : unreadCount.count}
          </Badge>
        )}
      </Button>
    </div>
  );
}