import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageSliderManager } from '@/components/admin/campaign/ImageSliderManager';
import { FixedBannerManager } from '@/components/admin/campaign/FixedBannerManager';
import { PopupCampaignManager } from '@/components/admin/campaign/PopupCampaignManager';
import { Images, Layout, MessageSquare } from 'lucide-react';

export default function AdminCampaignPage() {
  const [activeTab, setActiveTab] = useState("slider");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-primary">Campaign Management</h1>
            <p className="text-gray-600 mt-2">
              Kelola kampanye marketing untuk slider hero, banner tetap, dan pop-up promosi
            </p>
          </div>
        </div>

        {/* Campaign Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-primary">
            <TabsTrigger value="slider" className="flex items-center gap-2 text-white">
              <Images className="w-4 h-4" />
              Image Slider
            </TabsTrigger>
            <TabsTrigger value="banner" className="flex items-center gap-2 text-white">
              <Layout className="w-4 h-4" />
              Fixed Banner
            </TabsTrigger>
            <TabsTrigger value="popup" className="flex items-center gap-2 text-white">
              <MessageSquare className="w-4 h-4" />
              Pop-up Campaign
            </TabsTrigger>
          </TabsList>

          {/* Image Slider Tab */}
          <TabsContent value="slider" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Images className="w-5 h-5 text-brand-primary" />
                  Hero Image Slider
                </CardTitle>
                <CardDescription>
                  Kelola gambar carousel untuk hero section di halaman produk publik. Maksimal 5 gambar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageSliderManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fixed Banner Tab */}
          <TabsContent value="banner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Layout className="w-5 h-5 text-brand-primary" />
                  Fixed Banner
                </CardTitle>
                <CardDescription>
                  Kelola banner tetap yang ditampilkan di sisi kiri dan kanan blog post.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FixedBannerManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pop-up Campaign Tab */}
          <TabsContent value="popup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <MessageSquare className="w-5 h-5 text-brand-primary" />
                  Pop-up Campaign
                </CardTitle>
                <CardDescription>
                  Kelola pop-up promosi yang muncul saat login dashboard. Dapat diaktifkan/nonaktifkan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PopupCampaignManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}


