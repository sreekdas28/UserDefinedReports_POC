import React, { useEffect, useRef } from "react";
import { loadScript } from "../utils";

interface StimViewerWrapperProps {
  requestUrl: string;
  action: string;
  height?: string;
  properties?: Record<string, unknown>,
  onReady?: () => void;
  onExport?: (event: React.MouseEvent) => void;
}

const StimViewerWrapper = ({
  requestUrl,
  action,
  height='800',
  properties={},
  onReady,
  onExport,
}: StimViewerWrapperProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      console.log("React App Loaded");
  
      const bootstrapAngular = async () => {
        await loadScript("/viewer-main.js", "module");
        await loadScript("/viewer-polyfills.js", "module");
        await loadScript("/viewer-runtime.js", "module");
  
        // Wait for React to fully render the DOM
        setTimeout(() => {
          // console.log("Angular App Bootstrapping");
          window.dispatchEvent(new Event("stim-viewer-ready"));
        }, 0);
      };
  
      bootstrapAngular();
    }, []);

  useEffect(() => {
     
    console.log("React Props:", requestUrl, action, height);

    const stimViewer = document.createElement("stim-viewer-wrapper");
    

    // Use both forms to ensure compatibility
    // Data attributes are more reliable when passing from React to custom elements
    // stimViewer.setAttribute("requesturl", requestUrl);
    // stimViewer.setAttribute("data-requesturl", requestUrl);
    // stimViewer.setAttribute("action", action);
    // stimViewer.setAttribute("height", height);
    // stimViewer.setAttribute('properties', JSON.stringify(properties))
    (stimViewer as any).requestUrl = requestUrl;
    (stimViewer as any).action = action;
    (stimViewer as any).height = height;
    (stimViewer as any).properties = properties;

    stimViewer.setAttribute("data-requesturl", requestUrl);

    // Custom event handler for Angular's emitted event
    const handleStimViewerReady = () => {
      console.log("Stim Viewer Ready!");
      onReady();
    };

    stimViewer.addEventListener("stimViewerReady", handleStimViewerReady);

    if (onExport) {
      stimViewer.addEventListener("export", (event: Event) => {
        console.log("Export Event Triggered", event);
        if (event instanceof CustomEvent) {
          // Handle the event with the detail property
          onExport(event.detail as unknown as React.MouseEvent);
        } else {
          onExport(event as unknown as React.MouseEvent);
        }
      });
    }

    if (wrapperRef.current) {
      wrapperRef.current.appendChild(stimViewer);
    }

    return () => {
      stimViewer.removeEventListener("stimViewerReady", handleStimViewerReady);
      if (wrapperRef.current && wrapperRef.current.contains(stimViewer)) {
        wrapperRef.current.removeChild(stimViewer);
      }
    };
  }, [requestUrl, action, height, onReady, onExport]);

  return <div ref={wrapperRef}></div>;
};

export default StimViewerWrapper;
