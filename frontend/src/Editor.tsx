import React, { useState, useEffect } from "react";
import { RichTextEditor } from "./RichTextEditor";
import {
  getDocument,
  updateDocument,
  shareDocument,
  unshareDocument,
  listUsers,
  type Document,
  type User,
} from "./api";
import { Share2, Save, Edit2, ChevronDown } from "lucide-react";

interface EditorProps {
  docId: number;
  onDocumentDeleted?: () => void;
  focusTitleOnOpen?: boolean;
}

export function Editor({
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
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocument();
    loadUsers();
  }, [docId]);

  useEffect(() => {
    if (isEditing) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditing]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const data = await getDocument(docId);
      setDoc(data);
      setContent(data.content);
      setTitleInput(data.title);
      setSaveState("saved");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load document"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await listUsers();
      // Filter out the current owner
      if (doc) {
        setUsers(allUsers.filter((u) => u.id !== doc.owner_id));
      } else {
        setUsers(allUsers);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [doc?.owner_id]);

  const isOwner = doc?.is_owner ?? false;
  const availableUsers = doc
    ? users.filter((u) => !doc.shared_with_users?.some((su) => su.id === u.id))
    : [];

  useEffect(() => {
    if (focusTitleOnOpen && isOwner) {
      setIsEditing(true);
    }
  }, [focusTitleOnOpen, isOwner]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleInput(e.target.value);
    setSaveState("unsaved");
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setSaveState("unsaved");
  };

  const handleSave = async () => {
    if (!doc) return;

    try {
      setError(null);
      setSaveState("saving");
      await updateDocument(doc.id, titleInput, content);
      setDoc({ ...doc, title: titleInput, content });
      setSaveState("saved");
    } catch (err) {
      setSaveState("unsaved");
      setError(err instanceof Error ? err.message : "Failed to save document");
    }
  };

  const handleShare = async () => {
    if (!doc || !selectedShareUser) return;

    try {
      await shareDocument(doc.id, selectedShareUser);
      setSelectedShareUser(null);
      loadDocument();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share document");
    }
  };

  const handleUnshare = async (userId: number) => {
    if (!doc) return;

    try {
      await unshareDocument(doc.id, userId);
      loadDocument();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unshare document");
    }
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
              onClick={() => isOwner && setIsEditing(true)}
              style={{
                cursor: isOwner ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <h1 className="editor-title">{titleInput}</h1>
              {isOwner && <Edit2 size={20} style={{ color: "#999" }} />}
            </div>
          )}
          <div className="text-muted">
            {isOwner ? "You own this document" : "Shared with you"}
            {isOwner && doc.shared_with_users?.length > 0 && (
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

          <button className="btn btn-primary" onClick={handleSave} disabled={saveState === "saving" || saveState === "saved"}>
            <Save size={16} style={{ marginRight: "4px", display: "inline" }} />
            {saveState === "saving" ? "Saving..." : "Save"}
          </button>

          {isOwner && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 size={16} style={{ marginRight: "4px", display: "inline" }} />
              Share
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message" style={{ margin: "20px" }}>{error}</div>}

      <div className="editor-container">
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          readOnly={!isOwner}
        />
      </div>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Share Document</h3>

            <div className="modal-content">
              <div className="input-group">
                <select
                  value={selectedShareUser || ""}
                  onChange={(e) =>
                    setSelectedShareUser(
                      e.target.value ? parseInt(e.target.value) : null
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
                <button
                  className="btn btn-primary"
                  onClick={handleShare}
                  disabled={!selectedShareUser}
                >
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
                        </div>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleUnshare(user.id)}
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowShareModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
