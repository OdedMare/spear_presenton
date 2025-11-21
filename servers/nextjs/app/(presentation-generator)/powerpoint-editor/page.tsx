"use client";

import React from "react";
import { EditorLayout } from "./components/EditorLayout";
import { EditorProvider } from "./context/EditorContext";
import "./styles/powerpoint.css";

const PowerPointEditorPage = () => {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
};

export default PowerPointEditorPage;
