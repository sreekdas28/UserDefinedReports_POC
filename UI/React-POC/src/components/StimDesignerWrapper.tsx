import React, { useEffect, useRef } from "react";

interface StimDesignerWrapperProps {
  designerUrl: string;
}

const StimDesignerWrapper = ({ designerUrl }: StimDesignerWrapperProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("React Props:", designerUrl);

    const stimViewer = document.createElement("stim-designer-wrapper");

    // ✅ Use kebab-case
    stimViewer.setAttribute("designerUrl", designerUrl);

    if (wrapperRef.current) {
      wrapperRef.current.appendChild(stimViewer);
    }

    return () => {
      if (wrapperRef.current) {
        wrapperRef.current.removeChild(stimViewer);
      }
    };
  }, [designerUrl]);

  return <div ref={wrapperRef}></div>;
};

export default StimDesignerWrapper;
