/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Package, Upload, Sliders } from "lucide-react";
import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import ManageSizeStockModal from "../../components/admin/ManageSizeStockModal";
import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";

export default function Products() {
  const confirm = useConfirm();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [image, setImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const searchTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    category_id: "",
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  const getProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products", {
        params: {
          search: debouncedSearch || undefined,
          categoryId: categoryFilter || undefined,
          page,
          size: 12,
        },
      });
      const pageData = res.data?.data || res.data;
      const list = Array.isArray(pageData?.content)
        ? pageData.content
        : Array.isArray(pageData)
        ? pageData
        : [];
      const normalized = list.map((p) => ({
        ...p,
        image_url: p.imageUrl || p.image_url || "",
        category: {
          id: p.categoryId || p.category_id,
          name: p.categoryName || p.category?.name || "Kategori",
        },
      }));
      setProducts(normalized);
      setTotalPages(pageData?.totalPages || 1);
    } catch (error) {
      console.error(error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategories = async () => {
    try {
      const res = await api.get("/categories");
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setCategories(list);
    } catch (error) {
      console.error(error);
      setCategories([]);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [search]);

  useEffect(() => {
    getProducts();
  }, [debouncedSearch, categoryFilter, page]);

  // Image preview
  useEffect(() => {
    if (!image) {
      setImagePreview(currentImageUrl);
      return;
    }
    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [image, currentImageUrl]);

  const resetForm = () => {
    setForm({ category_id: "", name: "", description: "", price: "", stock: "" });
    setImage(null);
    setCurrentImageUrl("");
    setImagePreview("");
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error("Nama dan harga wajib diisi");
      return;
    }
    setSubmitting(true);
    let toastId = null;
    try {
      let imageUrl = "";
      if (image) {
        toastId = toast.loading("Mengunggah foto ke Cloudinary...");
        const formData = new FormData();
        formData.append("image", image);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data?.image_url || uploadRes.data?.data?.imageUrl || "";
      }
      await api.post("/products", {
        categoryId: Number(form.category_id) || (categories[0]?.id || 1),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        imageUrl: imageUrl || "https://placehold.co/600x400?text=Jersey",
      });
      if (toastId) toast.dismiss(toastId);
      toast.success("Produk berhasil ditambahkan");
      resetForm();
      getProducts();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error(error.response?.data?.message || "Gagal menambahkan produk");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    const img = product.image_url || product.imageUrl || "";
    setCurrentImageUrl(img);
    setImagePreview(img);
    setForm({
      category_id: product.categoryId || product.category_id || product.category?.id || "",
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
    });
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Otomatis scroll mulus ke atas formulir agar admin langsung melihat form edit
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async () => {
    if (!form.name.trim() || !form.price) {
      toast.error("Nama dan harga wajib diisi");
      return;
    }
    setSubmitting(true);
    let toastId = null;
    try {
      let imageUrl = currentImageUrl;
      if (image) {
        toastId = toast.loading("Mengunggah gambar baru ke Cloudinary...");
        const formData = new FormData();
        formData.append("image", image);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data?.image_url || uploadRes.data?.data?.imageUrl || imageUrl;
      }
      await api.put(`/products/${editingId}`, {
        categoryId: Number(form.category_id) || (categories[0]?.id || 1),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        imageUrl: imageUrl || "https://placehold.co/600x400?text=Jersey",
      });
      if (toastId) toast.dismiss(toastId);
      toast.success("Produk & gambar berhasil diperbarui");
      resetForm();
      getProducts();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error(error.response?.data?.message || "Gagal mengupdate produk");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ title: "Hapus produk ini?", message: "Produk akan hilang dari katalog dan tidak bisa dikembalikan.", confirmLabel: "Hapus Produk", tone: "danger" }))) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Produk dihapus");
      getProducts();
    } catch (error) {
      toast.error("Gagal menghapus produk");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-bold tracking-widest uppercase mb-2">
            <Package size={12} className="text-[#B9382B]" />
            <span>RS // INVENTORY CATALOGUE</span>
          </div>
          <h1 className="font-['Barlow_Condensed'] font-black uppercase tracking-tight text-3xl sm:text-4xl text-slate-900 leading-none">
            KATALOG PRODUK OLAHRAGA
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Kelola inventaris apparel, penetapan harga, stok per ukuran, dan dokumentasi visual produk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-stone-200/80 px-4 py-2 rounded-2xl shadow-xs text-right">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Produk</p>
            <p className="font-['Barlow_Condensed'] font-black text-xl text-slate-900 leading-tight">
              {products.length} Item Ditampilkan
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3 bg-white border border-stone-200/80 rounded-2xl px-4 py-3 flex-1 md:max-w-md shadow-xs focus-within:border-[#B9382B] focus-within:ring-1 focus-within:ring-[#B9382B] transition-all group">
          <Search size={18} className="text-stone-400 group-focus-within:text-[#B9382B] transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jersey, sepatu, aksesoris..."
            className="flex-1 bg-transparent text-slate-900 text-sm outline-hidden placeholder:text-stone-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setPage(1);
              setCategoryFilter(e.target.value);
            }}
            className="bg-white border border-stone-200/80 rounded-2xl px-4 py-3 text-slate-800 text-sm font-semibold outline-hidden focus:border-[#B9382B] transition-all cursor-pointer shadow-xs pr-10 appearance-none"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Form Card with Tactical Forest & Topographic Texture */}
      <div className="relative overflow-hidden rounded-3xl border border-black/15 shadow-xl bg-[#162018] text-white p-6 sm:p-8">
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl shadow-sm ${editingId ? "bg-amber-500/20 text-amber-300 border border-amber-400/30" : "bg-[#B9382B] text-white"}`}>
                {editingId ? <Pencil size={20} /> : <Plus size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-400 font-mono text-[10px] font-black tracking-widest border border-white/10 uppercase">
                    RS // WORKSHOP PRODUK
                  </span>
                </div>
                <h2 className="font-['Barlow_Condensed'] font-black uppercase tracking-wide text-2xl text-white leading-none">
                  {editingId ? "Edit Rincian Produk" : "Tambah Produk Baru"}
                </h2>
                <p className="text-xs text-stone-300 mt-1">
                  {editingId ? "Perbarui informasi spesifikasi atau foto produk" : "Daftarkan jersey atau apparel baru ke etalase toko"}
                </p>
              </div>
            </div>
            {editingId && (
              <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-stone-200">
                ID: #{editingId}
              </span>
            )}
          </div>

          <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(); } : handleCreate} className="space-y-6">
            {/* Baris 1: Nama, Kategori, Harga, Stok */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Nama Produk */}
              <div className="md:col-span-5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jersey Timnas Home Pro 2026"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-black/35 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-400 focus:bg-black/50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-hidden transition-all font-medium"
                />
              </div>

              {/* Kategori */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Kategori *
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full bg-[#1b271d] border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-hidden transition-all cursor-pointer font-medium"
                >
                  <option value="" className="bg-[#162018] text-white">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#162018] text-white">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harga */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Harga (Rp) *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-black/35 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-400 focus:bg-black/50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-hidden transition-all font-mono font-bold"
                />
              </div>

              {/* Stok */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Total Stok
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full bg-black/35 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-400 focus:bg-black/50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-hidden transition-all font-mono font-bold"
                />
              </div>
            </div>

            {/* Baris 2: Deskripsi & Upload Gambar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Deskripsi */}
              <div className="md:col-span-7">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Deskripsi Produk & Spesifikasi Bahan
                </label>
                <textarea
                  placeholder="Jelaskan bahan kain (misal Dry-Fit Milano, Anti-Bakteri), teknologi sablon, dan instruksi perawatan..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-black/35 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-stone-400 focus:bg-black/50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Upload / Ganti Gambar */}
              <div className="md:col-span-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300">
                    {editingId ? "Ganti Foto Produk" : "Foto Utama Produk"}
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setCurrentImageUrl("");
                        setImagePreview("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-bold transition cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                {imagePreview ? (
                  <div className="relative border border-white/20 rounded-2xl p-2.5 bg-black/30 flex items-center gap-4 h-28">
                    <div className="w-24 h-full rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/20 flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80";
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-1.5 pr-2">
                      <p className="text-xs text-stone-200 font-semibold truncate max-w-48">
                        {image ? image.name : "Foto produk aktif"}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-fit flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl text-xs text-white font-bold transition active:scale-95 cursor-pointer shadow-sm"
                      >
                        <Upload size={13} />
                        Ganti Berkas
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-white/25 hover:border-emerald-400 rounded-2xl h-28 cursor-pointer transition-all group bg-white/5 hover:bg-white/10"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-1 group-hover:scale-105 group-hover:bg-emerald-500/20 group-hover:border-emerald-400 transition-all shadow-sm">
                      <Upload size={18} className="text-stone-300 group-hover:text-emerald-300 transition-colors" />
                    </div>
                    <span className="text-xs text-stone-200 font-semibold group-hover:text-white transition-colors">
                      Klik untuk unggah foto jersey
                    </span>
                    <span className="text-[10px] text-stone-400">
                      JPG, PNG, WEBP (Maksimal 10MB)
                    </span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setImage(file);
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              {editingId ? (
                <>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={submitting}
                    className="flex-1 bg-[#B9382B] hover:bg-[#9E2D22] disabled:opacity-70 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#B9382B]/20 active:scale-[0.98] cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Menyimpan Perubahan...
                      </>
                    ) : (
                      <>
                        <Pencil size={18} />
                        Simpan Perubahan Produk
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition text-stone-200 font-bold text-sm cursor-pointer"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !form.name.trim() || !form.price}
                  className="flex-1 bg-[#B9382B] hover:bg-[#9E2D22] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#B9382B]/20 active:scale-[0.98] cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menambahkan ke Database...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Terbitkan Produk Baru
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <ScreenLoader label="Memuat produk katalog..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="Produk belum ditemukan"
          description="Coba ubah kata kunci pencarian atau daftarkan produk baru melalui form di atas."
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Menampilkan <span className="text-slate-900 font-black">{products.length}</span> item pada etalase
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white border border-stone-200/80 rounded-3xl overflow-hidden hover:border-stone-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Container */}
                <div className="relative aspect-square bg-stone-100 overflow-hidden">
                  <img
                    src={product.image_url || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />

                  {/* Gradient Overlay on hover */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Quick actions overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={() => setSelectedProductForStock(product)}
                      className="flex-1 flex items-center justify-center gap-1 bg-white/95 backdrop-blur-xs hover:bg-[#162018] text-stone-800 hover:text-white px-2 py-2 rounded-xl text-xs font-bold transition-all border border-stone-200/80 shadow-md cursor-pointer"
                      title="Kelola kuota stok per ukuran"
                    >
                      <Sliders size={13} /> Stok
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center gap-1 bg-white/95 backdrop-blur-xs hover:bg-blue-600 text-blue-700 hover:text-white px-2 py-2 rounded-xl text-xs font-bold transition-all border border-stone-200/80 shadow-md cursor-pointer"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex items-center justify-center bg-white/95 backdrop-blur-xs hover:bg-rose-600 text-rose-700 hover:text-white p-2 rounded-xl text-xs font-bold transition-all border border-stone-200/80 shadow-md cursor-pointer"
                      title="Hapus produk"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Category Badge */}
                  {product.category?.name && (
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#FAF0ED] text-[#B9382B] border border-[#B9382B]/20 backdrop-blur-xs shadow-xs">
                        {product.category.name}
                      </span>
                    </div>
                  )}

                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shadow-xs ${
                      product.stock > 10
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : product.stock > 0
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}>
                      {product.stock > 0 ? `${product.stock} pcs` : "Habis"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-slate-900 font-bold text-base line-clamp-1 group-hover:text-[#B9382B] transition-colors">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="text-stone-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    {/* Size Stock Chips Breakdown */}
                    {product.sizeStocks && Object.keys(product.sizeStocks).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-stone-100">
                        {Object.entries(product.sizeStocks).slice(0, 5).map(([sz, st]) => {
                          const numSt = Number(st) || 0;
                          const isZero = numSt === 0;
                          const isLow = numSt > 0 && numSt < 5;
                          return (
                            <span
                              key={sz}
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                                isZero
                                  ? "bg-rose-50 text-rose-700 border-rose-200 line-through opacity-70"
                                  : isLow
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-stone-100 text-stone-700 border-stone-200"
                              }`}
                            >
                              {sz}:{st}
                            </span>
                          );
                        })}
                        {Object.keys(product.sizeStocks).length > 5 && (
                          <span className="text-[9px] text-stone-400 self-center px-1">
                            +{Object.keys(product.sizeStocks).length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between mt-4 pt-3 border-t border-stone-100">
                    <div>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Harga Resmi</p>
                      <p className="text-[#B9382B] font-['Barlow_Condensed'] font-black text-2xl tracking-tight leading-none mt-0.5">
                        Rp {Number(product.price).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedProductForStock(product)}
                      className="text-[11px] text-stone-600 hover:text-[#B9382B] flex items-center gap-1 font-bold transition cursor-pointer"
                    >
                      <Sliders size={12} />
                      Ubah Stok
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200/80 hover:bg-stone-50 rounded-xl text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-xs shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Sebelumnya
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                  p === page
                    ? "bg-[#B9382B] text-white shadow-xs"
                    : "bg-white border border-stone-200/80 text-stone-600 hover:bg-stone-50 hover:text-slate-900"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200/80 hover:bg-stone-50 rounded-xl text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-xs shadow-xs cursor-pointer"
          >
            Berikutnya
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Manage Size Stock Modal */}
      {selectedProductForStock && (
        <ManageSizeStockModal
          product={selectedProductForStock}
          onClose={() => setSelectedProductForStock(null)}
          onStockUpdated={(updated) => {
            setProducts((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
            );
          }}
        />
      )}
    </div>
  );
}