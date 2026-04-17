const BASE = "https://api1-dot-saikawalab-427516.uc.r.appspot.com/api/v1";

export async function getPresignedUrl(file: File): Promise<string> {
  const res = await fetch(
    `${BASE}/generate-presigned-url?imageKey=${file.name}&contentType=${file.type}`
  );
  if (!res.ok) throw new Error(`Failed to get presigned URL for ${file.name}: ${res.statusText}`);
  const { presignedUrl } = await res.json();
  if (!presignedUrl) throw new Error(`No presigned URL returned for ${file.name}`);
  return presignedUrl;
}

export async function uploadToS3(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
}

export async function createPost(data: {
  title: string;
  description: string;
  imageKeys: string[];
}): Promise<unknown> {
  const res = await fetch(`${BASE}/create-post-meta-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create post failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function getStudentInterest(): Promise<unknown[]> {
  const res = await fetch(`${BASE}/student-interest`);
  if (!res.ok) throw new Error(`Failed to fetch student interest: ${res.statusText}`);
  return res.json();
}

export async function getOthersInterest(): Promise<unknown[]> {
  const res = await fetch(`${BASE}/others-interest`);
  if (!res.ok) throw new Error(`Failed to fetch others interest: ${res.statusText}`);
  return res.json();
}

export async function getBugForms(): Promise<unknown[]> {
  const res = await fetch(`${BASE}/bug-form`);
  if (!res.ok) throw new Error(`Failed to fetch bug forms: ${res.statusText}`);
  return res.json();
}

export interface Post {
  postID: string;
  title: string;
  description: string;
  imageKeys: string[];
  createdAt?: string;
  [key: string]: unknown;
}

export interface PostsResponse {
  posts: Post[];
  total?: number;
  page?: number;
  totalPages?: number;
}

export async function getPosts(page = 1, limit = 10): Promise<PostsResponse> {
  const res = await fetch(`${BASE}/posts?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.statusText}`);
  const data = await res.json();
  // normalise: API might return array or { posts: [] }
  if (Array.isArray(data)) return { posts: data };
  return data as PostsResponse;
}

export async function deletePost(postID: string): Promise<void> {
  const res = await fetch(`${BASE}/posts/${encodeURIComponent(postID)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete failed (${res.status}): ${text}`);
  }
}

export async function getLatestAq(): Promise<unknown[]> {
  const res = await fetch(`${BASE}/env-reports`);
  if (!res.ok) throw new Error(`Failed to fetch env reports: ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}
