import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, Star, ShieldCheck, Building } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SupplierCard from "@/components/common/supplier-card";
import ContactModal from "@/components/modals/contact-modal";
import { Supplier } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/seo/SEOHead";

export default function SupplierList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ['/api/suppliers', { search: searchQuery, location: selectedLocation }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (searchQuery) searchParams.append('search', searchQuery);
      if (selectedLocation && selectedLocation !== 'all') searchParams.append('location', selectedLocation);
      
      const response = await fetch(`/api/suppliers?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the query key change
  };

  const handleSupplierContact = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setContactModalOpen(true);
  };

  const filteredSuppliers = suppliers
    .filter((supplier: Supplier) => {
      if (showVerifiedOnly && !supplier.verified) return false;
      return true;
    })
    .sort((a: Supplier, b: Supplier) => {
      switch (sortBy) {
        case 'name':
          return a.companyName.localeCompare(b.companyName);
        case 'rating':
          return Number(b.rating) - Number(a.rating);
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        default:
          return 0;
      }
    });

  // SEO data
  const seoData = useMemo(() => {
    let title = "B2B Suppliers Directory | TradeConnect Marketplace";
    let description = "Find verified B2B suppliers and manufacturers worldwide. Connect with quality suppliers for wholesale and bulk orders. Browse supplier profiles, products, and contact details.";
    let keywords = "B2B suppliers, manufacturers, verified suppliers, wholesale suppliers, business suppliers";

    if (searchQuery) {
      title = `${searchQuery} Suppliers | B2B Directory - TradeConnect`;
      description = `Find ${searchQuery} suppliers and manufacturers. Browse verified ${searchQuery} suppliers for wholesale and bulk orders. Contact quality suppliers directly.`;
      keywords = `${searchQuery} suppliers, ${searchQuery} manufacturers, B2B ${searchQuery}, wholesale ${searchQuery}, ${keywords}`;
    }

    if (selectedLocation && selectedLocation !== 'all') {
      title = `B2B Suppliers in ${selectedLocation} | TradeConnect Directory`;
      description = `Find verified B2B suppliers and manufacturers in ${selectedLocation}. Browse local suppliers for wholesale and bulk orders. Quality suppliers directory.`;
      keywords = `${selectedLocation} suppliers, suppliers in ${selectedLocation}, ${selectedLocation} manufacturers, ${keywords}`;
    }

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": title,
      "description": description,
      "url": currentUrl,
      "numberOfItems": filteredSuppliers.length,
      "itemListElement": filteredSuppliers.slice(0, 20).map((supplier: Supplier, index: number) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Organization",
          "@id": `/suppliers/${supplier.id}`,
          "name": supplier.companyName,
          "description": supplier.companyDescription || `Professional B2B supplier ${supplier.companyName}`,
          "url": `/suppliers/${supplier.id}`,
          "address": {
            "@type": "PostalAddress",
            "addressCountry": supplier.country,
            "addressLocality": supplier.city
          },
          "hasCredential": supplier.verified ? {
            "@type": "EducationalOccupationalCredential",
            "name": "Verified B2B Supplier"
          } : undefined
        }
      }))
    };

    return { title, description, keywords, url: currentUrl, structuredData };
  }, [searchQuery, selectedLocation, filteredSuppliers]);

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">Failed to load suppliers</h3>
              <p className="text-neutral-medium">{error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={seoData.url}
        type="website"
        structuredData={seoData.structuredData}
      />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-dark mb-4">Find Suppliers</h1>
            <p className="text-neutral-medium max-w-2xl mx-auto">
              Connect with verified suppliers from around the world. Find the right partner for your business needs.
            </p>
          </div>

          {/* Search and Filters */}
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-medium" />
              <Input
                type="text"
                placeholder="Search suppliers by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="China">China</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Japan">Japan</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" className="bg-primary text-white hover:bg-blue-700">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="verified"
                checked={showVerifiedOnly}
                onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="verified" className="text-sm text-neutral-dark">
                Verified suppliers only
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-neutral-medium" />
              <span className="text-sm text-neutral-medium">
                {isLoading ? 'Loading...' : `${filteredSuppliers.length} suppliers found`}
              </span>
            </div>
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Company Name</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="location">Location</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Suppliers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="mx-auto h-12 w-12 text-neutral-medium mb-4" />
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">No suppliers found</h3>
              <p className="text-neutral-medium">
                Try adjusting your search criteria or remove some filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier: Supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onContact={() => handleSupplierContact(supplier)}
              />
            ))}
          </div>
        )}
      </div>

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        supplier={selectedSupplier}
        product={null}
      />
    </div>
  );
}