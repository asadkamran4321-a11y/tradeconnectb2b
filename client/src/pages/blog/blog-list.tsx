import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, User, Tag, Search, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import SEOHead from "@/components/seo/SEOHead";

export default function BlogList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['/api/blog', 'published'],
    queryFn: async () => {
      const response = await fetch('/api/blog?status=published');
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      return response.json();
    },
  });

  // Filter posts based on search and tag
  const filteredPosts = blogPosts.filter((post: BlogPost) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || (post.tags && post.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  // Get all unique tags
  const allTags = Array.from(new Set(blogPosts.flatMap((post: BlogPost) => post.tags || [])));

  return (
    <>
      <SEOHead
        title="Blog - TradeConnect"
        description="Stay updated with the latest insights, trends, and news from the B2B marketplace industry."
        url="/blog"
      />
      
      <div className="min-h-screen bg-neutral-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-neutral-dark mb-4">
              TradeConnect Blog
            </h1>
            <p className="text-lg text-neutral-medium max-w-2xl mx-auto">
              Stay updated with the latest insights, trends, and news from the B2B marketplace industry.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium h-4 w-4" />
                <Input
                  placeholder="Search blog posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedTag === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                >
                  All Posts
                </Button>
                {allTags.slice(0, 5).map((tag: string) => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Blog Posts */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-96">
                  <CardContent className="p-6">
                    <Skeleton className="h-40 w-full mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="bg-neutral-white rounded-lg p-8 shadow-sm">
                  <Search className="mx-auto h-12 w-12 text-neutral-medium mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-dark mb-2">
                    {searchTerm || selectedTag ? 'No posts found' : 'No blog posts yet'}
                  </h3>
                  <p className="text-neutral-medium">
                    {searchTerm || selectedTag 
                      ? 'Try adjusting your search criteria or browse all posts.'
                      : 'We\'re working on creating amazing content for you. Check back soon!'
                    }
                  </p>
                  {(searchTerm || selectedTag) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedTag(null);
                      }}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post: BlogPost) => (
                <Card key={post.id} className="group hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    {post.featuredImage && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-neutral-medium mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {post.publishedAt && formatDistanceToNow(new Date(post.publishedAt))} ago
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Admin
                        </div>
                      </div>
                      
                      <h2 className="font-semibold text-lg text-neutral-dark mb-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      
                      {post.excerpt && (
                        <p className="text-neutral-medium text-sm mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {post.tags.slice(0, 3).map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="outline" size="sm" className="w-full group">
                          Read More
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More - Future Enhancement */}
          {filteredPosts.length > 0 && filteredPosts.length % 9 === 0 && (
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                Load More Posts
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}