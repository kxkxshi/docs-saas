// API utilities
const API_BASE = "/api";

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface SharedUser extends User {
  role: "viewer" | "commenter" | "editor" | "owner";
}

export interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  title: string;
  content: string;
  created_by_id?: number | null;
  created_at: string;
}

export interface DocumentComment {
  id: number;
  document_id: number;
  author_id: number;
  body: string;
  snippet: string;
  kind: "comment" | "suggestion";
  is_resolved: boolean;
  created_at: string;
  author: User;
}

export interface CollaboratorPresence {
  id: number;
  username: string;
  email: string;
  role: string;
  last_seen_at: string;
  is_active: boolean;
}

export interface CollaborationState {
  document_id: number;
  access_role: "owner" | "viewer" | "commenter" | "editor";
  shared_with_users: SharedUser[];
  active_collaborators: CollaboratorPresence[];
  version_count: number;
  comment_count: number;
}

export interface Document {
  id: number;
  title: string;
  content: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
  is_shared: boolean;
  permission_role: "owner" | "viewer" | "commenter" | "editor";
  shared_with_users?: SharedUser[];
}

export interface DocumentListItem {
  id: number;
  title: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
  is_shared: boolean;
  permission_role: "owner" | "viewer" | "commenter" | "editor";
  shared_with_users?: SharedUser[];
}

export interface CommentCreatePayload {
  body: string;
  snippet?: string;
  kind?: "comment" | "suggestion";
}

export interface SharePayload {
  user_id: number;
  role: "viewer" | "commenter" | "editor";
}

let currentUserId: number | null = null;

export function setCurrentUser(userId: number) {
  currentUserId = userId;
}

function resolveCurrentUserId() {
  if (currentUserId) {
    return currentUserId;
  }

  const storedUserId = Number(localStorage.getItem("userId") || "0");
  return storedUserId > 0 ? storedUserId : null;
}

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const userId = resolveCurrentUserId();
  if (userId) {
    headers["x-user-id"] = String(userId);
  }
  return headers;
}

// Auth API
export async function listUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE}/auth/users`);
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Not authenticated");
  return response.json();
}

// Documents API
async function readErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data?.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function listDocuments(): Promise<DocumentListItem[]> {
  const response = await fetch(`${API_BASE}/documents`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch documents");
  return response.json();
}

export async function getDocument(docId: number): Promise<Document> {
  const response = await fetch(`${API_BASE}/documents/${docId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Document not found");
  return response.json();
}

export async function createDocument(
  title: string,
  content: string = ""
): Promise<Document> {
  const response = await fetch(`${API_BASE}/documents`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, content }),
  });
  if (!response.ok) throw new Error("Failed to create document");
  return response.json();
}

export async function updateDocument(
  docId: number,
  title?: string,
  content?: string
): Promise<Document> {
  const body: Record<string, string> = {};
  if (title !== undefined) body.title = title;
  if (content !== undefined) body.content = content;

  const response = await fetch(`${API_BASE}/documents/${docId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Failed to update document");
  return response.json();
}

export async function deleteDocument(docId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${docId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete document");
}

export async function shareDocument(
  docId: number,
  userId: number,
  role: "viewer" | "commenter" | "editor" = "viewer"
): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${docId}/share`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ user_id: userId, role }),
  });
  if (!response.ok) throw new Error("Failed to share document");
}

export async function unshareDocument(
  docId: number,
  userId: number
): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${docId}/share/${userId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to unshare document");
}

export async function uploadFile(file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  const userId = resolveCurrentUserId();

  const response = await fetch(`${API_BASE}/documents/upload/file`, {
    method: "POST",
    headers: userId ? { "x-user-id": String(userId) } : {},
    body: formData,
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "Failed to upload file"));
  return response.json();
}

export async function getCollaborationState(docId: number): Promise<CollaborationState> {
  const response = await fetch(`${API_BASE}/documents/${docId}/collaboration`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to load collaboration state");
  return response.json();
}

export async function pingDocumentPresence(docId: number): Promise<CollaborationState> {
  const response = await fetch(`${API_BASE}/documents/${docId}/presence`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to update presence");
  return response.json();
}

export async function listDocumentVersions(docId: number): Promise<DocumentVersion[]> {
  const response = await fetch(`${API_BASE}/documents/${docId}/versions`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to load version history");
  return response.json();
}

export async function restoreDocumentVersion(docId: number, versionId: number): Promise<Document> {
  const response = await fetch(`${API_BASE}/documents/${docId}/versions/${versionId}/restore`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to restore version");
  return response.json();
}

export async function listDocumentComments(docId: number): Promise<DocumentComment[]> {
  const response = await fetch(`${API_BASE}/documents/${docId}/comments`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to load comments");
  return response.json();
}

export async function createDocumentComment(docId: number, payload: CommentCreatePayload): Promise<DocumentComment> {
  const response = await fetch(`${API_BASE}/documents/${docId}/comments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to add comment");
  return response.json();
}

export async function resolveDocumentComment(commentId: number, isResolved: boolean): Promise<DocumentComment> {
  const response = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ is_resolved: isResolved }),
  });
  if (!response.ok) throw new Error("Failed to update comment");
  return response.json();
}

export async function exportDocumentMarkdown(docId: number): Promise<string> {
  const response = await fetch(`${API_BASE}/documents/${docId}/export/markdown`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to export markdown");
  return response.text();
}
