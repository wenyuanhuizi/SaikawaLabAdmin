import { useCallback, useEffect, useState } from "react";
import { deletePost, getPosts, type Post } from "../api";
import "./ManagePosts.css";

const CLOUD_FRONT_URL = "https://dwtzamkwegvv2.cloudfront.net/";
const PAGE_SIZE = 10;

export default function ManagePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // lightbox state
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPosts(p, PAGE_SIZE);
      setPosts(res.posts ?? []);
      setTotalPages(res.totalPages ?? (res.total ? Math.ceil(res.total / PAGE_SIZE) : 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  // close lightbox on Escape, navigate with arrow keys
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

  async function handleDelete(postID: string) {
    setDeletingId(postID);
    setConfirmId(null);
    try {
      await deletePost(postID);
      setPosts((prev) => prev.filter((p) => p.postID !== postID));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page mp-page">
      <div className="page-header mp-header-row">
        <div>
          <h1 className="page-title">Manage Posts</h1>
          <p className="page-subtitle">View and delete published posts</p>
        </div>
        <button className="mp-refresh" onClick={() => load(page)} disabled={loading}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {error && <div className="alert alert-error mp-alert">{error}</div>}

      {loading && posts.length === 0 && (
        <div className="mp-loading"><div className="spinner" /><span>Loading posts…</span></div>
      )}

      {!loading && posts.length === 0 && !error && (
        <div className="mp-empty">No posts found.</div>
      )}

      <div className="mp-grid">
        {posts.map((post) => (
          <PostCard
            key={post.postID}
            post={post}
            isDeleting={deletingId === post.postID}
            confirmPending={confirmId === post.postID}
            onAskConfirm={() => setConfirmId(post.postID)}
            onCancelConfirm={() => setConfirmId(null)}
            onConfirmDelete={() => handleDelete(post.postID)}
            onOpenLightbox={(images, index) => setLightbox({ images, index })}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mp-pagination">
          <button className="mp-page-btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="mp-page-info">Page {page} of {totalPages}</span>
          <button className="mp-page-btn" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="lb-backdrop" onClick={() => setLightbox(null)}>
          <button className="lb-close" onClick={() => setLightbox(null)} aria-label="Close">✕</button>

          {lightbox.images.length > 1 && (
            <button
              className="lb-arrow lb-arrow--left"
              onClick={(e) => { e.stopPropagation(); setLightbox((l) => l && { ...l, index: (l.index - 1 + l.images.length) % l.images.length }); }}
              aria-label="Previous"
            >‹</button>
          )}

          <div className="lb-img-wrap" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.images[lightbox.index]} alt="" className="lb-img" />
          </div>

          {lightbox.images.length > 1 && (
            <button
              className="lb-arrow lb-arrow--right"
              onClick={(e) => { e.stopPropagation(); setLightbox((l) => l && { ...l, index: (l.index + 1) % l.images.length }); }}
              aria-label="Next"
            >›</button>
          )}

          {lightbox.images.length > 1 && (
            <div className="lb-dots" onClick={(e) => e.stopPropagation()}>
              {lightbox.images.map((_, i) => (
                <button
                  key={i}
                  className={`lb-dot ${i === lightbox.index ? "lb-dot--active" : ""}`}
                  onClick={() => setLightbox((l) => l && { ...l, index: i })}
                  aria-label={`Image ${i + 1}`}
                />
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

interface PostCardProps {
  post: Post;
  isDeleting: boolean;
  confirmPending: boolean;
  onAskConfirm: () => void;
  onCancelConfirm: () => void;
  onConfirmDelete: () => void;
  onOpenLightbox: (images: string[], index: number) => void;
}

function PostCard({ post, isDeleting, confirmPending, onAskConfirm, onCancelConfirm, onConfirmDelete, onOpenLightbox }: PostCardProps) {
  const images = (post.imageKeys ?? []).map((key) => `${CLOUD_FRONT_URL}${key}`);
  const hasImages = images.length > 0;

  return (
    <div className={`mp-card ${isDeleting ? "mp-card--deleting" : ""}`}>
      <div className="mp-card-actions">
        {!confirmPending ? (
          <button className="mp-delete-btn" onClick={onAskConfirm} disabled={isDeleting} title="Delete post" aria-label="Delete post">
            {isDeleting ? <span className="mp-spinner-sm" /> : "✕"}
          </button>
        ) : (
          <div className="mp-confirm">
            <span className="mp-confirm-label">Delete?</span>
            <button className="mp-confirm-yes" onClick={onConfirmDelete}>Yes</button>
            <button className="mp-confirm-no" onClick={onCancelConfirm}>No</button>
          </div>
        )}
      </div>

      {/* ── Image gallery ── */}
      {hasImages && (
        <div className="mp-gallery">
          {images.length === 1 ? (
            <div className="mp-gallery-single" onClick={() => onOpenLightbox(images, 0)}>
              <img src={images[0]} alt={post.title} className="mp-gallery-img" />
              <div className="mp-gallery-zoom">⤢</div>
            </div>
          ) : (
            <div className={`mp-gallery-grid mp-gallery-grid--${Math.min(images.length, 4)}`}>
              {images.slice(0, 4).map((src, i) => (
                <div
                  key={i}
                  className="mp-gallery-cell"
                  onClick={() => onOpenLightbox(images, i)}
                >
                  <img src={src} alt={`${post.title} ${i + 1}`} className="mp-gallery-img" />
                  {i === 3 && images.length > 4 && (
                    <div className="mp-gallery-more">+{images.length - 4}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mp-card-body">
        <p className="mp-card-title">{post.title || "Untitled"}</p>
        <p className="mp-card-desc">{post.description || "—"}</p>
        <div className="mp-card-footer">
          {post.createdAt && <span className="mp-card-date">{new Date(post.createdAt).toLocaleDateString()}</span>}
          {images.length > 0 && (
            <span className="mp-card-img-count">{images.length} image{images.length > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}
