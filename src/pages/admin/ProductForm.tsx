import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createProduct,
  getProductById,
  updateProduct,
  type CreateProductInput,
  type UpdateProductInput,
} from '../../services/productService';
import { MAX_PRODUCT_IMAGE_SIZE, uploadProductImage } from '../../services/productImageService';
import { slugify } from '../../lib/slugify';

type ProductFormState = {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  cost_price: string;
  stock: string;
  image_url: string;
  is_active: boolean;
};

const initialFormState: ProductFormState = {
  name: '',
  slug: '',
  description: '',
  category: 'Umum',
  price: '',
  cost_price: '',
  stock: '',
  image_url: '',
  is_active: true,
};

function getProductInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [form, setForm] = useState<ProductFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [hasLoadedEditProduct, setHasLoadedEditProduct] = useState(!isEditMode);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [imageUploadSuccess, setImageUploadSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const slugPreview = useMemo(() => slugify(form.name), [form.name]);
  const imagePreviewUrl = form.image_url.trim();
  const pageTitle = isEditMode ? 'Edit Produk' : 'Tambah Produk';
  const pageCopy = isEditMode
    ? 'Perbarui informasi produk yang sudah tampil di admin dan katalog.'
    : 'Tambahkan produk baru untuk dikelola admin dan ditampilkan di katalog.';
  const submitLabel = isEditMode ? 'Update Produk' : 'Simpan Produk';

  useEffect(() => {
    if (!isEditMode || !id) {
      setForm(initialFormState);
      setIsLoading(false);
      setHasLoadedEditProduct(true);
      setIsSlugManuallyEdited(false);
      setImageUploadError('');
      setImageUploadSuccess('');
      setErrorMessage('');
      setSuccessMessage('');
      return;
    }

    let isMounted = true;

    const loadProduct = async () => {
      setIsLoading(true);
      setForm(initialFormState);
      setHasLoadedEditProduct(false);
      setIsSlugManuallyEdited(true);
      setImageUploadError('');
      setImageUploadSuccess('');
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const product = await getProductById(id);

        if (!isMounted) {
          return;
        }

        if (!product) {
          setErrorMessage('Produk tidak ditemukan.');
          return;
        }

        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description ?? '',
          category: product.category || 'Umum',
          price: String(product.price),
          cost_price: product.cost_price === null ? '' : String(product.cost_price),
          stock: String(product.stock),
          image_url: product.image_url ?? '',
          is_active: product.is_active,
        });
        setHasLoadedEditProduct(true);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat produk.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  const hasEditLoadError = isEditMode && !isLoading && !hasLoadedEditProduct && Boolean(errorMessage);

  const handleChange = (field: keyof ProductFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setImageUploadError('');
    setImageUploadSuccess('');

    if (!file.type.startsWith('image/')) {
      setImageUploadError('File harus berupa gambar.');
      input.value = '';
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      setImageUploadError('Ukuran gambar maksimal 3MB.');
      input.value = '';
      return;
    }

    setIsUploadingImage(true);

    try {
      const publicUrl = await uploadProductImage(file, form.slug.trim() || slugPreview);
      handleChange('image_url', publicUrl);
      setImageUploadSuccess('Gambar produk berhasil diupload dan URL sudah masuk ke form.');
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : 'Gagal upload gambar produk.');
    } finally {
      setIsUploadingImage(false);
      input.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const price = Number(form.price);
    const costPrice = form.cost_price === '' ? null : Number(form.cost_price);
    const stock = Number(form.stock);

    if (!form.name.trim()) {
      setErrorMessage('Nama produk wajib diisi.');
      return;
    }

    if (!form.slug.trim()) {
      setErrorMessage('Slug wajib diisi.');
      return;
    }

    if (Number.isNaN(price) || price < 0) {
      setErrorMessage('Harga jual tidak boleh negatif.');
      return;
    }

    if (Number.isNaN(stock) || stock < 0) {
      setErrorMessage('Stok tidak boleh negatif.');
      return;
    }

    if (costPrice !== null && (Number.isNaN(costPrice) || costPrice < 0)) {
      setErrorMessage('Harga modal tidak boleh negatif.');
      return;
    }

    if (isUploadingImage) {
      setErrorMessage('Tunggu upload gambar selesai sebelum menyimpan produk.');
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreateProductInput | UpdateProductInput = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        category: form.category.trim() || 'Umum',
        price,
        cost_price: costPrice,
        stock,
        image_url: imagePreviewUrl || null,
        is_active: form.is_active,
      };

      if (isEditMode && id) {
        await updateProduct(id, input);
      } else {
        await createProduct(input);
      }

      const message = isEditMode ? 'Produk berhasil diperbarui.' : 'Produk baru berhasil dibuat.';
      setSuccessMessage(`${message} Mengarahkan ke daftar produk...`);
      await new Promise((resolve) => setTimeout(resolve, 700));
      navigate('/admin/products', { state: { feedback: message } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal menyimpan produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="surface-card mb-6 overflow-hidden">
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-end md:p-7 lg:p-8">
          <div>
            <p className="eyebrow">Admin Produk</p>
            <h1 className="page-title">{pageTitle}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-mist md:text-base">{pageCopy}</p>
          </div>

          <Link to="/admin/products" className="btn-secondary">
            Kembali ke Manajemen Produk
          </Link>
        </div>
      </div>

      {isLoading && <div className="state-panel">Memuat produk...</div>}

      {hasEditLoadError && (
        <div className="error-panel p-5">
          <p className="text-lg font-semibold text-porcelain">Produk edit belum bisa dimuat.</p>
          <p className="mt-2 text-sm">{errorMessage}</p>
          <Link to="/admin/products" className="btn-secondary mt-5">
            Kembali ke Manajemen Produk
          </Link>
        </div>
      )}

      {!isLoading && !hasEditLoadError && (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="surface-card p-5 md:p-6">
            <div className="mb-5">
              <p className="eyebrow">Informasi utama</p>
              <h2 className="mt-2 text-2xl font-semibold text-porcelain">Data Produk</h2>
              <p className="mt-2 text-sm leading-6 text-mist">
                Nama, slug, deskripsi, dan kategori akan dipakai customer saat melihat katalog.
              </p>
            </div>

            <div className="grid gap-5">
              <label className="field-label">
                <span>Nama produk</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name: nextName,
                      slug: isSlugManuallyEdited ? current.slug : slugify(nextName),
                    }));
                  }}
                  className="field-control"
                  placeholder="Contoh: Case Silicone iPhone 15"
                  required
                />
              </label>

              <label className="field-label">
                <span>Slug</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(event) => {
                    setIsSlugManuallyEdited(true);
                    handleChange('slug', event.target.value);
                  }}
                  className="field-control"
                  placeholder="contoh-case-silicone-iphone-15"
                  required
                />
                <span className="text-xs leading-5 text-smoke">
                  Create mode otomatis mengikuti nama sampai slug diedit manual. Preview nama: {slugPreview || '-'}
                </span>
              </label>

              <label className="field-label">
                <span>Deskripsi</span>
                <textarea
                  value={form.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  rows={7}
                  className="field-control min-h-40 resize-y"
                  placeholder="Tulis detail produk, kondisi, kompatibilitas, atau catatan penting."
                />
              </label>

              <label className="field-label">
                <span>Kategori</span>
                <input
                  type="text"
                  value={form.category}
                  onChange={(event) => handleChange('category', event.target.value)}
                  className="field-control"
                  placeholder="Umum"
                />
              </label>
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="surface-card overflow-hidden p-4">
              <div className="relative overflow-hidden rounded-md border border-white/10 bg-ink/70">
                {imagePreviewUrl ? (
                  <img src={imagePreviewUrl} alt="Preview produk" className="h-64 w-full object-cover" />
                ) : (
                  <div className="flex h-64 w-full flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(166,216,194,0.16),rgba(226,196,130,0.08))] text-center">
                    <span className="grid h-16 w-16 place-items-center rounded-lg border border-sage/30 bg-ink/60 text-xl font-black text-sage">
                      {getProductInitials(form.name) || 'AZ'}
                    </span>
                    <span className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Preview gambar</span>
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs leading-5 text-smoke">
                Upload gambar produk atau paste URL manual. Preview akan mengikuti isi field URL gambar.
              </p>

              <label className="mt-4 block rounded-md border border-dashed border-white/14 bg-white/5 p-4">
                <span className="block text-sm font-semibold text-porcelain">Upload gambar produk</span>
                <span className="mt-1 block text-xs leading-5 text-smoke">
                  Pilih file gambar maksimal 3MB. Nama file akan dibuat dari slug produk dan timestamp.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage || isSubmitting}
                  className="mt-3 block w-full text-sm text-mist file:mr-4 file:rounded-md file:border-0 file:bg-sage file:px-4 file:py-2 file:text-sm file:font-bold file:text-ink hover:file:bg-[#b7e3d0] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              {isUploadingImage && (
                <p className="mt-3 rounded-md border border-sage/25 bg-sage/10 px-3 py-2 text-xs font-semibold text-sage">
                  Mengupload gambar...
                </p>
              )}

              {imageUploadError && (
                <p className="error-panel mt-3 text-sm">{imageUploadError}</p>
              )}

              {imageUploadSuccess && !imageUploadError && (
                <p className="mt-3 rounded-md border border-sage/30 bg-sage/10 px-3 py-2 text-sm font-semibold text-sage">
                  {imageUploadSuccess}
                </p>
              )}
            </div>

            <div className="surface-card p-5">
              <div className="mb-5">
                <p className="eyebrow">Harga dan stok</p>
                <h2 className="mt-2 text-2xl font-semibold text-porcelain">Detail Penjualan</h2>
              </div>

              <div className="grid gap-4">
                <label className="field-label">
                  <span>Harga jual</span>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(event) => handleChange('price', event.target.value)}
                    className="field-control"
                    placeholder="0"
                    required
                  />
                </label>

                <label className="field-label">
                  <span>Harga modal</span>
                  <input
                    type="number"
                    min="0"
                    value={form.cost_price}
                    onChange={(event) => handleChange('cost_price', event.target.value)}
                    className="field-control"
                    placeholder="0"
                  />
                </label>

                <label className="field-label">
                  <span>Stok</span>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) => handleChange('stock', event.target.value)}
                    className="field-control"
                    placeholder="0"
                    required
                  />
                </label>

                <label className="field-label">
                  <span>URL gambar</span>
                  <input
                  type="url"
                  value={form.image_url}
                  onChange={(event) => {
                    setImageUploadError('');
                    setImageUploadSuccess('');
                    handleChange('image_url', event.target.value);
                  }}
                  className="field-control"
                  placeholder="https://example.com/image.jpg"
                />
                  <span className="text-xs leading-5 text-smoke">
                    Upload gambar produk atau paste URL manual. URL publik ini akan tersimpan ke produk.
                  </span>
                </label>

                <label className="surface-muted flex cursor-pointer items-center justify-between gap-4 px-4 py-4">
                  <span>
                    <span className="block text-sm font-semibold text-porcelain">Status aktif</span>
                    <span className="mt-1 block text-xs leading-5 text-smoke">
                      Produk aktif akan tampil di katalog customer.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => handleChange('is_active', event.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-7 w-12 shrink-0 items-center rounded-full border p-1 transition ${
                      form.is_active
                        ? 'justify-end border-sage/40 bg-sage/20'
                        : 'justify-start border-white/10 bg-white/8'
                    }`}
                  >
                    <span className={`h-5 w-5 rounded-full ${form.is_active ? 'bg-sage' : 'bg-smoke'}`} />
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="surface-card p-4 lg:col-span-2">
            {errorMessage && <p className="error-panel mb-4 text-sm">{errorMessage}</p>}
            {successMessage && (
              <p className="mb-4 rounded-md border border-sage/30 bg-sage/10 p-4 text-sm font-semibold text-sage">
                {successMessage}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-mist">
                Pastikan nama, harga, stok, dan status sudah benar sebelum menyimpan.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/admin/products" className="btn-secondary">
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading || isUploadingImage}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploadingImage ? 'Menunggu Upload...' : isSubmitting ? 'Menyimpan...' : submitLabel}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
