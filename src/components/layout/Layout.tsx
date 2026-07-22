import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen pt-20 text-porcelain">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
