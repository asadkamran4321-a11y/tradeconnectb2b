import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Handshake, Menu, Shield } from "lucide-react";
import { authService } from "@/lib/auth";
import { adminAuthService } from "@/lib/adminAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";

export default function Header() {
  const [location, setLocation] = useLocation();
  const currentUser = authService.getCurrentUser();
  const adminUser = adminAuthService.getCurrentUser();
  
  // Use admin user if available, otherwise use regular user
  const activeUser = adminUser || currentUser;

  const handleLogout = () => {
    if (adminUser) {
      adminAuthService.logout();
    } else {
      authService.logout();
    }
    setLocation("/");
  };

  const NavLinks = () => (
    <>
      <Link href="/suppliers" className="text-neutral-medium hover:text-primary transition-colors">
        Find Suppliers
      </Link>
      <Link href="/products" className="text-neutral-medium hover:text-primary transition-colors">
        Browse Products
      </Link>
      <Link href="/categories" className="text-neutral-medium hover:text-primary transition-colors">
        Categories
      </Link>
      <Link href="/blog" className="text-neutral-medium hover:text-primary transition-colors">
        Blog
      </Link>
    </>
  );

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Handshake className="text-primary text-2xl" />
              <span className="text-xl font-bold text-neutral-dark">TradeConnect</span>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <NavLinks />
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {activeUser ? (
              <div className="flex items-center space-x-4">
                <NotificationDropdown />
                {/* Super Admin: Only show Super Admin button and Logout */}
                {activeUser.role === 'admin' && activeUser.id === 999 ? (
                  <>
                    <Link href="/dashboard/admin">
                      <Button 
                        variant="outline" 
                        className="border-purple-500 text-purple-700 hover:bg-purple-50 hover:border-purple-600"
                        data-testid="button-super-admin-nav"
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Super Admin
                      </Button>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  /* Regular users: Show Profile and Dashboard */
                  <>
                    <Link href="/profile">
                      <Button variant="ghost">Profile</Button>
                    </Link>
                    <Link href={
                      activeUser.role === 'supplier' 
                        ? '/dashboard/supplier' 
                        : activeUser.role === 'admin' 
                        ? '/dashboard/admin' 
                        : '/dashboard/buyer'
                    }>
                      <Button variant="ghost">Dashboard</Button>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button className="bg-primary text-white hover:bg-blue-700">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col space-y-4 mt-4">
                  <NavLinks />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
