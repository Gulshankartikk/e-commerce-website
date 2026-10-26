import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useFetch from '../hooks/useFetch.js';
import HeroSlider from '../components/home/HeroSlider.jsx';
import AIFeatureShowcase from '../components/home/AIFeatureShowcase.jsx';
import CategoryGrid from '../components/home/CategoryGrid.jsx';
import FlashSaleBand from '../components/home/FlashSaleBand.jsx';
import ProductRow from '../components/product/ProductRow.jsx';
import Testimonials from '../components/home/Testimonials.jsx';
import BrandsMarquee from '../components/home/BrandsMarquee.jsx';

/** Landing page — hero, AI Copilot showcase, categories, product carousels, reviews, brands. */
export default function Home() {
  const { data: home, loading } = useFetch('/products/home');
  const { data: bannersData, loading: bannersLoading } = useFetch('/banners?position=hero');
  const { data: catData, loading: catLoading } = useFetch('/categories');
  const { data: brandData } = useFetch('/brands');
  const user = useSelector((s) => s.auth.user);

  useEffect(() => { document.title = 'FlashShop — AI-Powered E-Commerce Store'; }, []);

  return (
    <>
      <HeroSlider banners={bannersData?.banners} loading={bannersLoading} />
      {/* Visual product recommendations shoppers can act on showcase */}
      <AIFeatureShowcase featuredProducts={home?.featured} />
      <CategoryGrid categories={catData?.categories} loading={catLoading} />
      <FlashSaleBand products={home?.flashSale} loading={loading} />
      <ProductRow title="Featured products" subtitle="Hand-picked by our team" products={home?.featured} loading={loading} viewAllLink="/products?featured=true" />
      <ProductRow title="Best sellers" subtitle="What everyone is buying" products={home?.bestSellers} loading={loading} viewAllLink="/products?sort=best-selling" />
      <ProductRow title="New arrivals" subtitle="Just landed this week" products={home?.newArrivals} loading={loading} viewAllLink="/products?sort=newest" />
      <ProductRow title="Trending now" subtitle="Most reviewed by the community" products={home?.trending} loading={loading} viewAllLink="/products?sort=most-rated" />
      {user?.recentlyViewed?.length > 0 && (
        <ProductRow title="Recently viewed" subtitle="Pick up where you left off" products={user.recentlyViewed} loading={false} />
      )}
      <Testimonials />
      <BrandsMarquee brands={brandData?.brands} />
    </>
  );
}
