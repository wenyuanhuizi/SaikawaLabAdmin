import { useRef, useState } from "react";
import { createPost, getPresignedUrl, uploadToS3 } from "../api";

interface ImageFile {
  file: File;
  preview: string;
  key?: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const added: ImageFile[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));
    setImages((prev) => [...prev, ...added]);
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    setSubmitting(true);

    try {
      const uploadedKeys: string[] = [];

      // Upload each image via presigned URL
      const updatedImages = [...images];
      for (let i = 0; i < updatedImages.length; i++) {
        const img = updatedImages[i];
        updatedImages[i] = { ...img, status: "uploading" };
        setImages([...updatedImages]);

        try {
          const presignedUrl = await getPresignedUrl(img.file);
          await uploadToS3(presignedUrl, img.file);
          const key = img.file.name;
          updatedImages[i] = { ...updatedImages[i], status: "done", key };
          uploadedKeys.push(key);
        } catch (err) {
          updatedImages[i] = {
            ...updatedImages[i],
            status: "error",
            error: err instanceof Error ? err.message : "Upload failed",
          };
        }
        setImages([...updatedImages]);
      }

      if (updatedImages.some((img) => img.status === "error")) {
        setResult({ ok: false, message: "Some images failed to upload. Fix errors and retry." });
        setSubmitting(false);
        return;
      }

      await createPost({ title, description, imageKeys: uploadedKeys });
      setResult({ ok: true, message: "Post created successfully!" });
      setTitle("");
      setDescription("");
      setImages([]);
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = title.trim() && description.trim();

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Create Post</h1>
        <p className="page-subtitle">Publish a new post to the Saikawa Lab website</p>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="label" htmlFor="title">
            Title <span className="required">*</span>
          </label>
          <input
            id="title"
            className="input"
            type="text"
            placeholder="Enter post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            className="input textarea"
            placeholder="Enter post description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
          />
        </div>

        <div className="field">
          <label className="label">Images</label>
          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-zone-icon">📁</div>
            <p className="drop-zone-text">Drag & drop images here, or click to browse</p>
            <p className="drop-zone-hint">Supports JPG, PNG, GIF, WebP</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {images.length > 0 && (
            <div className="image-grid">
              {images.map((img, i) => (
                <div key={i} className={`image-card status-${img.status}`}>
                  <img src={img.preview} alt={img.file.name} className="image-thumb" />
                  <div className="image-info">
                    <span className="image-name">{img.file.name}</span>
                    <span className={`image-status badge-${img.status}`}>
                      {img.status === "uploading" && "Uploading…"}
                      {img.status === "done" && "Uploaded"}
                      {img.status === "pending" && "Ready"}
                      {img.status === "error" && `Error: ${img.error}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="image-remove"
                    onClick={() => removeImage(i)}
                    disabled={submitting}
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {result && (
          <div className={`alert ${result.ok ? "alert-success" : "alert-error"}`}>
            {result.message}
          </div>
        )}

        <div className="form-divider" />

        <button
          type="submit"
          className="btn-primary"
          disabled={!isValid || submitting}
        >
          {submitting ? "Publishing…" : "Publish Post"}
        </button>
      </form>
    </div>
  );
}
