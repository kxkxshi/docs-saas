import React, { useState, useEffect } from "react";
import {
  listUsers,
  setCurrentUser,
  listDocuments,
  createDocument,
  uploadFile,
  type User,
  type DocumentListItem,
} from "./api";
import { Sidebar } from "./Sidebar";
import { Editor } from "./Editor";
import { styles } from "./styles";
import { LogOut } from "lucide-react";

function App() {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [focusTitleDocId, setFocusTitleDocId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      const userId = parseInt(storedUserId);
      const user = users.find((u) => u.id === userId);
      if (user) {
        setCurrentUserState(user);
        setCurrentUser(user.id);
        loadDocuments();
      }
    } else {
      setLoading(false);
    }
  }, [users]);

  useEffect(() => {
    // Always load users for the user selector
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await listUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const loadDocuments = async (preferredDocId?: number) => {
    try {
      setError(null);
      const docs = await listDocuments();
      setDocuments(docs);
      if (preferredDocId && docs.some((doc) => doc.id === preferredDocId)) {
        setSelectedDocId(preferredDocId);
      } else if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load documents. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const nextUntitledTitle = () => {
    const existingNumbers = documents
      .map((doc) => {
        const match = doc.title.match(/^Untitled Document(?: (\d+))?$/);
        if (!match) return null;
        return match[1] ? parseInt(match[1], 10) : 1;
      })
      .filter((value): value is number => value !== null);

    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `Untitled Document ${nextNumber}`;
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      const userId = parseInt(storedUserId);
      const user = users.find((u) => u.id === userId);
      if (user) {
        setCurrentUserState(user);
        setCurrentUser(userId);  // Set API header
        loadDocuments();
      }
    } else {
      setLoading(false);
    }
  }, [users]);

  const handleUserSelect = (userId: number) => {
    localStorage.setItem("userId", String(userId));
    const selectedUser = users.find((u) => u.id === userId);
    if (selectedUser) {
      setCurrentUserState(selectedUser);
      setCurrentUser(userId);  // Set API header
      setSelectedDocId(null);
      loadDocuments();
    }
  };

  const handleCreateNew = async () => {
    try {
      setError(null);
      const doc = await createDocument(nextUntitledTitle(), "");
      setFocusTitleDocId(doc.id);
      await loadDocuments(doc.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document");
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadError(null);
      const doc = await uploadFile(file);
      setFocusTitleDocId(null);
      await loadDocuments(doc.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload file";
      setUploadError(message);
      setTimeout(() => setUploadError(null), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    setCurrentUserState(null);
    setDocuments([]);
    setSelectedDocId(null);
  };

  if (!currentUser) {
    return (
      <>
        <style>{styles}</style>
        <div className="welcome-container">
          <h1>📄 Docs App</h1>
          <p>A simple collaborative document editor</p>
          <div
            style={{
              backgroundColor: "#fafafa",
              padding: "32px",
              borderRadius: "8px",
              maxWidth: "400px",
            }}
          >
            <p style={{ marginBottom: "16px", color: "#666" }}>
              Select a demo user to get started:
            </p>
            {loading ? (
              <div className="loading">Loading users...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {users.map((user) => (
                  <button
                    key={user.id}
                    className="btn btn-primary btn-block"
                    onClick={() => handleUserSelect(user.id)}
                    style={{
                      padding: "12px 16px",
                      fontSize: "16px",
                    }}
                  >
                    {user.username} ({user.email})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <Sidebar
          documents={documents}
          selectedDocId={selectedDocId}
          onSelectDoc={setSelectedDocId}
          onCreateNew={handleCreateNew}
          onFileUpload={handleFileUpload}
          loading={loading}
          error={uploadError || error}
        />

        {selectedDocId ? (
          <div className="main-shell">
            <div className="user-bar">
              <div className="user-bar-copy">
                Logged in as <strong>{currentUser.username}</strong>
              </div>
              <button
                className="btn btn-secondary btn-small"
                onClick={handleLogout}
              >
                <LogOut size={14} style={{ marginRight: "4px", display: "inline" }} />
                Logout
              </button>
            </div>
            <Editor
              key={selectedDocId}
              docId={selectedDocId}
              focusTitleOnOpen={focusTitleDocId === selectedDocId}
            />
          </div>
        ) : (
          <div className="main-content">
            <div className="welcome-container">
              <h1>Welcome to Docs App</h1>
              <div className="empty-state-card">
                No documents yet. Create one to get started.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
