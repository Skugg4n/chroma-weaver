# chroma-weaver

Project mission: Maintain and extend a static web app that converts flat fill colors in SVGs from RGB to CMYK using a user-defined mapping. Stack: vanilla HTML/CSS/JS, no build step.

Rules:
– Keep code self-contained in index.html, style.css, script.js.
– Only support flattened fills (no gradients/patterns/CSS) for now.
– Add tests by shipping minimal sample SVGs in the repo.
– Create small, focused PRs with clear commit messages and acceptance notes.

## Usage

1. Drag & drop an SVG onto the drop zone or choose a file.
2. Each unique flat `fill` hex will appear in the table. Enter CMYK percentages for each.
3. Click **Convert & Download** to get an SVG with CMYK values added as `cmyk` attributes.
4. Use **Reset** to start over.

Example output:

```
<rect width="100" height="100" fill="#ff0000" cmyk="0,100,100,0"/>
```

Sample files:
- [samples/red-square.svg](samples/red-square.svg)
- [samples/two-fills.svg](samples/two-fills.svg)
