import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Typography from '@tiptap/extension-typography';

export function getDefaultExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
        HTMLAttributes: {
          class: 'scroll-m-20 tracking-tight',
        },
      },
      paragraph: {
        HTMLAttributes: {
          class: 'leading-7 [&:not(:first-child)]:mt-6',
        },
      },
      blockquote: {
        HTMLAttributes: {
          class: 'mt-6 border-l-2 pl-6 italic border-primary',
        },
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
        },
      },
      bulletList: {
        HTMLAttributes: {
          class: 'my-6 ml-6 list-disc [&>li]:mt-2',
        },
      },
      orderedList: {
        HTMLAttributes: {
          class: 'my-6 ml-6 list-decimal [&>li]:mt-2',
        },
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'font-medium text-primary underline underline-offset-4 hover:text-primary/80',
      },
    }),
    Placeholder.configure({
      placeholder: 'Mulai menulis konten blog Anda di sini... Gunakan H2 untuk section heading dan H3 untuk sub-section.',
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: 'rounded-lg border max-w-full h-auto my-6 mx-auto block',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: 'left',
    }),
    TextStyle,
    Color.configure({
      types: ['textStyle'],
    }),
    FontFamily.configure({
      types: ['textStyle'],
    }),
    Typography,
  ];
}
