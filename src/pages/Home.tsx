import HeroSection from '../components/ui/HeroSection';
import ProductGrid from '../components/product/ProductGrid';
import FeatureSection from '../components/ui/FeatureSection';
import FeaturedProductsSection from '../components/ui/FeaturedProductsSection';
import SupabaseSection from '../components/ui/SupabaseSection';
import { RouteSeo } from '../lib/seo';

const HOME_SEO = {
  title: 'Adzani Store | Katalog Elektronik, Aksesoris HP & Voucher',
  description:
    'Toko konter elektronik dan aksesoris HP dengan katalog online, stok jelas, dan checkout cepat lewat WhatsApp.',
  ogTitle: 'Adzani Store | Elektronik, Aksesoris HP & Voucher',
  ogDescription:
    'Pilih barang dari katalog Adzani Store, tambahkan ke cart, lalu checkout via WhatsApp untuk dikonfirmasi admin.',
};

export default function Home() {
  return (
    <div className="w-full overflow-x-hidden flex flex-col gap-6">
      <RouteSeo meta={HOME_SEO} />
      <HeroSection />
      <ProductGrid />
      <FeaturedProductsSection />
      <FeatureSection />
      <SupabaseSection />
    </div>
  );
}
