//! Minimal linear algebra: 3D vectors and 4x4 matrices, written from scratch
//! (no external math crate) for exactly what the rasterizer needs.

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Vec3 {
    pub const fn new(x: f32, y: f32, z: f32) -> Self {
        Vec3 { x, y, z }
    }

    pub const ZERO: Vec3 = Vec3::new(0.0, 0.0, 0.0);

    pub fn dot(self, o: Vec3) -> f32 {
        self.x * o.x + self.y * o.y + self.z * o.z
    }

    pub fn cross(self, o: Vec3) -> Vec3 {
        Vec3::new(
            self.y * o.z - self.z * o.y,
            self.z * o.x - self.x * o.z,
            self.x * o.y - self.y * o.x,
        )
    }

    pub fn length(self) -> f32 {
        self.dot(self).sqrt()
    }

    pub fn normalize(self) -> Vec3 {
        let len = self.length();
        if len <= 1e-8 {
            self
        } else {
            self * (1.0 / len)
        }
    }

    pub fn lerp(self, o: Vec3, t: f32) -> Vec3 {
        self + (o - self) * t
    }

    pub fn clamp01(self) -> Vec3 {
        Vec3::new(
            self.x.clamp(0.0, 1.0),
            self.y.clamp(0.0, 1.0),
            self.z.clamp(0.0, 1.0),
        )
    }
}

impl std::ops::Add for Vec3 {
    type Output = Vec3;
    fn add(self, o: Vec3) -> Vec3 {
        Vec3::new(self.x + o.x, self.y + o.y, self.z + o.z)
    }
}

impl std::ops::Sub for Vec3 {
    type Output = Vec3;
    fn sub(self, o: Vec3) -> Vec3 {
        Vec3::new(self.x - o.x, self.y - o.y, self.z - o.z)
    }
}

impl std::ops::Neg for Vec3 {
    type Output = Vec3;
    fn neg(self) -> Vec3 {
        Vec3::new(-self.x, -self.y, -self.z)
    }
}

impl std::ops::Mul<f32> for Vec3 {
    type Output = Vec3;
    fn mul(self, s: f32) -> Vec3 {
        Vec3::new(self.x * s, self.y * s, self.z * s)
    }
}

impl std::ops::Mul<Vec3> for Vec3 {
    type Output = Vec3;
    /// Component-wise product (used for tinting colors by light color etc).
    fn mul(self, o: Vec3) -> Vec3 {
        Vec3::new(self.x * o.x, self.y * o.y, self.z * o.z)
    }
}

/// A point in homogeneous clip space: (x, y, z, w).
#[derive(Clone, Copy, Debug)]
pub struct Vec4 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32,
}

impl Vec4 {
    pub const fn new(x: f32, y: f32, z: f32, w: f32) -> Self {
        Vec4 { x, y, z, w }
    }

    pub fn from_point(v: Vec3) -> Self {
        Vec4::new(v.x, v.y, v.z, 1.0)
    }
}

/// Column-major 4x4 matrix, matching the convention `p' = M * p`.
#[derive(Clone, Copy, Debug)]
pub struct Mat4 {
    pub cols: [[f32; 4]; 4],
}

impl Mat4 {
    pub const IDENTITY: Mat4 = Mat4 {
        cols: [
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0],
        ],
    };

    pub fn mul(self, o: Mat4) -> Mat4 {
        let mut r = [[0.0f32; 4]; 4];
        for col in 0..4 {
            for row in 0..4 {
                let mut sum = 0.0;
                for k in 0..4 {
                    sum += self.cols[k][row] * o.cols[col][k];
                }
                r[col][row] = sum;
            }
        }
        Mat4 { cols: r }
    }

    pub fn mul_vec4(self, v: Vec4) -> Vec4 {
        let x = self.cols[0][0] * v.x + self.cols[1][0] * v.y + self.cols[2][0] * v.z + self.cols[3][0] * v.w;
        let y = self.cols[0][1] * v.x + self.cols[1][1] * v.y + self.cols[2][1] * v.z + self.cols[3][1] * v.w;
        let z = self.cols[0][2] * v.x + self.cols[1][2] * v.y + self.cols[2][2] * v.z + self.cols[3][2] * v.w;
        let w = self.cols[0][3] * v.x + self.cols[1][3] * v.y + self.cols[2][3] * v.z + self.cols[3][3] * v.w;
        Vec4::new(x, y, z, w)
    }

    /// Transform a direction (ignores translation, w = 0).
    pub fn mul_dir(self, v: Vec3) -> Vec3 {
        let r = self.mul_vec4(Vec4::new(v.x, v.y, v.z, 0.0));
        Vec3::new(r.x, r.y, r.z)
    }

    pub fn translation(t: Vec3) -> Mat4 {
        let mut m = Mat4::IDENTITY;
        m.cols[3] = [t.x, t.y, t.z, 1.0];
        m
    }

    pub fn rotate_x(rad: f32) -> Mat4 {
        let (s, c) = rad.sin_cos();
        let mut m = Mat4::IDENTITY;
        m.cols[1][1] = c;
        m.cols[1][2] = s;
        m.cols[2][1] = -s;
        m.cols[2][2] = c;
        m
    }

    pub fn rotate_y(rad: f32) -> Mat4 {
        let (s, c) = rad.sin_cos();
        let mut m = Mat4::IDENTITY;
        m.cols[0][0] = c;
        m.cols[0][2] = -s;
        m.cols[2][0] = s;
        m.cols[2][2] = c;
        m
    }

    pub fn rotate_y_deg(deg: f32) -> Mat4 {
        Mat4::rotate_y(deg.to_radians())
    }

    /// Right-handed look-at view matrix (camera looks down -Z in view space).
    pub fn look_at(eye: Vec3, target: Vec3, up: Vec3) -> Mat4 {
        let f = (target - eye).normalize();
        let s = f.cross(up).normalize();
        let u = s.cross(f);
        // Rows of the rotation part are s, u, -f; translation is -R*eye.
        let mut m = Mat4::IDENTITY;
        m.cols[0] = [s.x, u.x, -f.x, 0.0];
        m.cols[1] = [s.y, u.y, -f.y, 0.0];
        m.cols[2] = [s.z, u.z, -f.z, 0.0];
        m.cols[3] = [-s.dot(eye), -u.dot(eye), f.dot(eye), 1.0];
        m
    }

    /// Right-handed perspective projection, depth range mapped to [-1, 1] (OpenGL-style),
    /// fov_y_rad is the vertical field of view in radians.
    pub fn perspective(fov_y_rad: f32, aspect: f32, near: f32, far: f32) -> Mat4 {
        let f = 1.0 / (fov_y_rad / 2.0).tan();
        let mut m = Mat4 {
            cols: [[0.0; 4]; 4],
        };
        m.cols[0][0] = f / aspect;
        m.cols[1][1] = f;
        m.cols[2][2] = (far + near) / (near - far);
        m.cols[2][3] = -1.0;
        m.cols[3][2] = (2.0 * far * near) / (near - far);
        m
    }
}
