import { useLocation } from "react-router-dom";
import React, { useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import SEOHead from '@/components/seo/SEOHead';

const NotFound = () => {
  const location = useLocation();
  // static render of DotLottieReact ensures reliable rendering in browser

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // We render the DotLottieReact component statically to match the working browser example.

  return (
    <>
      <SEOHead
        title="404 - Halaman Tidak Ditemukan | Regal Paw"
        description="Halaman yang Anda cari tidak ditemukan. Kembali ke beranda Regal Paw untuk melanjutkan belanja makanan kucing premium."
        keywords="404, halaman tidak ditemukan, error, Regal Paw"
        canonical="/404"
        ogType="website"
        noindex={true}
      />
      
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
        <h1 className="mb-1 text-6xl font-bold">404</h1>
        {/* Lottie animation (dotlottie) mounted here via React component when available, otherwise webcomponent fallback */}
        <div className="mt-1 mb-2 flex justify-center" aria-hidden="true">
          <DotLottieReact
            src="https://lottie.host/65ee3136-6637-40d2-af73-59c8a1357dfa/kU7camWTVV.lottie"
            autoplay
            loop
            style={{ width: 320, height: 320, background: 'transparent' }}
          />
        </div>
        <p className="text-3xl text-gray-600">Oops! Page not found</p>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          Return to Home
        </a>
      </div>
    </div>
    </>
  );
};

export default NotFound;
