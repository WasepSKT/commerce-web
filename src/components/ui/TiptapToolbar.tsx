import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Link2Off,
  Image,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Type
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TiptapToolbarProps {
  editor: Editor | null;
  onInsertImage?: () => void;
  className?: string;
}

const ToolbarButton = ({
  onClick,
  isActive = false,
  children,
  title,
  disabled = false
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "h-8 px-2 hover:bg-primary/10 hover:text-primary transition-colors",
      isActive && "bg-primary/15 text-primary font-medium"
    )}
  >
    {children}
  </Button>
);

const ToolbarGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center">
    {children}
  </div>
);

export default function TiptapToolbar({ editor, onInsertImage, className }: TiptapToolbarProps) {
  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan URL:', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const setHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (editor.isActive('heading', { level })) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const setFontFamily = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  const colors = [
    '#7A1316', '#000000', '#374151', '#6B7280',
    '#EF4444', '#F97316', '#EAB308', '#22C55E',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'
  ];

  const fonts = [
    'Fredoka One', 'Roboto', 'Inter', 'Arial',
    'Georgia', 'Times New Roman', 'Courier New', 'Verdana'
  ];

  return (
    <div className={cn(
      "flex items-center gap-1 p-2 border-b bg-background/95 backdrop-blur-sm",
      "overflow-x-auto scrollbar-thin scrollbar-thumb-border",
      className
    )}>
      {/* Text Formatting */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => setHeading(1)}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1 - Title"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setHeading(2)}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2 - Section"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setHeading(3)}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3 - Sub-section"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists & Blocks */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Links & Media */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="Add Link"
        >
          <Link className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          title="Remove Link"
        >
          <Link2Off className="h-4 w-4" />
        </ToolbarButton>

        {onInsertImage && (
          <ToolbarButton
            onClick={onInsertImage}
            title="Insert Image"
          >
            <Image className="h-4 w-4" />
          </ToolbarButton>
        )}
      </ToolbarGroup>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* History */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Alignment */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }))}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Color */}
      <ToolbarGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 hover:bg-primary/10 hover:text-primary transition-colors"
              title="Text Color"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 p-2">
            <div className="grid grid-cols-4 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setColor(color)}
                  className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="mt-2 text-sm"
            >
              Reset Color
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font Family */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 hover:bg-primary/10 hover:text-primary transition-colors"
              title="Font Family"
            >
              <Type className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            {fonts.map((font) => (
              <DropdownMenuItem
                key={font}
                onClick={() => setFontFamily(font)}
                className={cn(
                  "cursor-pointer",
                  editor.isActive('textStyle', { fontFamily: font }) && "bg-primary/10"
                )}
                style={{ fontFamily: font }}
              >
                {font}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => editor.chain().focus().unsetFontFamily().run()}
              className="mt-1 border-t"
            >
              Reset Font
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarGroup>


    </div>
  );
}