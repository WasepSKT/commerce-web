# Regal Paw - Premium Cat Food E-commerce

A modern e-commerce platform for premium cat food and pet supplies, built with React, TypeScript, and Supabase.

## 🐱 About Regal Paw

Regal Paw is a comprehensive e-commerce solution for cat owners who want the best nutrition for their feline companions. Our platform offers:

- **Premium Cat Food Products** - High-quality nutrition from trusted brands
- **Blog & Tips** - Expert advice on cat care and nutrition
- **Admin Dashboard** - Complete product and content management
- **SEO Optimized** - Automatic SEO generation for better search rankings
- **Responsive Design** - Works perfectly on all devices

## 🚀 Features

### Customer Features

- Browse and search premium cat food products
- Detailed product information with reviews and ratings
- Shopping cart and checkout system
- User profiles and order history
- Blog with cat care tips and nutrition advice
- Responsive design for mobile and desktop

### Admin Features

- Product management with image uploads
- Blog post creation with rich text editor
- Order management and tracking
- User management
- SEO optimization tools
- Analytics dashboard

### Technical Features

- **Automatic SEO Generation** - SEO metadata generated automatically
- **Real-time SEO Preview** - See how content appears in search results
- **Structured Data** - Rich snippets for better search rankings
- **PWA Support** - Progressive Web App capabilities
- **Image Optimization** - Automatic image processing and optimization

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: TanStack Query, React Hook Form
- **Rich Text Editor**: TipTap
- **Icons**: Lucide React
- **Charts**: Recharts
- **SEO**: React Helmet Async, Schema.org structured data

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Setup Steps

1. **Clone the repository**

   ```bash
git clone <YOUR_GIT_URL>
   cd regal-purrfect-shop
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   Run the Supabase migrations to set up the database schema:

   ```bash
   # Apply all migrations in supabase/migrations/
   ```

5. **Start development server**

   ```bash
npm run dev
```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🗄️ Database Schema

The application uses the following main tables:

- **profiles** - User profiles with roles and referral codes
- **products** - Product catalog with SEO metadata
- **blogs** - Blog posts with rich content and SEO optimization
- **orders** - Order management and tracking
- **order_items** - Individual order line items
- **categories** - Product and blog categories
- **blog_categories** - Many-to-many relationship for blog categorization

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 📱 PWA Features

The application includes Progressive Web App capabilities:

- **App Manifest** - Install as a native app
- **Service Worker** - Offline functionality
- **Responsive Design** - Works on all screen sizes
- **App Icons** - Custom icons for different platforms

## 🔍 SEO Features

Automatic SEO optimization includes:

- **Meta Tags** - Auto-generated titles, descriptions, and keywords
- **Open Graph** - Social media sharing optimization
- **Structured Data** - Schema.org markup for rich snippets
- **Canonical URLs** - Proper URL structure
- **Sitemap** - Automatic sitemap generation

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

### Manual Deployment

1. Build the project: `npm run build`
2. Upload the `dist` folder to your web server
3. Configure your server to serve the SPA

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🙏 Acknowledgments

- Built with modern React and TypeScript best practices
- UI components from shadcn/ui and Radix UI
- Backend powered by Supabase
- Icons by Lucide React
- Styling with Tailwind CSS