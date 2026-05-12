import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import FontFamily from "@tiptap/extension-font-family";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";

const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              (element as HTMLElement).style.fontSize?.replace(/['"]/g, "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).run();
        },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  readOnly = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      FontSize,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      if (!readOnly) {
        onChange(editor.getHTML());
      }
    },
    editable: !readOnly,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return <div className="loading">Loading editor...</div>;
  }

  return (
    <div>
      {!readOnly && (
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <span className="toolbar-label">Font</span>
            <select
              className="toolbar-select"
              defaultValue="system"
              onChange={(event) => {
                const value = event.target.value;
                editor.chain().focus().setFontFamily(value === "system" ? "" : value).run();
              }}
            >
              <option value="system">System</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          <div className="toolbar-group">
            <span className="toolbar-label">Size</span>
            <select
              className="toolbar-select"
              defaultValue="16px"
              onChange={(event) => {
                const value = event.target.value;
                if (value === "default") {
                  editor.chain().focus().unsetFontSize().run();
                } else {
                  editor.chain().focus().setFontSize(value).run();
                }
              }}
            >
              <option value="default">Default</option>
              <option value="12px">12</option>
              <option value="14px">14</option>
              <option value="16px">16</option>
              <option value="18px">18</option>
              <option value="22px">22</option>
              <option value="28px">28</option>
            </select>
          </div>

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`toolbar-btn ${editor.isActive("bold") ? "active" : ""}`}
              title="Bold"
            >
              <Bold size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`toolbar-btn ${editor.isActive("italic") ? "active" : ""}`}
              title="Italic"
            >
              <Italic size={18} />
            </button>
          </div>

          <div className="toolbar-group">
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={`toolbar-btn ${
                editor.isActive("heading", { level: 1 }) ? "active" : ""
              }`}
              title="Heading 1"
            >
              <Heading1 size={18} />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`toolbar-btn ${
                editor.isActive("heading", { level: 2 }) ? "active" : ""
              }`}
              title="Heading 2"
            >
              <Heading2 size={18} />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={`toolbar-btn ${
                editor.isActive("heading", { level: 3 }) ? "active" : ""
              }`}
              title="Heading 3"
            >
              <Heading3 size={18} />
            </button>
          </div>

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`toolbar-btn ${
                editor.isActive("bulletList") ? "active" : ""
              }`}
              title="Bullet List"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`toolbar-btn ${
                editor.isActive("orderedList") ? "active" : ""
              }`}
              title="Ordered List"
            >
              <ListOrdered size={18} />
            </button>
          </div>

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={`toolbar-btn ${
                editor.isActive({ textAlign: "left" }) ? "active" : ""
              }`}
              title="Align Left"
            >
              <AlignLeft size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={`toolbar-btn ${
                editor.isActive({ textAlign: "center" }) ? "active" : ""
              }`}
              title="Align Center"
            >
              <AlignCenter size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={`toolbar-btn ${
                editor.isActive({ textAlign: "right" }) ? "active" : ""
              }`}
              title="Align Right"
            >
              <AlignRight size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              className={`toolbar-btn ${
                editor.isActive({ textAlign: "justify" }) ? "active" : ""
              }`}
              title="Justify"
            >
              <AlignJustify size={18} />
            </button>
          </div>
        </div>
      )}
      <div className="editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
