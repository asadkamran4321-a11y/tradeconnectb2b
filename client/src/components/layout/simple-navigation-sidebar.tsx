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
  LogOut
} from "lucide-react";
import { authService } from "@/lib/auth";
import { adminAuthService } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";

type NavigationItem = {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
};

// Define navigation items for each role
const getSupplierNavigation = (): NavigationItem[] => [
  { title: "Dashboard", url: "/dashboard/supplier", icon: Home },
  { title: "My Products", url: "/dashboard/supplier/products", icon: Package },
  { title: "Inquiries", url: "/supplier/inquiries-dashboard", icon: MessageSquare },
  { title: "Profile", url: "/supplier/profile", icon: User },
  { title: "Add Product", url: "/products/add", icon: Package },
];

const getBuyerNavigation = (): NavigationItem[] => [
  { title: "Dashboard", url: "/dashboard/buyer", icon: Home },
  { title: "Browse Products", url: "/products", icon: Search },
  { title: "Saved Products", url: "/buyer/saved-products", icon: Heart },
  { title: "Following", url: "/buyer/followed-suppliers", icon: Users },
  { title: "My Inquiries", url: "/buyer/inquiries", icon: MessageSquare },
  { title: "Find Suppliers", url: "/suppliers", icon: Building2 },
  { title: "Categories", url: "/categories", icon: Grid3x3 },
];

const getAdminNavigation = (): NavigationItem[] => [
  { title: "Dashboard", url: "/dashboard/admin", icon: Home },
  { title: "Suppliers", url: "/admin/suppliers", icon: Building2 },
  { title: "Buyers", url: "/admin/buyers", icon: ShoppingCart },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Inquiries", url: "/admin/inquiries", icon: MessageSquare },
  { title: "Categories", url: "/admin/categories", icon: Grid3x3 },
  { title: "Blog", url: "/admin/blog", icon: FileText },
];

const getSuperAdminNavigation = (): NavigationItem[] => [
  { title: "Dashboard", url: "/dashboard/admin", icon: Home },
  { title: "System Health", url: "/admin/system/health", icon: Shield },
  { title: "User Management", url: "/admin/system/users", icon: Users },
  { title: "System Logs", url: "/admin/system/logs", icon: FileText },
  ...getAdminNavigation().slice(1) // Skip duplicate dashboard
];

export default function SimpleNavigationSidebar() {
  const [location] = useLocation();
  const currentUser = authService.getCurrentUser();
  const adminUser = adminAuthService.getCurrentUser();
  
  // Determine active user and role
  const activeUser = adminUser || currentUser;
  const userRole = activeUser?.role;
  
  // Get navigation items based on role
  let navigationItems: NavigationItem[] = [];
  if (userRole === 'admin' && adminUser?.id === 999) {
    navigationItems = getSuperAdminNavigation();
  } else if (userRole === 'admin') {
    navigationItems = getAdminNavigation();
  } else if (userRole === 'supplier') {
    navigationItems = getSupplierNavigation();
  } else if (userRole === 'buyer') {
    navigationItems = getBuyerNavigation();
  }

  const handleLogout = () => {
    if (adminUser) {
      adminAuthService.logout();
    } else {
      authService.logout();
    }
    window.location.href = "/";
  };

  if (!activeUser || navigationItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 text-white flex flex-col shadow-lg z-50">
      {/* Header */}
      <div className="border-b border-slate-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">TradeConnect</h2>
            <p className="text-xs text-slate-400 capitalize">{userRole} Portal</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.url || location.startsWith(item.url + '/');
            const IconComponent = item.icon;
            
            return (
              <Link key={item.url} href={item.url}>
                <div className={`
                  flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}>
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  <span>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Footer */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {activeUser.email}
            </p>
            <p className="text-xs text-slate-400 capitalize">{userRole}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full justify-start text-slate-300 bg-transparent border-slate-600 hover:bg-red-600 hover:border-red-600 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

// Wrapper component that includes the sidebar and adjusts main content
export function SimpleNavigationLayout({ children }: { children: React.ReactNode }) {
  const currentUser = authService.getCurrentUser();
  const adminUser = adminAuthService.getCurrentUser();
  const activeUser = adminUser || currentUser;

  if (!activeUser) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <SimpleNavigationSidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}