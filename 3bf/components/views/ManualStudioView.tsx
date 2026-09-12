"use client";

import React from "react";
import Viewer3D from "@/components/viewer/Viewer3D";

export default function ManualStudioView() {
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col">
      <Viewer3D />
    </div>
  );
}
