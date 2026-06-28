import { useRef, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

interface VisualizerEditorProps {
  code: string;
  language: string;
  theme: 'vs-dark' | 'light';
  onChange: (value: string) => void;
  currentLine?: number | null;
  exceptionLine?: number | null;
  readOnly?: boolean;
}

export default function VisualizerEditor({ 
  code, 
  language, 
  theme, 
  onChange, 
  currentLine,
  exceptionLine,
  readOnly
}: VisualizerEditorProps) {
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const monaco = useMonaco();

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!editorRef.current || !monaco) return;

    const newDecorations: any[] = [];

    if (currentLine && currentLine > 0) {
      newDecorations.push({
        range: new monaco.Range(currentLine, 1, currentLine, 1),
        options: {
          isWholeLine: true,
          className: 'bg-emerald-500/20 dark:bg-emerald-500/30 border-l-4 border-emerald-500',
          glyphMarginClassName: 'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2310b981\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolygon points=\'5 3 19 12 5 21 5 3\'/%3E%3C/svg%3E")] bg-no-repeat bg-center bg-[length:14px_14px]'
        }
      });
      // Reveal the line in the center of the editor
      editorRef.current.revealLineInCenter(currentLine);
    }

    if (exceptionLine && exceptionLine > 0) {
       newDecorations.push({
        range: new monaco.Range(exceptionLine, 1, exceptionLine, 1),
        options: {
          isWholeLine: true,
          className: 'bg-red-500/20 dark:bg-red-500/30 border-l-4 border-red-500',
        }
      });
    }

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [currentLine, exceptionLine, monaco]);

  return (
    <Editor
      height="100%"
      language={language}
      theme={theme}
      value={code}
      onChange={(val) => onChange(val || '')}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        padding: { top: 16, bottom: 40 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        glyphMargin: true, // Enable glyph margin for the arrow
        readOnly: readOnly || (currentLine ? true : false), // Disable editing while stepping or viewing
      }}
    />
  );
}
