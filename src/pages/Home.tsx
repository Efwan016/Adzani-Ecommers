import HeroSection from '../components/ui/HeroSection';
import ProductGrid from '../components/product/ProductGrid';
import FeatureSection from '../components/ui/FeatureSection';
import SupabaseSection from '../components/ui/SupabaseSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProductGrid />
      <FeatureSection />
      <SupabaseSection />
    </>
  );
}
