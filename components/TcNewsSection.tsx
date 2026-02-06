"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditContext } from "@/contexts/EditContext";
import { getServerUrl } from "@/lib/serverUrl";

type NewsItem = {
  id: string;
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
};

function normalizeImageUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/api/")) return getServerUrl() + src;
  return src;
}

export default function TcNewsSection() {
  const { isEditMode } = useEditContext();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setBody("");
    setLinkUrl("");
    setLinkLabel("");
    setImageFile(null);
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/news", { cache: "no-store" });
      const data = await response.json();
      if (data.success) {
        setItems(Array.isArray(data.items) ? data.items : []);
        setError(null);
      } else {
        setError(data.message || "Erreur de chargement");
      }
    } catch (err) {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Titre et contenu requis");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("body", body.trim());
      if (linkUrl.trim()) formData.append("linkUrl", linkUrl.trim());
      if (linkLabel.trim()) formData.append("linkLabel", linkLabel.trim());
      if (imageFile) formData.append("image", imageFile);

      const endpoint = editingId ? `/api/news/${editingId}` : "/api/news";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erreur lors de l'enregistrement");
      }

      resetForm();
      await loadItems();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setBody(item.body || "");
    setLinkUrl(item.linkUrl || "");
    setLinkLabel(item.linkLabel || "");
    setImageFile(null);
  };

  const handleDelete = async (item: NewsItem) => {
    if (!confirm(`Supprimer "${item.title}" ?`)) return;
    try {
      const response = await fetch(`/api/news/${item.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Suppression echouee");
      }
      await loadItems();
    } catch (err: any) {
      setError(err?.message || "Suppression echouee");
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = a.createdAt ? Date.parse(a.createdAt) : 0;
      const dateB = b.createdAt ? Date.parse(b.createdAt) : 0;
      return dateB - dateA;
    });
  }, [items]);

  return (
    <section className="tc-news">
      <h2 className="tc-news-title">Les dernieres Actualites de TC</h2>

      {loading ? (
        <p className="tc-news-empty">Chargement...</p>
      ) : sortedItems.length === 0 ? (
        <p className="tc-news-empty">Aucune actualite pour le moment.</p>
      ) : (
        <div className="tc-news-list">
          {sortedItems.map((item) => (
            <article key={item.id} className="tc-news-item">
              {item.imageUrl && (
                <div className="tc-news-thumb">
                  <img src={normalizeImageUrl(item.imageUrl)} alt={item.title} />
                </div>
              )}
              <div className="tc-news-content">
                <div className="tc-news-heading">
                  <h3>{item.title}</h3>
                  {isEditMode && (
                    <div className="tc-news-actions">
                      <button type="button" onClick={() => handleEdit(item)}>Modifier</button>
                      <button type="button" onClick={() => handleDelete(item)}>Supprimer</button>
                    </div>
                  )}
                </div>
                <p>{item.body}</p>
                {item.linkUrl && (
                  <a className="tc-news-link" href={item.linkUrl} target="_blank" rel="noopener noreferrer">
                    {item.linkLabel || "Voir le lien"}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {error && <p className="tc-news-error">{error}</p>}

      {isEditMode && (
        <form className="tc-news-form" onSubmit={handleSubmit}>
          <h3>{editingId ? "Modifier l'actualite" : "Ajouter une actualite"}</h3>

          <label>
            Titre
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <label>
            Texte
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          </label>

          <label>
            Lien (optionnel)
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
          </label>

          <label>
            Texte du lien (optionnel)
            <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Lire la suite" />
          </label>

          <label>
            Image (optionnel)
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </label>

          <div className="tc-news-form-actions">
            <button type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
            {editingId && (
              <button type="button" className="secondary" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
