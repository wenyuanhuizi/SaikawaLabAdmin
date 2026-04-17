import { useCallback, useEffect, useState } from "react";
import { deletePost, getPosts, type Post } from "../api";
import "./ManagePosts.css";

const PAGE_SIZE = 10;

export default function ManagePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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
        <div className="mp-loading">
          <div className="spinner" />
          <span>Loading posts…</span>
        </div>
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
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mp-pagination">
          <button
            className="mp-page-btn"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span className="mp-page-info">Page {page} of {totalPages}</span>
          <button
            className="mp-page-btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
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
}

const IMAGE_BASE = "https://storage.googleapis.com/saikawalab-427516.appspot.com/";

function PostCard({ post, isDeleting, confirmPending, onAskConfirm, onCancelConfirm, onConfirmDelete }: PostCardProps) {
  const thumb = post.imageKeys?.[0];

  return (
    <div className={`mp-card ${isDeleting ? "mp-card--deleting" : ""}`}>
      {/* Delete / confirm zone */}
      <div className="mp-card-actions">
        {!confirmPending ? (
          <button
            className="mp-delete-btn"
            onClick={onAskConfirm}
            disabled={isDeleting}
            title="Delete post"
            aria-label="Delete post"
          >
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

      {thumb && (
        <div className="mp-card-img-wrap">
          <img
            src={`${IMAGE_BASE}${thumb}`}
            alt={post.title}
            className="mp-card-img"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      <div className="mp-card-body">
        <p className="mp-card-title">{post.title || "Untitled"}</p>
        <p className="mp-card-desc">{post.description || "—"}</p>
        {post.createdAt && (
          <p className="mp-card-date">{new Date(post.createdAt).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}
