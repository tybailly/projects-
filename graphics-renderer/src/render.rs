use crate::math::{Mat4, Vec3, Vec4};
use crate::mesh::{Mesh, Vertex};

/// RGB framebuffer plus a depth buffer, the target the rasterizer draws into.
pub struct Framebuffer {
    pub width: usize,
    pub height: usize,
    pub color: Vec<Vec3>,
    pub depth: Vec<f32>,
}

impl Framebuffer {
    pub fn new(width: usize, height: usize) -> Self {
        Framebuffer {
            width,
            height,
            color: vec![Vec3::ZERO; width * height],
            depth: vec![f32::INFINITY; width * height],
        }
    }

    pub fn clear(&mut self, bg: Vec3) {
        self.color.fill(bg);
        self.depth.fill(f32::INFINITY);
    }

    #[inline]
    fn set(&mut self, x: usize, y: usize, c: Vec3, z: f32) {
        let idx = y * self.width + x;
        if z < self.depth[idx] {
            self.depth[idx] = z;
            self.color[idx] = c;
        }
    }
}

pub struct DirectionalLight {
    /// Direction the light travels (already normalized), e.g. (0,-1,0) for straight down.
    pub direction: Vec3,
    pub color: Vec3,
    pub intensity: f32,
}

pub struct Camera {
    pub eye: Vec3,
    pub target: Vec3,
    pub up: Vec3,
    pub fov_y_deg: f32,
    pub near: f32,
    pub far: f32,
}

impl Camera {
    pub fn view_proj(&self, aspect: f32) -> Mat4 {
        let view = Mat4::look_at(self.eye, self.target, self.up);
        let proj = Mat4::perspective(self.fov_y_deg.to_radians(), aspect, self.near, self.far);
        proj.mul(view)
    }
}

pub struct Scene {
    pub camera: Camera,
    pub lights: Vec<DirectionalLight>,
    pub ambient: Vec3,
    pub background: Vec3,
}

/// A vertex after the vertex stage: clip-space position plus the
/// world-space attributes needed for per-pixel (Blinn-Phong) shading.
#[derive(Clone, Copy)]
struct ClipVertex {
    clip: Vec4,
    world_pos: Vec3,
    world_normal: Vec3,
    color: Vec3,
}

fn lerp_clip_vertex(a: &ClipVertex, b: &ClipVertex, t: f32) -> ClipVertex {
    ClipVertex {
        clip: Vec4::new(
            a.clip.x + (b.clip.x - a.clip.x) * t,
            a.clip.y + (b.clip.y - a.clip.y) * t,
            a.clip.z + (b.clip.z - a.clip.z) * t,
            a.clip.w + (b.clip.w - a.clip.w) * t,
        ),
        world_pos: a.world_pos.lerp(b.world_pos, t),
        world_normal: a.world_normal.lerp(b.world_normal, t),
        color: a.color.lerp(b.color, t),
    }
}

/// Clip a triangle against the near plane (w >= NEAR_EPS) with Sutherland-Hodgman,
/// so vertices behind the camera don't corrupt the perspective divide.
fn clip_near(tri: [ClipVertex; 3]) -> Vec<ClipVertex> {
    const NEAR_EPS: f32 = 1e-4;
    let mut out = Vec::with_capacity(4);
    for i in 0..3 {
        let cur = tri[i];
        let prev = tri[(i + 2) % 3];
        let cur_in = cur.clip.w >= NEAR_EPS;
        let prev_in = prev.clip.w >= NEAR_EPS;
        if cur_in != prev_in {
            let t = (NEAR_EPS - prev.clip.w) / (cur.clip.w - prev.clip.w);
            out.push(lerp_clip_vertex(&prev, &cur, t));
        }
        if cur_in {
            out.push(cur);
        }
    }
    out
}

pub fn render(fb: &mut Framebuffer, scene: &Scene, meshes: &[Mesh], model: &[Mat4]) {
    fb.clear(scene.background);
    let aspect = fb.width as f32 / fb.height as f32;
    let vp = scene.camera.view_proj(aspect);

    for (mesh, model_mat) in meshes.iter().zip(model.iter()) {
        let normal_mat = *model_mat; // pure rotation/translation in this renderer: no need to invert-transpose
        for tri in &mesh.triangles {
            let cverts: [ClipVertex; 3] = std::array::from_fn(|i| {
                let v: Vertex = tri.v[i];
                let world_pos = model_mat.mul_vec4(Vec4::from_point(v.pos));
                let world_pos = Vec3::new(world_pos.x, world_pos.y, world_pos.z);
                let world_normal = normal_mat.mul_dir(v.normal).normalize();
                let clip = vp.mul_vec4(Vec4::from_point(world_pos));
                ClipVertex {
                    clip,
                    world_pos,
                    world_normal,
                    color: v.color,
                }
            });

            let poly = clip_near(cverts);
            if poly.len() < 3 {
                continue;
            }
            // Fan-triangulate the (possibly quad-shaped) clipped polygon.
            for i in 1..poly.len() - 1 {
                rasterize_triangle(fb, scene, &poly[0], &poly[i], &poly[i + 1]);
            }
        }
    }
}

struct ScreenVert {
    x: f32,
    y: f32,
    inv_w: f32,
    ndc_z: f32,
    world_pos: Vec3,
    world_normal: Vec3,
    color: Vec3,
}

fn to_screen(v: &ClipVertex, width: f32, height: f32) -> ScreenVert {
    let inv_w = 1.0 / v.clip.w;
    let ndc_x = v.clip.x * inv_w;
    let ndc_y = v.clip.y * inv_w;
    let ndc_z = v.clip.z * inv_w;
    ScreenVert {
        x: (ndc_x * 0.5 + 0.5) * width,
        y: (1.0 - (ndc_y * 0.5 + 0.5)) * height,
        inv_w,
        ndc_z,
        world_pos: v.world_pos,
        world_normal: v.world_normal,
        color: v.color,
    }
}

fn edge(ax: f32, ay: f32, bx: f32, by: f32, px: f32, py: f32) -> f32 {
    (px - ax) * (by - ay) - (py - ay) * (bx - ax)
}

fn shade(scene: &Scene, world_pos: Vec3, normal: Vec3, base_color: Vec3) -> Vec3 {
    let n = normal.normalize();
    let view_dir = (scene.camera.eye - world_pos).normalize();
    let mut result = base_color * scene.ambient;
    for light in &scene.lights {
        let light_dir = -light.direction.normalize();
        let ndotl = n.dot(light_dir).max(0.0);
        let diffuse = base_color * light.color * (light.intensity * ndotl);
        let half = (light_dir + view_dir).normalize();
        let spec_strength = n.dot(half).max(0.0).powf(48.0) * 0.35;
        let specular = light.color * (light.intensity * spec_strength);
        result = result + diffuse + specular;
    }
    result.clamp01()
}

fn rasterize_triangle(fb: &mut Framebuffer, scene: &Scene, a: &ClipVertex, b: &ClipVertex, c: &ClipVertex) {
    let (w, h) = (fb.width as f32, fb.height as f32);
    let sa = to_screen(a, w, h);
    let sb = to_screen(b, w, h);
    let sc = to_screen(c, w, h);

    // Back-face culling: with our y-flipped screen space, a triangle whose
    // vertices wind so that (b-a)x(c-a) points along the true outward normal
    // projects to positive screen area — that's the front face we keep.
    let area = edge(sa.x, sa.y, sb.x, sb.y, sc.x, sc.y);
    if area <= 0.0 {
        return;
    }

    let min_x = sa.x.min(sb.x).min(sc.x).floor().max(0.0) as i32;
    let max_x = sa.x.max(sb.x).max(sc.x).ceil().min(w - 1.0) as i32;
    let min_y = sa.y.min(sb.y).min(sc.y).floor().max(0.0) as i32;
    let max_y = sa.y.max(sb.y).max(sc.y).ceil().min(h - 1.0) as i32;
    if min_x > max_x || min_y > max_y {
        return;
    }

    let inv_area = 1.0 / area;
    for y in min_y..=max_y {
        for x in min_x..=max_x {
            let px = x as f32 + 0.5;
            let py = y as f32 + 0.5;
            let w0 = edge(sb.x, sb.y, sc.x, sc.y, px, py) * inv_area;
            let w1 = edge(sc.x, sc.y, sa.x, sa.y, px, py) * inv_area;
            let w2 = edge(sa.x, sa.y, sb.x, sb.y, px, py) * inv_area;
            if w0 < 0.0 || w1 < 0.0 || w2 < 0.0 {
                continue;
            }

            let ndc_z = w0 * sa.ndc_z + w1 * sb.ndc_z + w2 * sc.ndc_z;

            // Perspective-correct interpolation: interpolate attr/w, then divide by interpolated 1/w.
            let inv_w = w0 * sa.inv_w + w1 * sb.inv_w + w2 * sc.inv_w;
            let persp = |get: fn(&ScreenVert) -> Vec3| -> Vec3 {
                (get(&sa) * (w0 * sa.inv_w) + get(&sb) * (w1 * sb.inv_w) + get(&sc) * (w2 * sc.inv_w)) * (1.0 / inv_w)
            };
            let world_pos = persp(|s| s.world_pos);
            let world_normal = persp(|s| s.world_normal);
            let color = persp(|s| s.color);

            let shaded = shade(scene, world_pos, world_normal, color);
            fb.set(x as usize, y as usize, shaded, ndc_z);
        }
    }
}
