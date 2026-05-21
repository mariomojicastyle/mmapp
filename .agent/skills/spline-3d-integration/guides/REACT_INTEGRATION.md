# React & Next.js Integration Guide

## Installation

```bash
npm install @splinetool/react-spline @splinetool/runtime
```

---

## Basic React Usage

```tsx
import Spline from "@splinetool/react-spline";

export default function HeroSection() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Spline scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode" />
    </div>
  );
}
```

> [!IMPORTANT]
> The parent container MUST have an explicit height. Spline renders into its parent bounds — without a height, the canvas will be 0px tall and invisible.

---

## Next.js — Lazy Loading (Recommended)

Spline is ~300 KB. Always lazy-load to avoid impacting initial page performance.

```tsx
// components/SplineScene.tsx
"use client"; // Required in Next.js App Router

import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,          // Spline is browser-only (WebGL)
  loading: () => <div className="spline-loader">Loading 3D scene…</div>,
});

export default function SplineScene() {
  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Spline scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode" />
    </div>
  );
}
```

---

## Runtime API in React (onLoad callback)

Use `onLoad` to get the `spline` application instance for programmatic control.

```tsx
import Spline from "@splinetool/react-spline";
import { Application } from "@splinetool/runtime";
import { useRef } from "react";

export default function InteractiveScene() {
  const splineRef = useRef<Application | null>(null);

  function onLoad(spline: Application) {
    splineRef.current = spline;
  }

  function triggerAnimation() {
    if (!splineRef.current) return;
    const obj = splineRef.current.findObjectByName("Button");
    splineRef.current.emitEvent("mouseDown", obj);
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Spline
        scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode"
        onLoad={onLoad}
      />
      <button onClick={triggerAnimation}>Trigger Animation</button>
    </div>
  );
}
```

---

## Variables (reading and writing scene state)

```tsx
function onLoad(spline: Application) {
  // Read a variable defined in the Spline editor
  const score = spline.getVariable("score");
  console.log("Current score:", score);

  // Write a variable to update scene state
  spline.setVariable("score", 42);
  spline.setVariable("color", "#00f2fe");
}
```

---

## Listening to Spline Events

```tsx
function onLoad(spline: Application) {
  spline.addEventListener("mouseDown", (e) => {
    console.log("Clicked object:", e.target.name);
    // Always sanitize e.target.name before rendering to DOM
  });

  spline.addEventListener("mouseHover", (e) => {
    console.log("Hovered:", e.target.name);
  });
}
```

---

## Scroll-driven 3D (camera / variable updates on scroll)

```tsx
"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Application } from "@splinetool/runtime";

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false });

export default function ScrollScene() {
  const splineRef = useRef<Application | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!splineRef.current) return;
      const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      splineRef.current.setVariable("scrollProgress", progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", position: "sticky", top: 0 }}>
      <Spline
        scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode"
        onLoad={(spline) => { splineRef.current = spline; }}
      />
    </div>
  );
}
```

---

## TypeScript types

```ts
import type { Application, SPEObject } from "@splinetool/runtime";
```

---

## Cleanup on unmount

When using the runtime directly (not the React component), always dispose:

```ts
useEffect(() => {
  const app = new Application(canvasRef.current!);
  app.load("...").then(() => { /* ready */ });
  return () => {
    app.dispose(); // Prevents WebGL context leak
  };
}, []);
```

---

## Performance checklist

- [ ] Lazy-load with `next/dynamic` + `ssr: false`
- [ ] Parent container has explicit `height`
- [ ] Only one heavy Spline scene per page
- [ ] Suspend with a loading fallback skeleton
- [ ] Call `app.dispose()` on unmount
- [ ] Scene polygon count < 200k for mobile
- [ ] Use `.splinecode` (compressed), not `.spline`
