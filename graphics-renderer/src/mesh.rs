use crate::math::Vec3;

/// One vertex of a triangle: world-space position, normal, and base color.
#[derive(Clone, Copy, Debug)]
pub struct Vertex {
    pub pos: Vec3,
    pub normal: Vec3,
    pub color: Vec3,
}

#[derive(Clone, Debug)]
pub struct Triangle {
    pub v: [Vertex; 3],
}

#[derive(Clone, Debug, Default)]
pub struct Mesh {
    pub triangles: Vec<Triangle>,
}

impl Mesh {
    fn quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, color: Vec3) -> [Triangle; 2] {
        let n = (b - a).cross(c - a).normalize();
        let vert = |p: Vec3| Vertex {
            pos: p,
            normal: n,
            color,
        };
        [
            Triangle {
                v: [vert(a), vert(b), vert(c)],
            },
            Triangle {
                v: [vert(a), vert(c), vert(d)],
            },
        ]
    }

    /// Axis-aligned cube centered at the origin with the given half-extent,
    /// one solid color per face so shading reveals each side distinctly.
    pub fn cube(half: f32) -> Mesh {
        let h = half;
        let p = |x: f32, y: f32, z: f32| Vec3::new(x * h, y * h, z * h);
        let mut tris = Vec::new();

        // +X (red), -X (cyan)
        tris.extend(Mesh::quad(p(1.0, 1.0, -1.0), p(1.0, 1.0, 1.0), p(1.0, -1.0, 1.0), p(1.0, -1.0, -1.0), Vec3::new(0.85, 0.2, 0.2)));
        tris.extend(Mesh::quad(p(-1.0, 1.0, 1.0), p(-1.0, 1.0, -1.0), p(-1.0, -1.0, -1.0), p(-1.0, -1.0, 1.0), Vec3::new(0.2, 0.8, 0.8)));
        // +Y (green), -Y (yellow)
        tris.extend(Mesh::quad(p(-1.0, 1.0, 1.0), p(1.0, 1.0, 1.0), p(1.0, 1.0, -1.0), p(-1.0, 1.0, -1.0), Vec3::new(0.25, 0.8, 0.3)));
        tris.extend(Mesh::quad(p(-1.0, -1.0, -1.0), p(1.0, -1.0, -1.0), p(1.0, -1.0, 1.0), p(-1.0, -1.0, 1.0), Vec3::new(0.85, 0.75, 0.2)));
        // +Z (blue), -Z (magenta)
        tris.extend(Mesh::quad(p(1.0, -1.0, 1.0), p(1.0, 1.0, 1.0), p(-1.0, 1.0, 1.0), p(-1.0, -1.0, 1.0), Vec3::new(0.25, 0.35, 0.85)));
        tris.extend(Mesh::quad(p(-1.0, -1.0, -1.0), p(-1.0, 1.0, -1.0), p(1.0, 1.0, -1.0), p(1.0, -1.0, -1.0), Vec3::new(0.7, 0.3, 0.75)));

        Mesh { triangles: tris }
    }

    /// A flat checkerboard ground plane in the XZ plane at height `y`.
    pub fn checker_ground(y: f32, half_extent: f32, cells: i32) -> Mesh {
        let mut tris = Vec::new();
        let cell = (half_extent * 2.0) / cells as f32;
        for iz in 0..cells {
            for ix in 0..cells {
                let x0 = -half_extent + ix as f32 * cell;
                let z0 = -half_extent + iz as f32 * cell;
                let x1 = x0 + cell;
                let z1 = z0 + cell;
                let light = (ix + iz) % 2 == 0;
                let color = if light {
                    Vec3::new(0.82, 0.82, 0.85)
                } else {
                    Vec3::new(0.25, 0.26, 0.3)
                };
                tris.extend(Mesh::quad(
                    Vec3::new(x0, y, z0),
                    Vec3::new(x0, y, z1),
                    Vec3::new(x1, y, z1),
                    Vec3::new(x1, y, z0),
                    color,
                ));
            }
        }
        Mesh { triangles: tris }
    }

    /// A subdivided icosphere, useful as a smooth-shaded test object.
    pub fn icosphere(radius: f32, subdivisions: u32, color: Vec3) -> Mesh {
        let t = (1.0 + 5.0f32.sqrt()) / 2.0;
        let raw: [(f32, f32, f32); 12] = [
            (-1.0, t, 0.0), (1.0, t, 0.0), (-1.0, -t, 0.0), (1.0, -t, 0.0),
            (0.0, -1.0, t), (0.0, 1.0, t), (0.0, -1.0, -t), (0.0, 1.0, -t),
            (t, 0.0, -1.0), (t, 0.0, 1.0), (-t, 0.0, -1.0), (-t, 0.0, 1.0),
        ];
        let mut verts: Vec<Vec3> = raw.iter().map(|&(x, y, z)| Vec3::new(x, y, z).normalize()).collect();

        let mut faces: Vec<[usize; 3]> = vec![
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
        ];

        let mut midpoint_cache: std::collections::HashMap<(usize, usize), usize> = std::collections::HashMap::new();
        for _ in 0..subdivisions {
            let mut new_faces = Vec::with_capacity(faces.len() * 4);
            for f in faces {
                let mut mid = |a: usize, b: usize, verts: &mut Vec<Vec3>| -> usize {
                    let key = if a < b { (a, b) } else { (b, a) };
                    if let Some(&idx) = midpoint_cache.get(&key) {
                        return idx;
                    }
                    let m = ((verts[a] + verts[b]) * 0.5).normalize();
                    verts.push(m);
                    let idx = verts.len() - 1;
                    midpoint_cache.insert(key, idx);
                    idx
                };
                let ab = mid(f[0], f[1], &mut verts);
                let bc = mid(f[1], f[2], &mut verts);
                let ca = mid(f[2], f[0], &mut verts);
                new_faces.push([f[0], ab, ca]);
                new_faces.push([f[1], bc, ab]);
                new_faces.push([f[2], ca, bc]);
                new_faces.push([ab, bc, ca]);
            }
            faces = new_faces;
        }

        let mut tris = Vec::with_capacity(faces.len());
        for f in faces {
            let a = verts[f[0]];
            let b = verts[f[1]];
            let c = verts[f[2]];
            tris.push(Triangle {
                v: [
                    Vertex { pos: a * radius, normal: a, color },
                    Vertex { pos: b * radius, normal: b, color },
                    Vertex { pos: c * radius, normal: c, color },
                ],
            });
        }
        Mesh { triangles: tris }
    }
}
