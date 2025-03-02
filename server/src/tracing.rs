use base64::{prelude::BASE64_STANDARD, Engine};
use tracing_loki::{url::Url, BackgroundTask, Layer};

pub struct GrafanaConfig<'a> {
    pub host: Url,
    pub username: &'a str,
    pub password: &'a str,
    pub stage: &'a str,
}

pub fn build_grafana_layer(
    GrafanaConfig {
        host,
        username,
        password,
        stage,
    }: GrafanaConfig,
) -> Result<(Layer, BackgroundTask), tracing_loki::Error> {
    let basic_auth = BASE64_STANDARD.encode(format!("{username}:{password}").as_bytes());

    tracing_loki::builder()
        .label("application", env!("CARGO_CRATE_NAME"))?
        .label("stage", stage)?
        .http_header("Authorization", format!("Basic {basic_auth}"))?
        .build_url(host)
}
