import React from "react";

export const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    --bg: #f5f7fb;
    --muted: #666f7a;
    --primary: #3b82f6;
    --card: #ffffff;
    --sidebar-bg: #f3f6fb;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
      'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--bg);
    color: #1f2937;
  }

  #root {
    min-height: 100vh;
  }

  /* Layout */
  .app-container {
    display: flex;
    height: 100vh;
  }

  .sidebar {
    width: 300px;
    background-color: var(--sidebar-bg);
    border-right: 1px solid rgba(15,23,42,0.06);
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  }

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid rgba(15,23,42,0.04);
    background-color: transparent;
  }

  .sidebar-header h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .user-selector {
    padding: 8px 12px;
    border: 1px solid rgba(15,23,42,0.06);
    border-radius: 8px;
    font-size: 14px;
    background-color: var(--card);
    cursor: pointer;
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 18px;
  }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid #e0e0e0;
  }

  .btn {
    padding: 8px 14px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease;
  }

  .btn-primary {
    background-color: var(--primary);
    color: white;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(59,130,246,0.12);
  }

  .btn-secondary {
    background-color: transparent;
    color: #1f2937;
    border: 1px solid rgba(15,23,42,0.06);
  }

  .btn-secondary:hover {
    background-color: #e8e8e8;
  }

  .btn-danger {
    background-color: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(239,68,68,0.12);
  }

  .btn-small {
    padding: 6px 10px;
    font-size: 13px;
  }

  .btn-block {
    width: 100%;
  }

  .doc-list-item {
    padding: 14px;
    margin-bottom: 10px;
    border: 1px solid rgba(15,23,42,0.04);
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.14s ease, box-shadow 0.14s ease, background-color 0.14s ease;
    background-color: var(--card);
    box-shadow: 0 6px 18px rgba(15,23,42,0.03);
  }

  .doc-list-item:hover {
    background-color: #ffffff;
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(15,23,42,0.06);
    border-color: rgba(59,130,246,0.18);
  }

  .doc-list-item.active {
    background-color: #e8f0fe;
    border-color: #4285f4;
  }

  .doc-list-item-title {
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 4px;
    word-break: break-word;
  }

  .doc-list-item-meta {
    font-size: 12px;
    color: #999;
  }

  .doc-list-item-badge {
    display: inline-block;
    padding: 2px 6px;
    margin-right: 4px;
    background-color: #fce8e6;
    color: #c5221f;
    border-radius: 2px;
    font-size: 11px;
    font-weight: 500;
  }

  .doc-list-item-badge.owner {
    background-color: #e8f5e9;
    color: #1b5e20;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: transparent;
  }

  .main-shell {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background-color: transparent;
  }

  .user-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(15,23,42,0.04);
    background: transparent;
    flex-wrap: wrap;
  }

  .user-bar-copy {
    font-size: 14px;
    color: #666;
  }

  .editor-header {
    padding: 18px;
    border-bottom: 1px solid rgba(15,23,42,0.04);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: transparent;
    flex-wrap: wrap;
    gap: 10px;
  }

  .editor-title {
    font-size: 24px;
    font-weight: 600;
    flex: 1;
  }

  .editor-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .save-status {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    background: #f3f4f6;
    color: var(--muted);
    font-size: 13px;
    font-weight: 500;
  }

  .editor-container {
    flex: 1;
    overflow-y: auto;
    padding: 22px;
  }

  /* Rich Text Editor Toolbar */
  .editor-toolbar {
    display: flex;
    gap: 6px;
    margin-bottom: 14px;
    padding: 8px;
    background-color: rgba(255,255,255,0.6);
    border: 1px solid rgba(15,23,42,0.04);
    border-radius: 10px;
    flex-wrap: wrap;
  }

  .toolbar-group {
    display: flex;
    gap: 6px;
    padding-right: 8px;
    border-right: 1px solid rgba(15,23,42,0.04);
    align-items: center;
    flex-wrap: wrap;
  }

  .toolbar-group:last-child {
    border-right: none;
    padding-right: 0;
  }

  .toolbar-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid rgba(15,23,42,0.06);
    background-color: white;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease;
    font-size: 15px;
  }

  .toolbar-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(15,23,42,0.06);
  }

  .toolbar-btn.active {
    background-color: var(--primary);
    color: white;
    border-color: rgba(59,130,246,0.9);
  }

  .toolbar-select {
    height: 36px;
    border: 1px solid rgba(15,23,42,0.06);
    border-radius: 8px;
    background: white;
    padding: 0 10px;
    font-size: 13px;
    color: #111827;
  }

  .toolbar-label {
    font-size: 12px;
    color: #666;
    margin-right: 4px;
    white-space: nowrap;
  }

  .editor {
    border: 1px solid rgba(15,23,42,0.04);
    border-radius: 10px;
    padding: 18px;
    line-height: 1.7;
    font-size: 16px;
    min-height: 300px;
    background: var(--card);
  }

  .editor focus {
    outline: none;
    border-color: #4285f4;
  }

  .ProseMirror {
    outline: none;
    min-height: 300px;
  }

  .ProseMirror > * + * {
    margin-top: 0.75em;
  }

  .ProseMirror h1,
  .ProseMirror h2,
  .ProseMirror h3,
  .ProseMirror h4,
  .ProseMirror h5,
  .ProseMirror h6 {
    line-height: 1.1;
    margin-top: 0.25em;
    font-weight: 700;
  }

  .ProseMirror h1 {
    font-size: 2em;
  }

  .ProseMirror h2 {
    font-size: 1.5em;
  }

  .ProseMirror h3 {
    font-size: 1.25em;
  }

  .ProseMirror ul,
  .ProseMirror ol {
    padding-left: 1.5rem;
  }

  .ProseMirror strong {
    font-weight: 700;
  }

  .ProseMirror em {
    font-style: italic;
  }

  .ProseMirror u {
    text-decoration: underline;
  }

  .ProseMirror [style*="text-align: left"] {
    text-align: left;
  }

  .ProseMirror [style*="text-align: center"] {
    text-align: center;
  }

  .ProseMirror [style*="text-align: right"] {
    text-align: right;
  }

  .ProseMirror [style*="text-align: justify"] {
    text-align: justify;
  }

  /* Sharing Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background-color: var(--card);
    border-radius: 12px;
    padding: 24px;
    max-width: 520px;
    width: 92%;
    box-shadow: 0 12px 40px rgba(15,23,42,0.12);
  }

  .modal h3 {
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 600;
  }

  .modal-content {
    margin-bottom: 20px;
  }

  .share-list {
    margin-bottom: 16px;
  }

  .share-item {
    padding: 12px;
    background-color: #f9f9f9;
    border-radius: 4px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .share-item-name {
    font-weight: 500;
  }

  .modal-footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .input-group {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .input-group select,
  .input-group input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .input-group select {
    flex: 1;
  }

  /* Welcome Screen */
  .welcome-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
  }

  .welcome-container h1 {
    font-size: 32px;
    margin-bottom: 16px;
    color: #333;
  }

  .welcome-container p {
    font-size: 16px;
    color: #666;
    margin-bottom: 24px;
  }

  .welcome-container .empty-state-card {
    background-color: var(--card);
    padding: 32px;
    border-radius: 12px;
    max-width: 420px;
    border: 1px solid rgba(15,23,42,0.04);
    box-shadow: 0 20px 50px rgba(15,23,42,0.06);
  }

  .input-rename {
    font-size: 18px;
    font-weight: 500;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px 12px;
    width: 100%;
    max-width: 300px;
  }

  .text-muted {
    color: #999;
    font-size: 12px;
  }

  .error-message {
    color: #ea4335;
    padding: 12px;
    background-color: #fce8e6;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .success-message {
    color: #1b5e20;
    padding: 12px;
    background-color: #e8f5e9;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #999;
  }

  .file-upload-area {
    border: 2px dashed #ddd;
    border-radius: 8px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background-color: #fafafa;
  }

  .file-upload-area:hover {
    border-color: #4285f4;
    background-color: #f0f7ff;
  }

  .file-upload-area.dragover {
    border-color: #4285f4;
    background-color: #e8f0fe;
  }

  .file-input {
    display: none;
  }

  .text-center {
    text-align: center;
  }

  .gap-1 {
    gap: 8px;
  }

  .gap-2 {
    gap: 16px;
  }

  @media (max-width: 768px) {
    .app-container {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #e0e0e0;
    }

    .main-content {
      width: 100%;
    }

    .editor-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .editor-toolbar {
      width: 100%;
    }
  }
`;
