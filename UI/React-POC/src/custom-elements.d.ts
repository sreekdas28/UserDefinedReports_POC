// src/custom-elements.d.ts

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Declare 'stimulsoft-viewer-wrapper' as a valid JSX element
      // and define the accepted props (e.g., 'url' of type string)
      "stimulsoft-viewer-wrapper": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { url: string },
        HTMLElement
      >;
    }
  }
}

// This ensures the declaration is globally available to all TypeScript files
