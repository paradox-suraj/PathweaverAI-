"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Wand2, 
  Loader2 
} from 'lucide-react';
import { useState, useTransition } from 'react';
import { regenerateTextAction } from '@/server/actions/course';

type WysiwygEditorProps = {
  initialContent: string;
  onChange: (markdown: string) => void;
};

export function WysiwygEditor({ initialContent, onChange }: WysiwygEditorProps) {
  const [isRegenerating, startRegenerating] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // The tiptap-markdown extension adds getMarkdown()
      const markdown = (editor.storage as any).markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-primary max-w-none w-full break-words min-h-[400px] outline-none' +
               ' prose-headings:font-display-md prose-headings:font-bold prose-headings:text-text-primary' +
               ' prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl' +
               ' prose-p:font-body-base prose-p:text-text-secondary prose-p:leading-relaxed' +
               ' prose-strong:text-primary-container' +
               ' prose-ul:list-disc prose-ul:ml-6 prose-ol:list-decimal prose-ol:ml-6' +
               ' prose-li:text-text-secondary prose-li:mb-1' +
               ' prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-primary-container prose-code:before:content-none prose-code:after:content-none' +
               ' prose-pre:bg-surface-2 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:max-w-full',
      },
    },
  });

  const handleAIRewrite = () => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    
    if (!selectedText || selectedText.trim() === "") return;

    // Grab a larger context window (up to 1000 characters around the selection)
    const contextStart = Math.max(0, from - 500);
    const contextEnd = Math.min(editor.state.doc.content.size, to + 500);
    const context = editor.state.doc.textBetween(contextStart, contextEnd, " ");

    setAiError(null);
    startRegenerating(async () => {
      const result = await regenerateTextAction(selectedText, context);
      
      if (result.success && result.newText) {
        editor.chain().focus().deleteSelection().insertContent(result.newText).run();
      } else {
        setAiError(result.error || "Failed to rewrite text.");
        setTimeout(() => setAiError(null), 3000);
      }
    });
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full flex flex-col border border-white/10 rounded-xl overflow-hidden bg-surface-1/50">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-surface-2/50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive('bold') ? 'bg-white/10 text-primary' : 'text-text-secondary'}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive('italic') ? 'bg-white/10 text-primary' : 'text-text-secondary'}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive('code') ? 'bg-white/10 text-primary' : 'text-text-secondary'}`}
          title="Code"
        >
          <Code className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-white/10 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-white/10 text-primary' : 'text-text-secondary'}`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-white/10 text-primary' : 'text-text-secondary'}`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive('bulletList') ? 'bg-white/10 text-primary' : 'text-text-secondary'}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-white/10 transition-colors ${editor.isActive('orderedList') ? 'bg-white/10 text-primary' : 'text-text-secondary'}`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Bubble Menu (appears on selection) */}
      <BubbleMenu 
        editor={editor} 
        className="flex items-center gap-1 bg-surface-2 border border-white/10 shadow-lg rounded-lg p-1.5 overflow-hidden"
      >
        <button
          onClick={handleAIRewrite}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors text-primary font-label-sm disabled:opacity-50"
        >
          {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          AI Rewrite
        </button>
        {aiError && (
          <span className="text-red-400 text-xs px-2 whitespace-nowrap">{aiError}</span>
        )}
      </BubbleMenu>

      {/* Editor Content Area */}
      <div className="p-4 md:p-6 w-full max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
