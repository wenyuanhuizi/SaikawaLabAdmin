import { useEffect, useState } from "react";
import {
  getBugForms, getLatestAq, getOthersInterest, getStudentInterest,
  deleteBugForm, deleteEnvReport, deleteOthersInterest, deleteStudentInterest,
} from "../api";
import "./ViewForms.css";

const CLOUD_FRONT_URL = "https://dwtzamkwegvv2.cloudfront.net/";

type Tab = "student" | "others" | "bug" | "env";

interface FetchState {
  data: Record<string, unknown>[] | null;
  loading: boolean;
  error: string | null;
}

const EMPTY: FetchState = { data: null, loading: false, error: null };

const FETCHERS: Record<Tab, () => Promise<unknown[]>> = {
  student: getStudentInterest,
  others: getOthersInterest,
  bug: getBugForms,
  env: getLatestAq,
};

const DELETERS: Record<Tab, (id: string) => Promise<void>> = {
  student: deleteStudentInterest,
  others: deleteOthersInterest,
  bug: deleteBugForm,
  env: deleteEnvReport,
};

export default function ViewForms() {
  const [tab, setTab] = useState<Tab>("student");
  const [states, setStates] = useState<Record<Tab, FetchState>>({
    student: EMPTY, others: EMPTY, bug: EMPTY, env: EMPTY,
  });
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  async function load(t: Tab) {
    setStates((prev) => ({ ...prev, [t]: { data: null, loading: true, error: null } }));
    try {
      const data = (await FETCHERS[t]()) as Record<string, unknown>[];
      setStates((prev) => ({ ...prev, [t]: { data, loading: false, error: null } }));
    } catch (err) {
      setStates((prev) => ({
        ...prev,
        [t]: { data: null, loading: false, error: err instanceof Error ? err.message : "Failed to fetch" },
      }));
    }
  }

  async function handleDelete(t: Tab, id: string) {
    try {
      await DELETERS[t](id);
      setStates((prev) => ({
        ...prev,
        [t]: {
          ...prev[t],
          data: prev[t].data?.filter((item) => (item._id as string) !== id) ?? null,
        },
      }));
    } catch (err) {
      setStates((prev) => ({
        ...prev,
        [t]: { ...prev[t], error: err instanceof Error ? err.message : "Delete failed" },
      }));
    }
  }

  useEffect(() => { load("student"); }, []);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((l) => l && { ...l, index: (l.index + 1) % l.images.length });
      if (e.key === "ArrowLeft") setLightbox((l) => l && { ...l, index: (l.index - 1 + l.images.length) % l.images.length });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  function switchTab(t: Tab) {
    setTab(t);
    if (!states[t].data && !states[t].loading) load(t);
  }

  const current = states[tab];

  const tabs: { key: Tab; label: string }[] = [
    { key: "student", label: "Student Interest" },
    { key: "others", label: "Others Interest" },
    { key: "bug", label: "Bug Reports" },
    { key: "env", label: "Env Reports" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">View Forms</h1>
        <p className="page-subtitle">Browse submitted forms from the community</p>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? "tab-active" : ""}`} onClick={() => switchTab(t.key)}>
            {t.label}
          </button>
        ))}
        <button className="tab tab-refresh" onClick={() => load(tab)} disabled={current.loading} title="Refresh">
          {current.loading ? "⟳" : "↻"} Refresh
        </button>
      </div>

      <div className="card">
        {current.loading && (
          <div className="state-message"><div className="spinner" /><p>Loading…</p></div>
        )}
        {current.error && <div className="alert alert-error">{current.error}</div>}
        {current.data && current.data.length === 0 && (
          <div className="state-message"><p className="empty-text">No submissions yet.</p></div>
        )}
        {current.data && current.data.length > 0 && (
          <div className="form-list">
            {current.data.map((entry, i) => (
              <FormCard
                key={(entry._id as string) ?? i}
                index={i}
                data={entry}
                showImages={tab === "env"}
                onDelete={() => handleDelete(tab, entry._id as string)}
                onOpenLightbox={(images, index) => setLightbox({ images, index })}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="lb-backdrop" onClick={() => setLightbox(null)}>
          <button className="lb-close" onClick={() => setLightbox(null)} aria-label="Close">✕</button>
          {lightbox.images.length > 1 && (
            <button className="lb-arrow lb-arrow--left"
              onClick={(e) => { e.stopPropagation(); setLightbox((l) => l && { ...l, index: (l.index - 1 + l.images.length) % l.images.length }); }}
            >‹</button>
          )}
          <div className="lb-img-wrap" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.images[lightbox.index]} alt="" className="lb-img" />
          </div>
          {lightbox.images.length > 1 && (
            <button className="lb-arrow lb-arrow--right"
              onClick={(e) => { e.stopPropagation(); setLightbox((l) => l && { ...l, index: (l.index + 1) % l.images.length }); }}
            >›</button>
          )}
          {lightbox.images.length > 1 && (
            <div className="lb-dots" onClick={(e) => e.stopPropagation()}>
              {lightbox.images.map((_, i) => (
                <button key={i} className={`lb-dot ${i === lightbox.index ? "lb-dot--active" : ""}`}
                  onClick={() => setLightbox((l) => l && { ...l, index: i })} />
              ))}
            </div>
          )}
          {lightbox.images.length > 1 && (
            <div className="lb-counter">{lightbox.index + 1} / {lightbox.images.length}</div>
          )}
        </div>
      )}
    </div>
  );
}

interface FormCardProps {
  index: number;
  data: Record<string, unknown>;
  showImages: boolean;
  onDelete: () => void;
  onOpenLightbox: (images: string[], index: number) => void;
}

function FormCard({ index, data, showImages, onDelete, onOpenLightbox }: FormCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const imageKeys = showImages && Array.isArray(data.imageKeys)
    ? (data.imageKeys as string[]).filter(Boolean) : [];
  const images = imageKeys.map((k) => `${CLOUD_FRONT_URL}${k}`);

  const primaryKeys = ["name", "email", "title", "subject", "category", "description", "date", "createdAt", "timestamp"];
  const preview: [string, unknown][] = [];
  const rest: [string, unknown][] = [];

  for (const [k, v] of Object.entries(data)) {
    if (k === "imageKeys" || k === "_id" || k === "__v") continue;
    if (primaryKeys.includes(k)) preview.push([k, v]);
    else rest.push([k, v]);
  }

  const allFields = [...preview, ...rest];

  function handleConfirmDelete() {
    setDeleting(true);
    onDelete();
    setDeleting(false);
    setConfirmDelete(false);
  }

  return (
    <div className={`form-card ${deleting ? "form-card--deleting" : ""}`}>
      <div className="form-card-header" onClick={() => !confirmDelete && setExpanded((e) => !e)}>
        <span className="form-card-index">#{index + 1}</span>
        <div className="form-card-preview">
          {preview.slice(0, 2).map(([k, v]) => (
            <span key={k} className="form-card-field">
              <span className="field-key">{formatKey(k)}:</span>{" "}
              <span className="field-val">{formatValue(v)}</span>
            </span>
          ))}
        </div>
        {images.length > 0 && (
          <span className="form-card-img-badge">{images.length} img{images.length > 1 ? "s" : ""}</span>
        )}

        {/* Delete controls */}
        <div className="form-card-delete-zone" onClick={(e) => e.stopPropagation()}>
          {!confirmDelete ? (
            <button className="fc-delete-btn" onClick={() => setConfirmDelete(true)} title="Delete" aria-label="Delete">
              {deleting ? <span className="fc-spinner" /> : "✕"}
            </button>
          ) : (
            <div className="fc-confirm">
              <span className="fc-confirm-label">Delete?</span>
              <button className="fc-confirm-yes" onClick={handleConfirmDelete}>Yes</button>
              <button className="fc-confirm-no" onClick={() => setConfirmDelete(false)}>No</button>
            </div>
          )}
        </div>

        <span className="form-card-toggle">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="form-card-body">
          {images.length > 0 && (
            <div className="vf-gallery">
              {images.map((src, i) => (
                <div key={i} className="vf-gallery-thumb" onClick={() => onOpenLightbox(images, i)}>
                  <img src={src} alt={`image ${i + 1}`} />
                  <div className="vf-gallery-zoom">⤢</div>
                </div>
              ))}
            </div>
          )}
          <table className="field-table">
            <tbody>
              {allFields.map(([k, v]) => (
                <tr key={k}>
                  <td className="field-key-cell">{formatKey(k)}</td>
                  <td className="field-val-cell">{formatValue(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatKey(k: string) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}
