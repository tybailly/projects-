# renderer

A software 3D renderer written from scratch in Rust — no graphics API
(OpenGL/Vulkan/wgpu) and no image/math crates. Everything is hand-rolled:

- `src/math.rs` — `Vec3`/`Vec4`/`Mat4`, look-at and perspective matrices.
- `src/mesh.rs` — triangle meshes; procedural cube, checkerboard ground
  plane, and a subdivided icosphere.
- `src/render.rs` — the pipeline: model/view/projection transform, near-plane
  clipping (Sutherland-Hodgman), screen-space triangle rasterization with a
  z-buffer, perspective-correct attribute interpolation, and per-pixel
  Blinn-Phong shading (ambient + diffuse + specular).
- `src/image.rs` — a PNG encoder implementing just enough of RFC 1950/1951/2083
  by hand (CRC-32, Adler-32, stored/uncompressed DEFLATE blocks) to write
  valid images with no codec dependency.

## Run

```
cargo run --release
```

Renders a 36-frame turntable of a shaded cube and sphere over a checkerboard
ground plane to `output/frame_NNN.png` (960x600), printing per-frame timing.

## Notes on the rasterizer's winding convention

Triangles are culled by projected screen-space area. Given this renderer's
specific view/projection matrices and the y-flip used to map NDC to image
rows, a front-facing triangle is one whose vertices wind so that
`(b - a) x (c - a)` points along the surface's true outward normal *and*
projects to positive screen area — see the vertex orders chosen in
`Mesh::cube` and `Mesh::checker_ground` for worked examples.
