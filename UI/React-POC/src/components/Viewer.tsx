import { useEffect } from "react";
import StimViewerWrapper from "./StimViewerWrapper";
import React from "react";
import { loadScript } from "../utils";

export default function Viewer() {
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

  return (
    <StimViewerWrapper
      requestUrl="https://phoenix-api-dev.azurewebsites.net/api/viewer/{action}"
      action="InitViewer"
      height="600px"
      onReady={() => console.log("Viewer is ready")}
      onExport={(event) => console.log("Export event triggered", event)}
    />
  );
}
