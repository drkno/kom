use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use suppaftp::tokio::AsyncFtpStream;

// BOM actively detects and blocks automated HTTP access to their website
// and the newer WMTS API behind it ("Your access is blocked due to the
// detection of a potential automated access request..."), and that
// message explicitly directs automated consumers to their anonymous FTP
// service instead. So that's what we use: it's the channel BOM themselves
// sanction for exactly this purpose, and it still serves the classic
// per-radar background/overlay/timestamped-frame PNGs.
const FTP_HOST: &str = "ftp.bom.gov.au:21";
const FRAMES_DIR: &str = "/anon/gen/radar";
const OVERLAYS_DIR: &str = "/anon/gen/radar_transparencies";
const RADAR_ID: &str = "IDR713"; // 128km Sydney (Terrey Hills)
const OVERLAY_NAMES: [&str; 3] = ["background", "topography", "locations"];
const MAX_FRAMES: usize = 6;
const CACHE_TTL: Duration = Duration::from_secs(3 * 60);

#[derive(Debug, Clone, Serialize)]
pub struct RadarManifest {
    pub background: String,
    pub overlays: Vec<String>,
    pub frames: Vec<String>,
}

#[derive(Clone)]
struct CachedImage {
    bytes: std::sync::Arc<Vec<u8>>,
}

pub struct RadarCache {
    manifest: Mutex<Option<(Instant, RadarManifest)>>,
    images: Mutex<HashMap<String, CachedImage>>,
}

impl Default for RadarCache {
    fn default() -> Self {
        Self {
            manifest: Mutex::new(None),
            images: Mutex::new(HashMap::new()),
        }
    }
}

async fn connect() -> Result<AsyncFtpStream, String> {
    let mut stream = AsyncFtpStream::connect(FTP_HOST)
        .await
        .map_err(|e| format!("Failed to connect to BOM FTP: {e}"))?;
    stream
        .login("anonymous", "anonymous@")
        .await
        .map_err(|e| format!("Failed to login to BOM FTP: {e}"))?;
    Ok(stream)
}

async fn fetch_file(stream: &mut AsyncFtpStream, dir: &str, name: &str) -> Result<Vec<u8>, String> {
    use tokio::io::AsyncReadExt;

    stream
        .cwd(dir)
        .await
        .map_err(|e| format!("Failed to open {dir}: {e}"))?;
    let mut transfer = stream
        .retr_as_stream(name)
        .await
        .map_err(|e| format!("Failed to download {name}: {e}"))?;
    let mut bytes = Vec::new();
    transfer
        .read_to_end(&mut bytes)
        .await
        .map_err(|e| format!("Failed to read {name}: {e}"))?;
    transfer
        .finish()
        .await
        .map_err(|e| format!("Failed to finish transfer of {name}: {e}"))?;
    Ok(bytes)
}

async fn list_frame_names(stream: &mut AsyncFtpStream) -> Result<Vec<String>, String> {
    stream
        .cwd(FRAMES_DIR)
        .await
        .map_err(|e| format!("Failed to open {FRAMES_DIR}: {e}"))?;
    let names = stream
        .nlst(None)
        .await
        .map_err(|e| format!("Failed to list {FRAMES_DIR}: {e}"))?;

    let prefix = format!("{RADAR_ID}.T.");
    let mut frames: Vec<String> = names
        .into_iter()
        .filter(|name| name.starts_with(&prefix) && name.ends_with(".png"))
        .collect();
    // Names embed a yyyymmddHHMM timestamp, so lexical sort is chronological.
    frames.sort();
    let start = frames.len().saturating_sub(MAX_FRAMES);
    Ok(frames.split_off(start))
}

impl RadarCache {
    pub async fn manifest(&self) -> Result<RadarManifest, String> {
        if let Some((fetched_at, cached)) = self.manifest.lock().unwrap().as_ref() {
            if fetched_at.elapsed() < CACHE_TTL {
                return Ok(cached.clone());
            }
        }

        let mut stream = connect().await?;
        let frames = list_frame_names(&mut stream).await?;
        if frames.is_empty() {
            return Err("No radar frames currently published".to_string());
        }

        let fresh = RadarManifest {
            background: OVERLAY_NAMES[0].to_string(),
            overlays: OVERLAY_NAMES[1..].iter().map(|s| s.to_string()).collect(),
            frames: frames.clone(),
        };

        // Prefetch and cache every image this manifest references so the
        // frontend's <img> requests are served instantly from our own
        // memory rather than each one triggering its own FTP round-trip.
        for overlay in OVERLAY_NAMES {
            if self.images.lock().unwrap().contains_key(overlay) {
                continue;
            }
            match fetch_file(&mut stream, OVERLAYS_DIR, &format!("{RADAR_ID}.{overlay}.png")).await
            {
                Ok(bytes) => {
                    self.images
                        .lock()
                        .unwrap()
                        .insert(overlay.to_string(), CachedImage { bytes: std::sync::Arc::new(bytes) });
                }
                Err(e) => eprintln!("radar: failed to fetch overlay {overlay}: {e}"),
            }
        }
        for frame in &frames {
            if self.images.lock().unwrap().contains_key(frame) {
                continue;
            }
            match fetch_file(&mut stream, FRAMES_DIR, frame).await {
                Ok(bytes) => {
                    self.images
                        .lock()
                        .unwrap()
                        .insert(frame.clone(), CachedImage { bytes: std::sync::Arc::new(bytes) });
                }
                Err(e) => eprintln!("radar: failed to fetch frame {frame}: {e}"),
            }
        }
        let _ = stream.quit().await;

        // Drop anything no longer referenced (frames that scrolled out).
        let keep: std::collections::HashSet<&String> = fresh
            .overlays
            .iter()
            .chain(std::iter::once(&fresh.background))
            .chain(fresh.frames.iter())
            .collect();
        self.images.lock().unwrap().retain(|k, _| keep.contains(k));

        *self.manifest.lock().unwrap() = Some((Instant::now(), fresh.clone()));
        Ok(fresh)
    }

    pub fn image(&self, name: &str) -> Option<std::sync::Arc<Vec<u8>>> {
        self.images.lock().unwrap().get(name).map(|c| c.bytes.clone())
    }
}
