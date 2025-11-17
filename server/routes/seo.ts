import type { Express } from "express";
import { storage } from "../storage";

export function registerSEORoutes(app: Express) {
  // Generate sitemap.xml
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const domain = `https://${req.get('host')}`;
      const currentDate = new Date().toISOString();

      // Get all active products and suppliers
      const products = await storage.getProducts();
      const suppliers = await storage.getSuppliers();
      const categories = await storage.getCategories();

      // Static pages
      const staticPages = [
        { url: '/', changefreq: 'daily', priority: '1.0' },
        { url: '/products', changefreq: 'hourly', priority: '0.9' },
        { url: '/suppliers', changefreq: 'daily', priority: '0.9' },
        { url: '/categories', changefreq: 'weekly', priority: '0.8' },
        { url: '/login', changefreq: 'monthly', priority: '0.3' },
        { url: '/register', changefreq: 'monthly', priority: '0.3' },
      ];

      // Dynamic pages
      const dynamicPages = [
        // Product pages
        ...products.filter(p => p.status === 'approved').map(product => ({
          url: `/products/${product.id}`,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: product.updatedAt?.toISOString() || currentDate
        })),
        
        // Supplier pages
        ...suppliers.filter(s => s.verified).map(supplier => ({
          url: `/suppliers/${supplier.id}`,
          changefreq: 'weekly', 
          priority: '0.7',
          lastmod: supplier.updatedAt?.toISOString() || currentDate
        })),

        // Category pages
        ...categories.filter(c => c.isActive).map(category => ({
          url: `/categories/${category.id}`,
          changefreq: 'weekly',
          priority: '0.6',
          lastmod: category.updatedAt?.toISOString() || currentDate
        })),

        // Category product pages
        ...categories.filter(c => c.isActive).map(category => ({
          url: `/categories/${category.id}/products`,
          changefreq: 'daily',
          priority: '0.7',
          lastmod: currentDate
        })),
      ];

      const allPages = [...staticPages, ...dynamicPages];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${domain}${page.url}</loc>
    <lastmod>${page.lastmod || currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Generate robots.txt
  app.get('/robots.txt', (req, res) => {
    const domain = `https://${req.get('host')}`;
    
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Disallow: /onboarding/
Disallow: /login
Disallow: /register
Disallow: /verify-email
Disallow: /reset-password
Disallow: /forgot-password

# Allow search engines to crawl product and supplier pages
Allow: /products/
Allow: /suppliers/
Allow: /categories/

# Sitemap location
Sitemap: ${domain}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1`;

    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // JSON-LD structured data endpoint for organization
  app.get('/api/seo/organization', (req, res) => {
    const domain = `https://${req.get('host')}`;
    
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "TradeConnect",
      "description": "Leading B2B marketplace connecting suppliers and buyers worldwide. Find quality products from verified suppliers and manufacturers.",
      "url": domain,
      "logo": `${domain}/api/placeholder/400/200`,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["en"]
      },
      "sameAs": [
        "https://linkedin.com/company/tradeconnect",
        "https://twitter.com/tradeconnect"
      ],
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${domain}/products?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    res.json(organizationData);
  });

  // Product catalog JSON-LD for rich results
  app.get('/api/seo/product-catalog', async (req, res) => {
    try {
      const domain = `https://${req.get('host')}`;
      const products = await storage.getProducts();
      const approvedProducts = products.filter(p => p.status === 'approved').slice(0, 50); // Limit for performance

      const catalogData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "TradeConnect Product Catalog",
        "description": "Browse our extensive catalog of B2B products from verified suppliers worldwide",
        "url": `${domain}/products`,
        "numberOfItems": approvedProducts.length,
        "itemListElement": approvedProducts.map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "@id": `${domain}/products/${product.id}`,
            "name": product.name,
            "description": product.description,
            "image": product.images?.[0] || `${domain}/api/placeholder/400/400`,
            "url": `${domain}/products/${product.id}`,
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "price": product.price || "0",
              "availability": "https://schema.org/InStock"
            }
          }
        }))
      };

      res.json(catalogData);
    } catch (error) {
      console.error('Error generating product catalog:', error);
      res.status(500).json({ error: 'Error generating product catalog' });
    }
  });

  // Breadcrumb structured data
  app.get('/api/seo/breadcrumbs/:type/:id', async (req, res) => {
    try {
      const { type, id } = req.params;
      const domain = `https://${req.get('host')}`;

      let breadcrumbData;

      if (type === 'product') {
        const product = await storage.getProduct(Number(id));
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        breadcrumbData = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": domain
            },
            {
              "@type": "ListItem", 
              "position": 2,
              "name": "Products",
              "item": `${domain}/products`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": product.name,
              "item": `${domain}/products/${product.id}`
            }
          ]
        };
      } else if (type === 'supplier') {
        const supplier = await storage.getSupplier(Number(id));
        if (!supplier) {
          return res.status(404).json({ error: 'Supplier not found' });
        }

        breadcrumbData = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home", 
              "item": domain
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Suppliers",
              "item": `${domain}/suppliers`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": supplier.companyName,
              "item": `${domain}/suppliers/${supplier.id}`
            }
          ]
        };
      }

      res.json(breadcrumbData);
    } catch (error) {
      console.error('Error generating breadcrumbs:', error);
      res.status(500).json({ error: 'Error generating breadcrumbs' });
    }
  });
}