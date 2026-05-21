# Vanilla JS / HTML Integration Guide

## Option A — iframe (simplest, no JS needed)

Use when you only need to display the scene with no programmatic control.

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; }
      iframe { width: 100vw; height: 100vh; border: none; display: block; }
    </style>
  </head>
  <body>
    <iframe
      src="https://my.spline.design/YOUR_EMBED_URL/"
      frameborder="0"
      allowfullscreen
    ></iframe>
  </body>
</html>
```

---

## Option B — @splinetool/runtime via CDN (no build step)

Use when you need events, variables, or object control without a bundler.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Spline Scene</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      canvas { display: block; width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <canvas id="canvas3d"></canvas>

    <script type="module">
      import { Application } from "https://unpkg.com/@splinetool/runtime/build/runtime.js";

      const canvas = document.getElementById("canvas3d");
      const app = new Application(canvas);

      await app.load("https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode");

      console.log("Scene loaded!");
    </script>
  </body>
</html>
```

---

## Option C — npm package (with a bundler like Vite or Webpack)

```bash
npm install @splinetool/runtime
```

```js
// main.js
import { Application } from "@splinetool/runtime";

const canvas = document.getElementById("canvas3d");
const app = new Application(canvas);

await app.load("https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode");
```

---

## Runtime API — Full Reference

### Load a scene

```js
const app = new Application(canvas);
await app.load("https://prod.spline.design/YOUR_ID/scene.splinecode");
```

### Find objects

```js
// By exact name (case-sensitive, matches name in Spline editor)
const box = app.findObjectByName("Box");

// By UUID
const obj = app.findObjectById("uuid-string");

// All objects
const all = app.getAllObjects();
```

### Trigger events

```js
// Trigger a Spline interaction event on an object
app.emitEvent("mouseDown", box);
app.emitEvent("mouseUp", box);
app.emitEvent("mouseHover", box);
```

### Variables

```js
// Read a variable set in Spline editor
const val = app.getVariable("myVariable");

// Write a variable to control scene state
app.setVariable("myVariable", "new value");
app.setVariable("opacity", 0.5);
app.setVariable("visible", true);
```

### Listen to events

```js
app.addEventListener("mouseDown", (event) => {
  // IMPORTANT: sanitize event.target.name before rendering to DOM
  const name = event.target.name;
  console.log("Clicked:", name);
});

app.removeEventListener("mouseDown", handler);
```

### Camera

```js
app.setCamera({
  position: { x: 0, y: 5, z: 10 },
  target:   { x: 0, y: 0, z: 0 },
});
```

### Cleanup

```js
// Always call when removing the canvas (prevents GPU/memory leaks)
app.dispose();
```

---

## Loading state pattern

```html
<div id="loader" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;">
  Loading 3D...
</div>
<canvas id="canvas3d" style="display:none;width:100vw;height:100vh;"></canvas>

<script type="module">
  import { Application } from "https://unpkg.com/@splinetool/runtime/build/runtime.js";

  const canvas = document.getElementById("canvas3d");
  const loader = document.getElementById("loader");
  const app = new Application(canvas);

  await app.load("https://prod.spline.design/YOUR_ID/scene.splinecode");

  loader.style.display = "none";
  canvas.style.display = "block";
</script>
```

---

## WebGL capability detection

```js
function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

if (supportsWebGL()) {
  // load Spline
} else {
  // show fallback image or video
  document.getElementById("fallback").style.display = "block";
}
```

---

## Performance checklist

- [ ] Canvas has explicit width/height in CSS (use `100vw`/`100vh` or fixed px)
- [ ] Show a loading overlay until `app.load()` resolves
- [ ] Call `app.dispose()` when navigating away / hiding the canvas
- [ ] Use `.splinecode` URL (not `.spline`) for smaller file size
- [ ] Test on a mid-range mobile device before shipping
- [ ] Keep scene polygon count < 200k for broad device support
