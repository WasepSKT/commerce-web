import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-[#6F1416] text-[#FFF4A8]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/regalpaw.png" alt="Regal Paw" className="h-10 w-auto" />
            </div>
            <p className="max-w-sm text-[#FFF4A8]/90">Menyediakan nutrisi premium untuk kucing Anda dengan bahan berkualitas dan standar internasional.</p>

            <div className="mt-6 flex items-center gap-3">
              <a aria-label="Facebook" className="inline-flex items-center justify-center h-9 w-9 rounded bg-white/10 hover:bg-white/20">
                <FaFacebookF className="text-[#FFF4A8]" />
              </a>
              <a aria-label="Twitter" className="inline-flex items-center justify-center h-9 w-9 rounded bg-white/10 hover:bg-white/20">
                <FaTwitter className="text-[#FFF4A8]" />
              </a>
              <a aria-label="Instagram" className="inline-flex items-center justify-center h-9 w-9 rounded bg-white/10 hover:bg-white/20">
                <FaInstagram className="text-[#FFF4A8]" />
              </a>
              <a aria-label="LinkedIn" className="inline-flex items-center justify-center h-9 w-9 rounded bg-white/10 hover:bg-white/20">
                <FaLinkedin className="text-[#FFF4A8]" />
              </a>
              <a aria-label="YouTube" className="inline-flex items-center justify-center h-9 w-9 rounded bg-white/10 hover:bg-white/20">
                <FaYoutube className="text-[#FFF4A8]" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#F8DF7C] mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-[#FFF4A8]/90">
              <li><Link to="/products">Features</Link></li>
              <li><Link to="/products">Pricing</Link></li>
              <li><Link to="/product-cases">Case studies</Link></li>
              <li><Link to="/reviews">Reviews</Link></li>
              <li><Link to="/updates">Updates</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#F8DF7C] mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-[#FFF4A8]/90">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
              <li><Link to="/career">Careers</Link></li>
              <li><Link to="/culture">Culture</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#F8DF7C] mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-[#FFF4A8]/90">
              <li><Link to="/help">Getting started</Link></li>
              <li><Link to="/help">Help center</Link></li>
              <li><Link to="/status">Server status</Link></li>
              <li><Link to="/support">Chat support</Link></li>
              <li><Link to="/report">Report a bug</Link></li>
            </ul>
          </div>
        </div>

        <hr className="border-t border-white/10 mt-8" />

        <div className="mt-6 text-center text-sm text-[#FFF4A8]/80">
          <p>Copyright © {new Date().getFullYear()} Regal Paw | All Rights Reserved | <Link to="/terms" className="underline">Terms and Conditions</Link> | <Link to="/privacy" className="underline">Privacy Policy</Link></p>
        </div>
      </div>
    </footer>
  );
}
