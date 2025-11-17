import { Link } from "wouter";
import { Handshake } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-neutral-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Handshake className="text-primary text-xl" />
              <span className="text-lg font-bold">TradeConnect</span>
            </div>
            <p className="text-gray-400 text-sm">
              Connecting suppliers and buyers worldwide for successful business partnerships.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Suppliers</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/register" className="hover:text-white">Join as Supplier</Link></li>
              <li><Link href="/dashboard/supplier" className="hover:text-white">Supplier Dashboard</Link></li>
              <li><Link href="/products/add" className="hover:text-white">List Products</Link></li>
              <li><Link href="/verification" className="hover:text-white">Verification</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Buyers</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/register" className="hover:text-white">Join as Buyer</Link></li>
              <li><Link href="/products" className="hover:text-white">Browse Products</Link></li>
              <li><Link href="/suppliers" className="hover:text-white">Find Suppliers</Link></li>
              <li><Link href="/protection" className="hover:text-white">Buyer Protection</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 TradeConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
