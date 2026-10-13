/* eslint-disable react-hooks/set-state-in-effect */
// FRONTEND/src/pages/admin/Categories.jsx

import { useEffect, useState } from "react";
import api from "../../services/api";
import { FolderTree, Plus, Edit, Trash2, X, Image as ImageIcon, Upload } from "lucide-react";
import { useConfirm } from "../../context/ConfirmContext";

export default function Categories() {
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [image, setImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

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
    setForm({ name: "" });
    setImage(null);
    setCurrentImageUrl("");
    setImagePreview("");
    setEditingId(null);
  };

  const uploadCategoryImage = async () => {
    if (!image) return currentImageUrl;
    const formData = new FormData();
    formData.append("image", image);
    formData.append("bucket", "categories");
    try {
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return uploadRes.data?.image_url || "";
    } catch {
      return "";
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const imageUrl = await uploadCategoryImage();
      await api.post("/categories", {
        name: form.name.trim(),
        imageUrl: imageUrl || "https://placehold.co/400x400?text=Category",
      });
      resetForm();
      getCategories();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const imageUrl = await uploadCategoryImage();
      await api.put(`/categories/${editingId}`, {
        name: form.name.trim(),
        imageUrl: imageUrl || "https://placehold.co/400x400?text=Category",
      });
      resetForm();
      getCategories();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({ name: category.name || "" });
    setCurrentImageUrl(category.imageUrl || category.image_url || "");
    setImage(null);
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ title: "Hapus kategori ini?", message: "Kategori yang dihapus tidak bisa dikembalikan.", confirmLabel: "Hapus Kategori", tone: "danger" }))) return;
    try {
      await api.delete(`/categories/${id}`);
      getCategories();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#162018] text-white flex items-center justify-center shadow-md">
            <FolderTree size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono text-[10px] font-black tracking-widest border border-stone-200">
                RS // CATALOG
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">
                HIERARKI PRODUK ATELIER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Barlow_Condensed'] uppercase tracking-tight mt-1">
              MANAJEMEN KATEGORI PRODUK
            </h1>
            <p className="text-stone-500 text-xs">
              Struktur klasifikasi katalog apparel olahraga dan perlengkapan atletik RegarStore.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-2xl bg-white border border-stone-200/80 text-xs font-mono shadow-xs">
          <span className="text-stone-500">Total Kategori:</span>
          <span className="font-bold text-slate-900 text-sm">{categories.length} Kategori</span>
        </div>
      </div>

      {/* Form Card with Tactical Forest & Topographic Texture */}
      <div className="relative overflow-hidden rounded-3xl border border-black/15 shadow-xl bg-[#162018] text-white p-6 sm:p-8">
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-400 font-mono text-[10px] font-black tracking-widest border border-white/10 uppercase">
                  RS // WORKSHOP KATEGORI
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Barlow_Condensed'] uppercase tracking-wide leading-none">
                {editingId ? "Edit Kategori Produk" : "Tambah Kategori Baru"}
              </h2>
              <p className="text-xs text-stone-300 mt-1">
                {editingId ? `Memperbarui data kategori ID #${editingId}` : "Masukkan nama kategori dan unggah ikon atau foto representatif"}
              </p>
            </div>
            {editingId && (
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#B9382B]/20 text-rose-300 border border-[#B9382B]/30">
                MODE EDIT
              </span>
            )}
          </div>

          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Name Input */}
              <div className="md:col-span-7 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">
                  NAMA KATEGORI *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jersey Futsal, Sepatu Running, Aksesori"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-black/35 border border-white/20 rounded-2xl px-4 py-3.5 text-white placeholder:text-stone-400 focus:outline-none focus:border-emerald-400 focus:bg-black/50 transition-all text-sm font-medium"
                />
                <p className="text-[11px] text-stone-400">
                  Nama kategori akan ditampilkan di navbar katalog toko dan filter produk pelanggan.
                </p>
              </div>

              {/* Image Upload */}
              <div className="md:col-span-5 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">
                  FOTO / IKON KATEGORI
                </label>
                <label className="flex flex-col items-center justify-center border border-dashed border-white/25 hover:border-emerald-400 bg-white/5 hover:bg-white/10 rounded-2xl h-36 cursor-pointer transition-colors group">
                  {imagePreview ? (
                    <div className="relative w-full h-full flex items-center justify-center p-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-30 rounded-xl object-cover border border-white/20 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setImage(null); setCurrentImageUrl(""); setImagePreview(""); }}
                        className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-full hover:bg-rose-700 shadow-sm cursor-pointer"
                        title="Hapus Foto"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center p-4 text-center">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-2 group-hover:bg-emerald-500/20 group-hover:border-emerald-400 transition-colors text-stone-300 group-hover:text-emerald-300">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-bold text-white">Pilih Foto Kategori</span>
                      <span className="text-[10px] text-stone-400 mt-0.5">JPG, PNG atau WebP (Maks. 2MB)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2 border-t border-white/10">
              {editingId ? (
                <>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={loading}
                    className="flex-1 bg-[#B9382B] hover:bg-[#9E2D22] text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#B9382B]/20 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {loading ? "Menyimpan Perubahan..." : "Simpan Perubahan Kategori"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3.5 border border-white/20 hover:bg-white/10 rounded-2xl text-xs font-bold text-stone-200 transition-all cursor-pointer"
                    title="Batalkan Edit"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !form.name.trim()}
                  className="bg-[#B9382B] hover:bg-[#9E2D22] text-white font-bold py-3.5 px-8 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#B9382B]/20 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Plus size={16} />
                  <span>{loading ? "Menambahkan..." : "Tambah Kategori Baru"}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 sm:px-8 py-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Barlow_Condensed'] uppercase tracking-wide">
              Daftar Kategori Aktif
            </h3>
            <p className="text-xs text-stone-500">Daftar seluruh kelompok apparel yang terdaftar di database</p>
          </div>
          <span className="text-xs text-stone-500 font-mono px-3 py-1 bg-stone-100 rounded-full font-bold">
            {categories.length} data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/80 text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-6 text-left">ID</th>
                <th className="py-3.5 px-6 text-left">Ikon / Foto</th>
                <th className="py-3.5 px-6 text-left">Nama Kategori</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-stone-50/70 transition-colors group">
                    <td className="py-4 px-6 text-xs text-stone-500 font-mono font-bold">
                      #{category.id}
                    </td>
                    <td className="py-4 px-6">
                      {(category.imageUrl || category.image_url) ? (
                        <img
                          src={category.imageUrl || category.image_url}
                          alt={category.name}
                          className="w-12 h-12 object-cover rounded-xl border border-stone-200 shadow-2xs"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 border border-stone-200">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 text-sm block">
                        {category.name}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        Slug: {category.name.toLowerCase().replace(/\s+/g, '-')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2.5 hover:bg-stone-100 rounded-xl text-stone-600 hover:text-slate-900 transition-colors cursor-pointer border border-transparent hover:border-stone-200"
                          title="Edit Kategori"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2.5 hover:bg-rose-50 rounded-xl text-rose-600 hover:text-rose-700 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title="Hapus Kategori"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="mx-auto w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mb-3 text-stone-400">
                      <FolderTree size={28} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Belum Ada Kategori</p>
                    <p className="text-xs text-stone-400 mt-1">Gunakan form di atas untuk membuat kategori baru.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}