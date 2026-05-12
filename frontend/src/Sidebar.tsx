import React, { useState, useEffect } from "react";
import {
  listDocuments,
  createDocument,
  deleteDocument,
  type DocumentListItem,
} from "./api";
import { Plus, Upload, Trash2 } from "lucide-react";

interface SidebarProps {
  documents: DocumentListItem[];
  selectedDocId: number | null;
  onSelectDoc: (docId: number) => void;
  onCreateNew: () => void;
  onFileUpload: (file: File) => void;
  loading: boolean;
  error: string | null;
}

export function Sidebar({
  documents,
  selectedDocId,
  onSelectDoc,
  onCreateNew,
  onFileUpload,
  loading,
  error,
}: SidebarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (
    e: React.MouseEvent<HTMLButtonElement>,
    docId: number
  ) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDocument(docId);
        window.location.reload();
      } catch (err) {
        console.error("Failed to delete document", err);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>📄 Documents</h2>
        <div style={{ marginTop: "12px", marginBottom: "12px" }}>
          <button className="btn btn-primary btn-block" onClick={onCreateNew}>
            <Plus size={16} style={{ marginRight: "4px", display: "inline" }} />
            New Doc
          </button>
        </div>
        <div>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} style={{ marginRight: "4px", display: "inline" }} />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.docx"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
      </div>

      <div className="sidebar-content">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-muted" style={{ padding: "16px", textAlign: "center" }}>
            No documents yet. Create one to get started!
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className={`doc-list-item ${
                selectedDocId === doc.id ? "active" : ""
              }`}
              onClick={() => onSelectDoc(doc.id)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div className="doc-list-item-title">{doc.title}</div>
                  <div className="doc-list-item-meta">
                    {doc.is_owner && (
                      <span className="doc-list-item-badge owner">Owner</span>
                    )}
                    {doc.is_shared && !doc.is_owner && (
                      <span className="doc-list-item-badge">Shared</span>
                    )}
                    {doc.is_owner && doc.shared_with_users && doc.shared_with_users.length > 0 && (
                      <span className="doc-list-item-badge">
                        Shared with {doc.shared_with_users.length}
                      </span>
                    )}
                  </div>
                  <div className="text-muted" style={{ marginTop: "4px" }}>
                    {formatDate(doc.updated_at)}
                  </div>
                </div>
                {doc.is_owner && (
                  <button
                    className="btn btn-danger btn-small"
                    onClick={(e) => handleDelete(e, doc.id)}
                    style={{ marginLeft: "8px" }}
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="text-muted">💡 Supported: .txt, .md, .docx</div>
      </div>
    </div>
  );
}
