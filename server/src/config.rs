use std::{env, path::PathBuf};

use serde::Deserialize;
use serde_inline_default::serde_inline_default;

#[serde_inline_default]
#[derive(Debug, Deserialize)]
pub struct Config {
    #[serde_inline_default(env!("CARGO_CRATE_NAME").to_string())]
    pub service_name: String,
    #[serde_inline_default("127.0.0.1:3000".to_string())]
    pub bind_address: String,
    #[serde_inline_default(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("public"))]
    pub public_dir: PathBuf,
    #[serde_inline_default(if cfg!(debug_assertions) { "dev".to_string() } else { "prod".to_string() })]
    pub stage: String,
    #[serde(default)]
    pub otlp_endpoint: Option<String>,
    #[serde(default)]
    pub otlp_authorization_header: Option<String>,
    #[serde(default)]
    pub ipinfo_token: Option<String>,
}
