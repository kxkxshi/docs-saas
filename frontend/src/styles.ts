import React from "react";

export const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
      'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f5f5f5;
    color: #333;
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
    background-color: #ffffff;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    background-color: #fafafa;
  }

  .sidebar-header h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .user-selector {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background-color: white;
    cursor: pointer;
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid #e0e0e0;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background-color: #4285f4;
    color: white;
  }

  .btn-primary:hover {
    background-color: #357ae8;
  }

  .btn-secondary {
    background-color: #f0f0f0;
    color: #333;
    border: 1px solid #ddd;
  }

  .btn-secondary:hover {
    background-color: #e8e8e8;
  }

  .btn-danger {
    background-color: #ea4335;
    color: white;
  }

  .btn-danger:hover {
    background-color: #d33425;
  }

  .btn-small {
    padding: 4px 8px;
    font-size: 12px;
  }

  .btn-block {
    width: 100%;
  }

  .doc-list-item {
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: white;
  }

  .doc-list-item:hover {
    background-color: #f9f9f9;
    border-color: #4285f4;
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
    background-color: #ffffff;
  }

  .main-shell {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background-color: #ffffff;
  }

  .user-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid #e0e0e0;
    background: #fafafa;
    flex-wrap: wrap;
  }

  .user-bar-copy {
    font-size: 14px;
    color: #666;
  }

  .editor-header {
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fafafa;
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
    padding: 0 10px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #4b5563;
    font-size: 13px;
    font-weight: 500;
  }

  .editor-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  /* Rich Text Editor Toolbar */
  .editor-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    flex-wrap: wrap;
  }

  .toolbar-group {
    display: flex;
    gap: 4px;
    padding-right: 8px;
    border-right: 1px solid #e0e0e0;
    align-items: center;
    flex-wrap: wrap;
  }

  .toolbar-group:last-child {
    border-right: none;
    padding-right: 0;
  }

  .toolbar-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid #ddd;
    background-color: white;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 16px;
  }

  .toolbar-btn:hover {
    background-color: #f0f0f0;
  }

  .toolbar-btn.active {
    background-color: #4285f4;
    color: white;
    border-color: #4285f4;
  }

  .toolbar-select {
    height: 32px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    padding: 0 10px;
    font-size: 13px;
    color: #333;
  }

  .toolbar-label {
    font-size: 12px;
    color: #666;
    margin-right: 4px;
    white-space: nowrap;
  }

  .editor {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 16px;
    line-height: 1.6;
    font-size: 16px;
    min-height: 300px;
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
    background-color: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
    background-color: #fafafa;
    padding: 32px;
    border-radius: 12px;
    max-width: 420px;
    border: 1px solid #ececec;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
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
