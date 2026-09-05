use crate::math::Vec3;
use std::io::{self, Write};

/// Writes a truecolor PNG, implementing just enough of RFC 1950/1951/2083 by
/// hand (CRC-32, Adler-32, and *stored* — i.e. uncompressed — DEFLATE blocks)
/// so the renderer has zero image/codec dependencies.
pub fn write_png<W: Write>(w: &mut W, width: usize, height: usize, pixels: &[Vec3]) -> io::Result<()> {
    assert_eq!(pixels.len(), width * height);

    w.write_all(&[0x89, b'P', b'N', b'G', 0x0D, 0x0A, 0x1A, 0x0A])?;

    let mut ihdr = Vec::with_capacity(13);
    ihdr.extend_from_slice(&(width as u32).to_be_bytes());
    ihdr.extend_from_slice(&(height as u32).to_be_bytes());
    ihdr.extend_from_slice(&[8, 2, 0, 0, 0]); // bit depth 8, color type 2 (RGB), default compr/filter/interlace
    write_chunk(w, b"IHDR", &ihdr)?;

    // Raw scanlines: each row is a filter-type byte (0 = None) followed by RGB bytes.
    let mut raw = Vec::with_capacity(height * (1 + width * 3));
    for y in 0..height {
        raw.push(0);
        for x in 0..width {
            let c = pixels[y * width + x];
            let to_u8 = |v: f32| (v.clamp(0.0, 1.0) * 255.0 + 0.5) as u8;
            raw.push(to_u8(c.x));
            raw.push(to_u8(c.y));
            raw.push(to_u8(c.z));
        }
    }

    let zlib = zlib_compress_stored(&raw);
    write_chunk(w, b"IDAT", &zlib)?;
    write_chunk(w, b"IEND", &[])?;
    Ok(())
}

fn write_chunk<W: Write>(w: &mut W, tag: &[u8; 4], data: &[u8]) -> io::Result<()> {
    w.write_all(&(data.len() as u32).to_be_bytes())?;
    w.write_all(tag)?;
    w.write_all(data)?;
    let table = crc32_table();
    let mut crc = 0xFFFFFFFFu32;
    for &byte in tag.iter().chain(data.iter()) {
        crc = table[((crc ^ byte as u32) & 0xFF) as usize] ^ (crc >> 8);
    }
    w.write_all(&(crc ^ 0xFFFFFFFF).to_be_bytes())?;
    Ok(())
}

/// Wraps `data` in a valid zlib stream (RFC 1950) using only uncompressed
/// ("stored", BTYPE=00) DEFLATE blocks, each capped at the format's 65535-byte limit.
fn zlib_compress_stored(data: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(data.len() + data.len() / 65535 * 5 + 8);
    out.push(0x78); // CMF: deflate, 32K window
    out.push(0x01); // FLG: no dict, check bits for a valid CMF/FLG pair

    const MAX_BLOCK: usize = 65535;
    let mut offset = 0;
    if data.is_empty() {
        out.push(1); // BFINAL=1, BTYPE=00, empty stored block
        out.extend_from_slice(&0u16.to_le_bytes());
        out.extend_from_slice(&0xFFFFu16.to_le_bytes());
    }
    while offset < data.len() {
        let end = (offset + MAX_BLOCK).min(data.len());
        let chunk = &data[offset..end];
        let is_last = end == data.len();
        out.push(if is_last { 1 } else { 0 });
        let len = chunk.len() as u16;
        out.extend_from_slice(&len.to_le_bytes());
        out.extend_from_slice(&(!len).to_le_bytes());
        out.extend_from_slice(chunk);
        offset = end;
    }

    out.extend_from_slice(&adler32(data).to_be_bytes());
    out
}

fn adler32(data: &[u8]) -> u32 {
    const MOD_ADLER: u32 = 65521;
    let (mut a, mut b) = (1u32, 0u32);
    for &byte in data {
        a = (a + byte as u32) % MOD_ADLER;
        b = (b + a) % MOD_ADLER;
    }
    (b << 16) | a
}

fn crc32_table() -> [u32; 256] {
    let mut table = [0u32; 256];
    for n in 0..256u32 {
        let mut c = n;
        for _ in 0..8 {
            c = if c & 1 != 0 { 0xEDB88320 ^ (c >> 1) } else { c >> 1 };
        }
        table[n as usize] = c;
    }
    table
}

