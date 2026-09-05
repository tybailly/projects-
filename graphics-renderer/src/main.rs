mod image;
mod math;
mod mesh;
mod render;

use math::{Mat4, Vec3};
use mesh::Mesh;
use render::{Camera, DirectionalLight, Framebuffer, Scene};
use std::fs::File;
use std::io::BufWriter;
use std::time::Instant;

fn main() -> std::io::Result<()> {
    let width = 960usize;
    let height = 600usize;
    let frame_count = 36usize;
    let out_dir = std::path::Path::new("output");
    std::fs::create_dir_all(out_dir)?;

    let cube = Mesh::cube(1.0);
    let sphere = Mesh::icosphere(1.0, 3, Vec3::new(0.85, 0.55, 0.15));
    let ground = Mesh::checker_ground(0.0, 9.0, 18);

    let scene = Scene {
        camera: Camera {
            eye: Vec3::new(0.0, 2.3, 6.2),
            target: Vec3::new(0.0, 0.6, 0.0),
            up: Vec3::new(0.0, 1.0, 0.0),
            fov_y_deg: 42.0,
            near: 0.1,
            far: 100.0,
        },
        lights: vec![DirectionalLight {
            direction: Vec3::new(-0.45, -1.0, -0.35).normalize(),
            color: Vec3::new(1.0, 0.97, 0.9),
            intensity: 1.05,
        }],
        ambient: Vec3::new(0.12, 0.13, 0.17),
        background: Vec3::new(0.53, 0.72, 0.86),
    };

    let mut fb = Framebuffer::new(width, height);
    let mut total_time = 0.0f64;

    for frame in 0..frame_count {
        let t = frame as f32 / frame_count as f32;
        let cube_angle = t * 360.0;
        let sphere_angle = t * 150.0;
        let bob = (t * std::f32::consts::TAU).sin() * 0.15;

        let cube_model = Mat4::translation(Vec3::new(-1.7, 1.0, 0.0))
            .mul(Mat4::rotate_y_deg(cube_angle))
            .mul(Mat4::rotate_x(cube_angle.to_radians() * 0.6));
        let sphere_model = Mat4::translation(Vec3::new(1.7, 1.0 + bob, 0.0)).mul(Mat4::rotate_y_deg(sphere_angle));
        let ground_model = Mat4::IDENTITY;

        let meshes = [cube.clone(), sphere.clone(), ground.clone()];
        let models = [cube_model, sphere_model, ground_model];

        let start = Instant::now();
        render::render(&mut fb, &scene, &meshes, &models);
        total_time += start.elapsed().as_secs_f64();

        let path = out_dir.join(format!("frame_{:03}.png", frame));
        let file = File::create(&path)?;
        let mut writer = BufWriter::new(file);
        image::write_png(&mut writer, fb.width, fb.height, &fb.color)?;
        println!("wrote {}", path.display());
    }

    println!(
        "rendered {} frames at {}x{} in {:.3}s total ({:.2} ms/frame avg)",
        frame_count,
        width,
        height,
        total_time,
        (total_time / frame_count as f64) * 1000.0
    );
    Ok(())
}
