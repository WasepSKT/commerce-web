import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Share2 } from 'lucide-react';

interface SEOPreviewProps {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  canonical?: string;
  type?: 'blog' | 'product';
}

export const SEOPreview: React.FC<SEOPreviewProps> = ({
  title,
  description,
  keywords,
  ogImage,
  canonical,
  type = 'blog'
}) => {
  const truncatedTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
  const truncatedDescription = description.length > 160 ? description.substring(0, 160) + '...' : description;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            SEO Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Search Preview */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-blue-600 text-sm mb-1">
              {canonical || (type === 'blog' ? '/blog/example-slug' : '/product/example-product')}
            </div>
            <h3 className="text-xl text-blue-600 hover:underline cursor-pointer mb-2">
              {truncatedTitle}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {truncatedDescription}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {type === 'blog' ? 'Blog Post' : 'Product'}
              </Badge>
              <span className="text-xs text-gray-500">Regal Paw</span>
            </div>
          </div>

          {/* Social Media Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Social Media Preview</span>
            </div>

            <div className="bg-white border rounded-lg p-3 max-w-md">
              {ogImage && (
                <div className="w-full h-32 bg-gray-200 rounded mb-3 overflow-hidden">
                  <img
                    src={ogImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="text-blue-600 text-sm mb-1">
                regalpaw.id
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                {title}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {description}
              </p>
            </div>
          </div>

          {/* SEO Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {title.length}
              </div>
              <div className="text-xs text-gray-600">Title Length</div>
              <div className={`text-xs mt-1 ${title.length > 60 ? 'text-red-600' : 'text-green-600'}`}>
                {title.length > 60 ? 'Too long' : 'Good'}
              </div>
            </div>

            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {description.length}
              </div>
              <div className="text-xs text-gray-600">Description Length</div>
              <div className={`text-xs mt-1 ${description.length > 160 ? 'text-red-600' : 'text-green-600'}`}>
                {description.length > 160 ? 'Too long' : 'Good'}
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Keywords</div>
            <div className="flex flex-wrap gap-1">
              {keywords.split(',').slice(0, 8).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword.trim()}
                </Badge>
              ))}
              {keywords.split(',').length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{keywords.split(',').length - 8} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOPreview;
