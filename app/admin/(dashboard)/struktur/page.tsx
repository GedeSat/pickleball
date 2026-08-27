"use client";

import { useEffect, useState } from "react";
import { buildTree, OrgNode } from "@/lib/buildTree";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/swal";

type FlatItem = {
  id: string;
  name: string;
  position: string;
  order: number;
  parentId: string | null;
  photoUrl: string | null;
};

// Extension type to include properties passed by spread in buildTree
type OrgTreeCustomNode = OrgNode & {
  photoUrl: string | null;
};

export default function StrukturAdminPage() {
  const [items, setItems] = useState<FlatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FlatItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    position: "",
    order: 0,
    parentId: "",
    photoUrl: "",
  });

  async function fetchData() {
    setLoading(true);
    const res = await fetch("/api/struktur");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openAddModal(parentId?: string) {
    setEditing(null);
    setForm({
      name: "",
      position: "",
      order: 0,
      parentId: parentId || "",
      photoUrl: "",
    });
    setModalOpen(true);
  }

  function openEditModal(item: FlatItem) {
    setEditing(item);
    setForm({
      name: item.name,
      position: item.position,
      order: item.order,
      parentId: item.parentId || "",
      photoUrl: item.photoUrl || "",
    });
    setModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const resData = await res.json();
      if (resData.success && resData.data?.url) {
        setForm((prev) => ({ ...prev, photoUrl: resData.data.url }));
        showSuccess("Foto berhasil diunggah!", "Berhasil 🖼️");
      } else {
        showError("Gagal mengunggah foto");
      }
    } catch (err) {
      console.error(err);
      showError("Terjadi kesalahan saat mengunggah foto");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name,
      position: form.position,
      order: Number(form.order),
      parentId: form.parentId || null,
      photoUrl: form.photoUrl || null,
    };

    try {
      let res;
      if (editing) {
        res = await fetch(`/api/struktur/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/struktur", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        showSuccess(
          editing ? "Data pengurus berhasil diperbarui!" : "Pengurus baru berhasil ditambahkan!",
          "Tersimpan! 🎉"
        );
        setModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        showError(errData.error || "Gagal menyimpan data");
      }
    } catch (err) {
      console.error(err);
      showError("Terjadi kesalahan saat menyimpan data");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await showDeleteConfirm(
      "Jabatan di bawahnya otomatis akan dipromosikan ke tingkat yang lebih tinggi.",
      "Yakin hapus pengurus ini? 🗑️"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/struktur/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Gagal menghapus data");
      } else {
        showSuccess("Pengurus telah dihapus dari struktur organisasi.", "Terhapus! 🗑️");
      }
    } catch (err) {
      console.error(err);
      showError("Terjadi kesalahan jaringan saat menghapus data.");
    } finally {
      fetchData();
    }
  }

  const tree = buildTree(items) as OrgTreeCustomNode[];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Struktur Organisasi</h1>
        <button
          onClick={() => openAddModal()}
          className="bg-primary text-[#ffffff] px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-sm"
        >
          + Tambah Ketua Umum / Root
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Memuat data...</p>
      ) : tree.length === 0 ? (
        <p className="text-gray-500">Belum ada data struktur organisasi.</p>
      ) : (
        <div className="overflow-x-auto pb-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-center min-w-max">
            <OrgTree
              nodes={tree}
              onAddChild={openAddModal}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-slate-800">
              {editing ? "Edit Anggota" : "Tambah Anggota"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Nama</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Jabatan</label>
                <input
                  required
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none text-slate-900"
                  placeholder="Ketua Umum, Bendahara, dll"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Foto Profil</label>
                <div className="flex items-center gap-3 border border-slate-200 rounded-lg p-2 bg-slate-50">
                  {form.photoUrl ? (
                    <img
                      src={form.photoUrl}
                      alt="Preview"
                      className="w-12 h-12 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 border border-slate-300">
                      👤
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-800 hover:file:bg-primary-100 transition-colors"
                    />
                    {uploading && <span className="text-[10px] text-primary-700 block mt-1">Mengunggah...</span>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Atasan</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary outline-none text-slate-900"
                >
                  <option value="">— Tidak ada (Root / Ketua Umum) —</option>
                  {items
                    .filter((i) => i.id !== editing?.id)
                    .map((i) => (
                      <option key={i.id} value={i.id} className="text-slate-900">
                        {i.name} ({i.position})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Urutan</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-primary text-[#ffffff] hover:bg-primary-hover transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgTree({
  nodes,
  onAddChild,
  onEdit,
  onDelete,
}: {
  nodes: OrgTreeCustomNode[];
  onAddChild: (parentId: string) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex gap-8">
      {nodes.map((node) => (
        <div key={node.id} className="flex flex-col items-center">
          <div className="bg-white border-2 border-primary rounded-xl px-4 py-3 shadow-md min-w-[200px] text-center transition-all hover:shadow-lg">
            
            {/* Foto profil */}
            {node.photoUrl ? (
              <img
                src={node.photoUrl}
                alt={node.name}
                className="w-16 h-16 rounded-full mx-auto object-cover mb-2 border-2 border-primary-100 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full mx-auto bg-slate-100 flex items-center justify-center mb-2 border border-slate-200 shadow-sm">
                <span className="text-2xl text-slate-400">👤</span>
              </div>
            )}

            <p className="font-bold text-slate-900 leading-tight">{node.name}</p>
            <p className="text-xs text-primary-700 font-semibold mt-0.5">{node.position}</p>
            
            <div className="flex justify-center gap-3 mt-3 border-t border-slate-150 pt-2 text-xs">
              <button
                onClick={() => onAddChild(node.id)}
                className="text-amber-600 hover:text-amber-700 font-bold"
              >
                + Bawahan
              </button>
              <button
                onClick={() => onEdit(node)}
                className="text-primary-700 hover:text-primary-800 font-bold"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(node.id)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                Hapus
              </button>
            </div>
          </div>

          {node.children.length > 0 && (
            <>
              <div className="w-px h-6 bg-slate-300" />
              <div className="relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-slate-300" />
                <div className="flex gap-8 pt-6">
                  <OrgTree
                    nodes={node.children as OrgTreeCustomNode[]}
                    onAddChild={onAddChild}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
