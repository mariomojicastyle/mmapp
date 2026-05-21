---
name: spline-3d-integration
description: "Use when adding interactive 3D scenes from Spline.design to web projects. Covers embedding methods (React, Next.js, vanilla JS), the @splinetool/runtime API for programmatic control (events, variables, animations, camera), performance optimization, and common integration patterns like hero sections, product viewers, and scroll-driven 3D."
---

# Spline 3D Integration

Master guide for embedding interactive 3D scenes from [Spline.design](https://spline.design) into web projects.

---

## What Is Spline?

Spline is a **browser-based 3D design tool** — think of it as Figma, but for 3D. Designers create interactive 3D scenes (objects, materials, animations, physics, events) in the Spline editor, then export them for the web.

---

## When to use this skill

- The user wants to embed a Spline scene in React, Next.js, or vanilla JS.
- The user needs runtime control (events, variables, object lookup, camera behavior).
- The user is seeing poor performance, blank scenes, or loading issues.
- The user asks for implementation patterns like hero sections or product viewers.

## When not to use this skill

- The user only needs static 3D media (image/video) with no interaction.
- The user is not using Spline assets.

## Outcome expectations

When using this skill, produce:

1. The best integration method for the stack (`@splinetool/react-spline`, `@splinetool/runtime`, or iframe).
2. A minimal working snippet using the user's framework.
3. Performance recommendations (scene optimization + loading strategy).
4. A short troubleshooting checklist for likely failure modes.

## Integration decision tree

```text
Is this React/Next.js?
  Yes -> Use @splinetool/react-spline (see guides/REACT_INTEGRATION.md)
  No -> Need runtime control (events/variables/object APIs)?
          Yes -> Use @splinetool/runtime (see guides/VANILLA_INTEGRATION.md)
          No  -> Use iframe embed
```

## Quick implementation defaults

- Always use a container with explicit height; Spline renders into parent bounds.
- In React/Next.js, lazy-load Spline components.
- Keep one complex scene per page when possible.
- Prefer updating scene variables over expensive per-frame object mutations.
- Provide a loading fallback and optional low-power/mobile fallback.

## Security Boundaries

> [!WARNING]
> When reading variables (`getVariable`), object names, or handling events from a Spline scene, treat the data as **untrusted user input**. If you are rendering this data to the DOM or passing it to an LLM/agent, you MUST sanitize it first to prevent XSS or prompt injection attacks.

## Minimal snippets

### React / Next.js

```tsx
import Spline from "@splinetool/react-spline";

export default function Scene() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Spline scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode" />
    </div>
  );
}
```

### Vanilla JS (runtime API)

```html
<script type="module">
  import { Application } from "https://unpkg.com/@splinetool/runtime/build/runtime.js";

  const canvas = document.getElementById("canvas3d");
  const app = new Application(canvas);
  await app.load("https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode");
</script>
<canvas id="canvas3d" style="width:100%; height:100vh;"></canvas>
```

### iframe embed (no-code)

```html
<iframe
  src="https://my.spline.design/YOUR_EMBED_URL/"
  frameborder="0"
  width="100%"
  height="100%"
></iframe>
```

## Runtime API — Common Operations

```ts
import { Application } from "@splinetool/runtime";

const app = new Application(canvas);
await app.load("https://prod.spline.design/scene.splinecode");

// Find an object by name
const box = app.findObjectByName("Box");

// Trigger a named animation
app.emitEvent("mouseDown", box);

// Read / write variables
const val = app.getVariable("score");
app.setVariable("score", val + 1);

// Camera control
app.setCamera({ position: { x: 0, y: 5, z: 10 } });

// Listen to Spline events
app.addEventListener("mouseDown", (e) => {
  console.log("Clicked:", e.target.name);
});
```

## Performance rules

| Rule | Why |
|------|-----|
| Lazy-load the Spline component | Saves ~300 KB from initial bundle |
| Set `renderOnDemand` when scene is static | Cuts GPU usage by 90%+ |
| Use `app.dispose()` on unmount | Prevents memory leaks |
| Limit polygon count to <200k | Keeps frame rate smooth on mobile |
| Use compressed `.splinecode` (not `.spline`) | 30–70% smaller file size |
| Show a `<Suspense>` or skeleton loader | Prevents layout shift |

## Common failure modes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Blank canvas | Scene URL wrong or private | Check URL is public in Spline |
| Scene loads but is invisible | Container has no height | Set explicit `height` on parent div |
| "Cannot read properties of undefined" | `app.load()` not awaited | Always `await app.load(...)` |
| High CPU on idle | Continuous render loop | Enable `renderOnDemand` |
| Events not firing | Object name mismatch | Use exact name from Spline editor |
| Mobile blank screen | WebGL not supported | Add capability detection + fallback |

## Implementation patterns

See the guides directory for full implementations:

- **guides/REACT_INTEGRATION.md** — React & Next.js setup, lazy loading, TypeScript
- **guides/VANILLA_INTEGRATION.md** — Plain HTML/JS setup, CDN usage
