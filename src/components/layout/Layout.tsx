import type { ReactNode } from 'react';
import Navbar from './Navbar';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen text-porcelain">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
