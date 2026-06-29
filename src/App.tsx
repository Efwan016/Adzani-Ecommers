import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Home from './pages/Home';

const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm'));

function RouteFallback() {
  return (
    <section className="flex min-h-[calc(100vh-76px)] items-center justify-center px-4 text-porcelain">
      <div className="state-panel text-sm">Please wait...</div>
    </section>
  );
}

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/products"
          element={
            <Layout>
              <LazyRoute>
                <Products />
              </LazyRoute>
            </Layout>
          }
        />
        <Route
          path="/products/:slug"
          element={
            <Layout>
              <LazyRoute>
                <ProductDetail />
              </LazyRoute>
            </Layout>
          }
        />
        <Route
          path="/cart"
          element={
            <Layout>
              <LazyRoute>
                <Cart />
              </LazyRoute>
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <LazyRoute>
              <Login />
            </LazyRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout>
                <LazyRoute>
                  <AdminDashboard />
                </LazyRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute>
              <Layout>
                <LazyRoute>
                  <AdminProducts />
                </LazyRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <Layout>
                <LazyRoute>
                  <AdminOrders />
                </LazyRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <ProtectedRoute>
              <Layout>
                <LazyRoute>
                  <ProductForm />
                </LazyRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <LazyRoute>
                  <ProductForm />
                </LazyRoute>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
