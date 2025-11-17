import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Tag, ArrowLeft, Share2, BookOpen, List } from "lucide-react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import SEOHead from "@/components/seo/SEOHead";
import DOMPurify from 'dompurify';

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

export default function BlogDetail() {
  const { slug } = useParams();
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  const [showTOC, setShowTOC] = useState(false);

  const { data: blogPost, isLoading, error } = useQuery({
    queryKey: ['/api/blog/slug', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');
      const response = await fetch(`/api/blog/slug/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Blog post not found');
        }
        throw new Error('Failed to fetch blog post');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Generate table of contents from blog content
  useEffect(() => {
    if (blogPost?.content) {
      generateTableOfContents(blogPost.content);
    }
  }, [blogPost?.content]);

  const generateTableOfContents = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    const tocItems: TableOfContentsItem[] = [];
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const title = heading.textContent || '';
      const id = `heading-${index}`;
      
      // Add ID to the heading for navigation
      heading.id = id;
      
      tocItems.push({
        id,
        title,
        level
      });
    });
    
    setTableOfContents(tocItems);
    setShowTOC(tocItems.length > 0);
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const processContentWithIds = (content: string) => {
    // First sanitize the content
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'blockquote'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'id'],
      ALLOW_DATA_ATTR: false
    });
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedContent, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach((heading, index) => {
      const id = `heading-${index}`;
      heading.id = id;
    });
    
    // Ensure external links have proper security attributes
    const links = doc.querySelectorAll('a[href]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http') || href.startsWith('https'))) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
    
    return doc.body.innerHTML;
  };

  const handleShare = async () => {
    if (navigator.share && blogPost) {
      try {
        await navigator.share({
          title: blogPost.title,
          text: blogPost.excerpt || blogPost.title,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-64 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-neutral-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-neutral-medium mb-4" />
            <h1 className="text-2xl font-bold text-neutral-dark mb-2">Blog Post Not Found</h1>
            <p className="text-neutral-medium mb-6">
              The blog post you're looking for doesn't exist or may have been removed.
            </p>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={blogPost.metaTitle || `${blogPost.title} - TradeConnect Blog`}
        description={blogPost.metaDescription || blogPost.excerpt || `Read ${blogPost.title} on TradeConnect Blog`}
        url={`/blog/${blogPost.slug}`}
        image={blogPost.featuredImage}
        type="article"
        structuredData={{
          "@type": "Article",
          "headline": blogPost.title,
          "description": blogPost.excerpt || blogPost.title,
          "image": blogPost.featuredImage,
          "datePublished": blogPost.publishedAt,
          "dateModified": blogPost.updatedAt || blogPost.publishedAt,
          "author": {
            "@type": "Organization",
            "name": "TradeConnect"
          },
          "publisher": {
            "@type": "Organization",
            "name": "TradeConnect",
            "logo": {
              "@type": "ImageObject",
              "url": "https://tradeconnect.com/logo.png"
            }
          }
        }}
      />
      
      <div className="min-h-screen bg-neutral-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation */}
          <div className="mb-6">
            <Link href="/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>

          {/* Blog Post */}
          <article>
            {/* Table of Contents */}
            {showTOC && (
              <div className="mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-neutral-dark flex items-center">
                        <List className="h-5 w-5 mr-2" />
                        Table of Contents
                      </h2>
                    </div>
                    <nav className="space-y-2">
                      {tableOfContents.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => scrollToHeading(item.id)}
                          className={`block w-full text-left px-2 py-1 rounded hover:bg-neutral-light transition-colors ${
                            item.level === 1 ? 'font-semibold' : 
                            item.level === 2 ? 'ml-4 font-medium' : 
                            item.level === 3 ? 'ml-8' :
                            'ml-12'
                          } text-sm text-neutral-dark hover:text-primary`}
                          style={{
                            paddingLeft: `${(item.level - 1) * 16 + 8}px`
                          }}
                        >
                          {item.title}
                        </button>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Header */}
            <header className="mb-8">
              {blogPost.featuredImage && (
                <div className="aspect-video overflow-hidden rounded-lg mb-6">
                  <img
                    src={blogPost.featuredImage}
                    alt={blogPost.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-neutral-dark leading-tight">
                  {blogPost.title}
                </h1>
                
                {blogPost.excerpt && (
                  <p className="text-lg text-neutral-medium leading-relaxed">
                    {blogPost.excerpt}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {blogPost.publishedAt && formatDistanceToNow(new Date(blogPost.publishedAt))} ago
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {(blogPost as any)?.author?.name || 'Admin'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="h-auto p-1"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
                
                {blogPost.tags && blogPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {blogPost.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {/* Content */}
            <Card>
              <CardContent className="p-8">
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-neutral-dark prose-p:text-neutral-dark prose-a:text-primary hover:prose-a:text-blue-700 prose-strong:text-neutral-dark prose-ul:text-neutral-dark prose-ol:text-neutral-dark prose-li:text-neutral-dark prose-blockquote:text-neutral-medium prose-blockquote:border-primary"
                  dangerouslySetInnerHTML={{ __html: processContentWithIds(blogPost.content) }}
                />
              </CardContent>
            </Card>
          </article>

          {/* Related Posts or Newsletter Signup could go here */}
          <div className="mt-12 text-center">
            <div className="bg-neutral-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">
                Want to read more insights?
              </h3>
              <p className="text-neutral-medium mb-4">
                Explore our blog for more industry insights and marketplace trends.
              </p>
              <Link href="/blog">
                <Button className="bg-primary text-white hover:bg-blue-700">
                  Browse All Posts
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}