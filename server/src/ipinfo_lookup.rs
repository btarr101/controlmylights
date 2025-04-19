use std::sync::Arc;

use axum::http::Request;
use axum_client_ip::InsecureClientIp;
use ipinfo::IpInfo;
use tokio::sync::Mutex;
use tracing::{Instrument as _, Span};

pub fn ipinfo_lookup(request: &Request<axum::body::Body>) {
    let extensions = request.extensions();
    let ip_result = InsecureClientIp::from(request.headers(), extensions);

    if let Ok(InsecureClientIp(ip)) = ip_result {
        tracing::info!("Extracted ip: {}", ip);

        let ipinfo = request.extensions().get::<Arc<Mutex<IpInfo>>>();

        if let Some(ipinfo) = ipinfo.cloned() {
            tokio::task::spawn(
                async move {
                    let lookup = ipinfo.lock().await.lookup(&ip.to_string()).await;
                    match lookup {
                        Ok(details) => tracing::info!("Looked up '{}': {:?}", ip, details),
                        Err(err) => tracing::error!("Failed to look up ip '{}': {}", ip, err),
                    }
                }
                .instrument(Span::current()),
            );
        }
    };
}
