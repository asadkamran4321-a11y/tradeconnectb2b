import { useLocation, Link } from "wouter";
import { 
  Home, 
  Package, 
  MessageSquare, 
  User, 
  Settings, 
  Search, 
  Heart, 
  Users, 
  ShoppingCart,
  Building2,
  FileText,
  Grid3x3,
  Shield,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut
} from "lucide-react";
import { authService } from "@/lib/auth";
import { adminAuthService } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type NavigationItem = {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  badge?: number;
  isActive?: boolean;
};

type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

// Define navigation items for each role
const getSupplierNavigation = (): NavigationGroup[] => [
  {
    title: "Workspace",
    items: [
      { title: "Dashboard", url: "/dashboard/supplier", icon: Home },
      { title: "My Products", url: "/dashboard/supplier/products", icon: Package },
      { title: "Inquiries", url: "/supplier/inquiries-dashboard", icon: MessageSquare },
      { title: "Profile", url: "/supplier/profile", icon: User },
    ]
  },
  {
    title: "Management",
    items: [
      { title: "Add Product", url: "/products/add", icon: Package },
      { title: "Settings", url: "/supplier/settings", icon: Settings },
    ]
  }
];

const getBuyerNavigation = (): NavigationGroup[] => [
  {
    title: "Workspace", 
    items: [
      { title: "Dashboard", url: "/dashboard/buyer", icon: Home },
      { title: "Browse Products", url: "/products", icon: Search },
      { title: "Saved Products", url: "/buyer/saved-products", icon: Heart },
      { title: "Following", url: "/buyer/followed-suppliers", icon: Users },
      { title: "My Inquiries", url: "/buyer/inquiries", icon: MessageSquare },
    ]
  },
  {
    title: "Explore",
    items: [
      { title: "Find Suppliers", url: "/suppliers", icon: Building2 },
      { title: "Categories", url: "/categories", icon: Grid3x3 },
    ]
  }
];

const getAdminNavigation = (): NavigationGroup[] => [
  {
    title: "Administration",
    items: [
      { title: "Dashboard", url: "/dashboard/admin", icon: Home },
      { title: "Suppliers", url: "/admin/suppliers", icon: Building2 },
      { title: "Buyers", url: "/admin/buyers", icon: ShoppingCart },
      { title: "Products", url: "/admin/products", icon: Package },
      { title: "Inquiries", url: "/admin/inquiries", icon: MessageSquare },
    ]
  },
  {
    title: "Content & System",
    items: [
      { title: "Categories", url: "/admin/categories", icon: Grid3x3 },
      { title: "Blog", url: "/admin/blog", icon: FileText },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ]
  }
];

const getSuperAdminNavigation = (): NavigationGroup[] => [
  {
    title: "Super Administration",
    items: [
      { title: "Dashboard", url: "/dashboard/admin", icon: Home },
      { title: "System Health", url: "/admin/system/health", icon: Shield },
      { title: "User Management", url: "/admin/system/users", icon: Users },
      { title: "System Logs", url: "/admin/system/logs", icon: FileText },
    ]
  },
  ...getAdminNavigation()
];

function NavigationSidebar() {
  const [location] = useLocation();
  const currentUser = authService.getCurrentUser();
  const adminUser = adminAuthService.getCurrentUser();
  
  // Determine active user and role
  const activeUser = adminUser || currentUser;
  const userRole = activeUser?.role;
  
  // Get navigation items based on role
  let navigationGroups: NavigationGroup[] = [];
  if (userRole === 'admin' && adminUser?.id === 999) {
    navigationGroups = getSuperAdminNavigation();
  } else if (userRole === 'admin') {
    navigationGroups = getAdminNavigation();
  } else if (userRole === 'supplier') {
    navigationGroups = getSupplierNavigation();
  } else if (userRole === 'buyer') {
    navigationGroups = getBuyerNavigation();
  }

  const handleLogout = () => {
    if (adminUser) {
      adminAuthService.logout();
    } else {
      authService.logout();
    }
    window.location.href = "/";
  };

  if (!activeUser || navigationGroups.length === 0) {
    return null;
  }

  return (
    <Sidebar 
      collapsible="icon" 
      className="bg-slate-800 border-r border-slate-700" 
      variant="sidebar"
    >
      <SidebarHeader className="border-b border-slate-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-semibold text-white">TradeConnect</h2>
            <p className="text-xs text-slate-400 capitalize">{userRole} Portal</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4">
        {navigationGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.title} className="mb-4">
            <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {group.title}
              </h3>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location === item.url || location.startsWith(item.url + '/');
                  const IconComponent = item.icon;
                  
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={`
                          group relative flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                          ${isActive 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                          }
                        `}
                      >
                        <Link href={item.url}>
                          <IconComponent className="w-5 h-5 flex-shrink-0" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="ml-auto h-5 w-5 p-0 text-xs group-data-[collapsible=icon]:hidden"
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            {groupIndex < navigationGroups.length - 1 && (
              <Separator className="my-4 bg-slate-700 group-data-[collapsible=icon]:hidden" />
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="border-t border-slate-700 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center space-x-3 mb-3 group-data-[collapsible=icon]:justify-center">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-white truncate">
                  {activeUser.email}
                </p>
                <p className="text-xs text-slate-400 capitalize">{userRole}</p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="w-full justify-start text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Export the main navigation component with provider
export default function NavigationSidebarWithProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <NavigationSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Sidebar trigger for mobile */}
          <div className="md:hidden p-4 border-b bg-white">
            <SidebarTrigger className="h-8 w-8" />
          </div>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Export individual components for flexibility
export { NavigationSidebar };