import React from "react";
import { useEffect } from "react";
import { loadScript } from "../utils";
import StimDesignerWrapper from "./StimDesignerWrapper";

export default function Designer() {
  useEffect(() => {
    console.log("React App Loaded");

    const bootstrapAngular = async () => {
      await loadScript("/designer-main.js", "module");
      await loadScript("/designer-polyfills.js", "module");
      await loadScript("/designer-runtime.js", "module");
    };

    bootstrapAngular();
  }, []);

  return (
    <StimDesignerWrapper designerUrl="https://phoenix-api-dev.azurewebsites.net/api/designer/designer" />
  );
}
