import React, { useEffect, useRef, useState } from "react";
import { RichTextEditor } from "./RichTextEditor";
import {
  getDocument,
  updateDocument,
  shareDocument,
  unshareDocument,
  listUsers,
  getCollaborationState,
  pingDocumentPresence,
  listDocumentVersions,
  restoreDocumentVersion,
  listDocumentComments,
  createDocumentComment,
  resolveDocumentComment,
  exportDocumentMarkdown,
  type DocumentVersion,
  type DocumentComment,
  type CollaborationState,
  type Document,
  type User,
} from "./api";
import {
  Share2,
  Save,
  Edit2,
  ChevronDown,
  FileDown,
  Printer,
  MessageCircle,
  History,
  Users,
  RefreshCw,
  PenLine,
} from "lucide-react";

interface EditorProps {
  docId: number;
  onDocumentDeleted?: () => void;
  focusTitleOnOpen?: boolean;
}

export function DocumentEditor({
  docId,
  onDocumentDeleted,
  focusTitleOnOpen = false,
}: EditorProps) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showShareModal, setShowShareModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedShareUser, setSelectedShareUser] = useState<number | null>(null);
  const [selectedShareRole, setSelectedShareRole] = useState<"viewer" | "commenter" | "editor">("viewer");
  const [collaboration, setCollaboration] = useState<CollaborationState | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentKind, setCommentKind] = useState<"comment" | "suggestion">("comment");
  const [showHistory, setShowHistory] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const snapshotRef = useRef({ versionCount: 0, commentCount: 0 });

  const isOwner = doc?.is_owner ?? false;
  const accessRole = doc?.permission_role ?? (isOwner ? "owner" : "viewer");
  const canEdit = isOwner || accessRole === "editor";
  const canComment = canEdit || accessRole === "commenter";
  const availableUsers = doc
    ? users.filter((user) => !doc.shared_with_users?.some((shared) => shared.id === user.id))
    : [];
  const activeCollaborators = collaboration?.active_collaborators ?? [];

  const loadUsers = async () => {
    try {
      const allUsers = await listUsers();
      if (doc) {
        setUsers(allUsers.filter((user) => user.id !== doc.owner_id));
      } else {
        setUsers(allUsers);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const refreshDocumentBundle = async (initialLoad = false) => {
    try {
      if (initialLoad) {
        setLoading(true);
      }

      const data = await getDocument(docId);
      const [collaborationState, versionData, commentData] = await Promise.all([
        getCollaborationState(docId),
        listDocumentVersions(docId),
        listDocumentComments(docId),
      ]);

      setDoc(data);
      setContent(data.content);
      setTitleInput(data.title);
      setCollaboration(collaborationState);
      setVersions(versionData);
      setComments(commentData);
      snapshotRef.current = {
        versionCount: collaborationState.version_count,
        commentCount: collaborationState.comment_count,
      };
      setSaveState("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document");
    } finally {
      if (initialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshDocumentBundle(true);
  }, [docId]);

  useEffect(() => {
    loadUsers();
  }, [doc?.owner_id]);

  useEffect(() => {
    if (!doc) {
      return;
    }

    let active = true;

    const pingPresence = async () => {
      try {
        const state = await pingDocumentPresence(docId);
        if (!active) {
          return;
        }

        setCollaboration(state);
        if (
          state.version_count !== snapshotRef.current.versionCount ||
          state.comment_count !== snapshotRef.current.commentCount
        ) {
          await refreshDocumentBundle(false);
        }
      } catch (err) {
        console.error("Failed to refresh collaboration state", err);
      }
    };

    pingPresence();
    const intervalId = window.setInterval(pingPresence, 8000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [doc?.id]);

  useEffect(() => {
    if (isEditing) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (focusTitleOnOpen && isOwner) {
      setIsEditing(true);
    }
  }, [focusTitleOnOpen, isOwner]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitleInput(event.target.value);
    setSaveState("unsaved");
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setSaveState("unsaved");
  };

  const handleSave = async () => {
    if (!doc || !canEdit) return;

    try {
      setError(null);
      setSaveState("saving");
      await updateDocument(doc.id, titleInput, content);
      await refreshDocumentBundle(false);
    } catch (err) {
      setSaveState("unsaved");
      setError(err instanceof Error ? err.message : "Failed to save document");
    }
  };

  const handleShare = async () => {
    if (!doc || !selectedShareUser) return;

    try {
      await shareDocument(doc.id, selectedShareUser, selectedShareRole);
      setSelectedShareUser(null);
      setSelectedShareRole("viewer");
      await refreshDocumentBundle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share document");
    }
  };

  const handleUnshare = async (userId: number) => {
    if (!doc) return;

    try {
      await unshareDocument(doc.id, userId);
      await refreshDocumentBundle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unshare document");
    }
  };

  const handleAddComment = async () => {
    if (!doc || !commentBody.trim() || !canComment) {
      return;
    }

    try {
      await createDocumentComment(doc.id, {
        body: commentBody.trim(),
        snippet: selectedText,
        kind: commentKind,
      });
      setCommentBody("");
      setSelectedText("");
      await refreshDocumentBundle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    }
  };

  const handleResolveComment = async (commentId: number, resolved: boolean) => {
    try {
      await resolveDocumentComment(commentId, resolved);
      await refreshDocumentBundle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update comment");
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    if (!doc || !isOwner) {
      return;
    }

    try {
      await restoreDocumentVersion(doc.id, versionId);
      await refreshDocumentBundle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore version");
    }
  };

  const handleExportMarkdown = async () => {
    if (!doc) return;

    try {
      const markdown = await exportDocumentMarkdown(doc.id);
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `${doc.title || "document"}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export markdown");
    }
  };

  const handleExportPdf = () => {
    if (!doc) return;

    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      setError("Unable to open print window");
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${doc.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111827; }
            h1 { font-size: 28px; margin-bottom: 8px; }
            .meta { color: #6b7280; margin-bottom: 24px; }
            .content { line-height: 1.7; }
          </style>
        </head>
        <body>
          <h1>${doc.title}</h1>
          <div class="meta">Saved from Docs App</div>
          <div class="content">${doc.content}</div>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading">Loading document...</div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="main-content">
        <div className="error-message">Document not found</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="editor-header">
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              type="text"
              className="input-rename"
              value={titleInput}
              onChange={handleTitleChange}
              onBlur={() => setIsEditing(false)}
              ref={titleInputRef}
              autoFocus
            />
          ) : (
            <div
              onClick={() => canEdit && setIsEditing(true)}
              style={{
                cursor: canEdit ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <h1 className="editor-title">{titleInput}</h1>
              {canEdit && <Edit2 size={20} style={{ color: "#999" }} />}
            </div>
          )}
          <div className="text-muted">
            {isOwner ? "You own this document" : `Access: ${accessRole}`}
            {doc.shared_with_users?.length > 0 && (
              <> • Shared with {doc.shared_with_users.length} user{doc.shared_with_users.length !== 1 ? "s" : ""}</>
            )}
          </div>
        </div>

        <div className="editor-actions">
          <div className="save-status" aria-live="polite">
            {saveState === "saving"
              ? "Saving..."
              : saveState === "saved"
              ? "Saved"
              : "Unsaved changes"}
          </div>

          {canEdit && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saveState === "saving" || saveState === "saved"}>
              <Save size={16} style={{ marginRight: "4px", display: "inline" }} />
              {saveState === "saving" ? "Saving..." : "Save"}
            </button>
          )}

          {isOwner && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 size={16} style={{ marginRight: "4px", display: "inline" }} />
              Share
            </button>
          )}

          <button className="btn btn-secondary" onClick={handleExportMarkdown}>
            <FileDown size={16} style={{ marginRight: "4px", display: "inline" }} />
            Export Markdown
          </button>

          <button className="btn btn-secondary" onClick={handleExportPdf}>
            <Printer size={16} style={{ marginRight: "4px", display: "inline" }} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="collaboration-strip">
        <div className="collaboration-pill">
          <Users size={14} />
          <span>
            {activeCollaborators.length > 0
              ? `${activeCollaborators.length} active collaborator${activeCollaborators.length !== 1 ? "s" : ""}`
              : "No active collaborators"}
          </span>
        </div>
        <div className="collaboration-avatars">
          {activeCollaborators.length > 0 ? activeCollaborators.map((collaborator) => (
            <span
              key={collaborator.id}
              className="collaboration-avatar"
              title={`${collaborator.username} • ${collaborator.role}`}
            >
              {collaborator.username.slice(0, 1).toUpperCase()}
            </span>
          )) : (
            <span className="text-muted">Presence updates every few seconds</span>
          )}
        </div>
      </div>

      {error && <div className="error-message" style={{ margin: "20px" }}>{error}</div>}

      <div className="editor-container">
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          readOnly={!canEdit}
          onSelectionChange={setSelectedText}
        />
      </div>

      <div className="document-tools-grid">
        <section className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <MessageCircle size={16} />
              Comments and Suggestions
            </div>
            <button className="btn btn-secondary btn-small" onClick={() => setShowComments((value) => !value)}>
              <ChevronDown size={14} style={{ transform: showComments ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
          </div>

          {showComments && (
            <div className="panel-body">
              {canComment && (
                <div className="comment-form">
                  <div className="comment-mode-switch">
                    <button className={`btn btn-small ${commentKind === "comment" ? "btn-primary" : "btn-secondary"}`} onClick={() => setCommentKind("comment")}>Comment</button>
                    <button className={`btn btn-small ${commentKind === "suggestion" ? "btn-primary" : "btn-secondary"}`} onClick={() => setCommentKind("suggestion")}>Suggestion</button>
                  </div>
                  <textarea
                    className="comment-input"
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    placeholder={selectedText ? `Comment on: ${selectedText}` : "Add a comment or suggestion..."}
                  />
                  <div className="comment-meta-row">
                    <span className="text-muted">
                      {selectedText ? `Attached to: ${selectedText}` : "Select text in the editor to anchor a note."}
                    </span>
                    <button className="btn btn-primary btn-small" onClick={handleAddComment} disabled={!commentBody.trim()}>
                      <PenLine size={14} style={{ marginRight: "4px", display: "inline" }} />
                      Add
                    </button>
                  </div>
                </div>
              )}

              <div className="comment-list">
                {comments.length === 0 ? (
                  <div className="empty-inline">No comments yet.</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className={`comment-item ${comment.is_resolved ? "resolved" : ""}`}>
                      <div className="comment-head">
                        <div>
                          <strong>{comment.author.username}</strong>
                          <span className="doc-list-item-badge">{comment.kind}</span>
                        </div>
                        <button className="btn btn-secondary btn-small" onClick={() => handleResolveComment(comment.id, !comment.is_resolved)}>
                          {comment.is_resolved ? "Reopen" : "Resolve"}
                        </button>
                      </div>
                      {comment.snippet && <div className="comment-snippet">“{comment.snippet}”</div>}
                      <div className="comment-body">{comment.body}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        <section className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <History size={16} />
              Version History
            </div>
            <button className="btn btn-secondary btn-small" onClick={() => setShowHistory((value) => !value)}>
              <ChevronDown size={14} style={{ transform: showHistory ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
          </div>

          {showHistory && (
            <div className="panel-body">
              <div className="comment-list">
                {versions.length === 0 ? (
                  <div className="empty-inline">No saved versions yet.</div>
                ) : (
                  versions.map((version) => (
                    <div key={version.id} className="version-item">
                      <div>
                        <div className="version-title">Version {version.version_number}</div>
                        <div className="text-muted">{new Date(version.created_at).toLocaleString()}</div>
                      </div>
                      {isOwner && (
                        <button className="btn btn-secondary btn-small" onClick={() => handleRestoreVersion(version.id)}>
                          <RefreshCw size={14} style={{ marginRight: "4px", display: "inline" }} />
                          Restore
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>Share Document</h3>

            <div className="modal-content">
              <div className="input-group">
                <select
                  value={selectedShareUser || ""}
                  onChange={(event) =>
                    setSelectedShareUser(
                      event.target.value ? parseInt(event.target.value) : null
                    )
                  }
                >
                  <option value="">Select a user to share with...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedShareRole}
                  onChange={(event) => setSelectedShareRole(event.target.value as "viewer" | "commenter" | "editor")}
                >
                  <option value="viewer">Viewer</option>
                  <option value="commenter">Commenter</option>
                  <option value="editor">Editor</option>
                </select>
                <button className="btn btn-primary" onClick={handleShare} disabled={!selectedShareUser}>
                  Share
                </button>
              </div>

              {doc.shared_with_users && doc.shared_with_users.length > 0 && (
                <>
                  <h4 style={{ marginTop: "16px", marginBottom: "8px" }}>
                    Shared with:
                  </h4>
                  <div className="share-list">
                    {doc.shared_with_users.map((user) => (
                      <div key={user.id} className="share-item">
                        <div>
                          <div className="share-item-name">{user.username}</div>
                          <div className="text-muted">{user.email}</div>
                          <div className="text-muted">Role: {user.role}</div>
                        </div>
                        <button className="btn btn-danger btn-small" onClick={() => handleUnshare(user.id)}>
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
