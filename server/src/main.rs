use std::{net::SocketAddr, sync::Arc};

use axum::{http::request::Request, routing::get, Extension, Router};
use controlmylights::{
    config::Config,
    ipinfo_lookup::ipinfo_lookup,
    repo::led::LedRepo,
    routers::api,
    routes::light_bulb_generated::get_randomly_generated_light_bulb_svg,
    tracing::{setup_tracing, TracingConfig},
    types::Color,
};
use ipinfo::{IpInfo, IpInfoConfig};
use serde_envfile::from_env;
use tokio::sync::Mutex;
use tower_http::{
    cors::{AllowMethods, AllowOrigin, CorsLayer},
    services::{ServeDir, ServeFile},
    trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer},
};
use tracing::Span;

const LED_COUNT: usize = 150;
const XMAS_LED_COUNT: usize = 300;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config: Config = from_env()?;

    setup_tracing(TracingConfig {
        service_name: &config.service_name,
        stage: &config.stage,
        otlp_endpoint: config.otlp_endpoint.as_deref(),
        otlp_authorization_header: config.otlp_authorization_header.as_deref(),
    })?;

    let ipinfo = config
        .ipinfo_token
        .map(|token| {
            let ipinfo_config = IpInfoConfig {
                token: Some(token.to_string()),
                ..Default::default()
            };
            IpInfo::new(ipinfo_config).map(|ipinfo| Arc::new(Mutex::new(ipinfo)))
        })
        .transpose()?;

    if ipinfo.is_none() {
        tracing::warn!("IPInfo token not provided, IP lookup will be disabled");
    }

    let leds = LedRepo::new(vec![
        Color {
            red: 255,
            green: 255,
            blue: 255,
        };
        LED_COUNT
    ]);

    let xmas_leds = LedRepo::new(vec![
        Color {
            red: 255,
            green: 255,
            blue: 255
        };
        XMAS_LED_COUNT
    ]);

    let cors = CorsLayer::new()
        .allow_methods(AllowMethods::any())
        .allow_origin(AllowOrigin::any());

    let router = Router::new()
        .nest(
            "/api",
            Router::new()
                .merge(api::get_router().with_state(leds))
                .nest("/xmas", api::get_router().with_state(xmas_leds)),
        )
        .layer(cors)
        .route(
            "/light-bulb-generated.svg",
            get(get_randomly_generated_light_bulb_svg),
        )
        .fallback_service(
            ServeDir::new(&config.public_dir)
                .fallback(ServeFile::new(config.public_dir.join("index.html"))),
        );

    let service = router.layer(
        TraceLayer::new_for_http()
            .make_span_with(
                DefaultMakeSpan::new()
                    .include_headers(true)
                    .level(tracing::Level::INFO),
            )
            .on_request(move |request: &Request<axum::body::Body>, _span: &Span| {
                tracing::info!("Started processing request");
                ipinfo_lookup(request);
            })
            .on_response(DefaultOnResponse::new().level(tracing::Level::INFO)),
    );

    let service = if let Some(ipinfo) = ipinfo {
        service.layer(Extension(ipinfo))
    } else {
        service
    }
    .into_make_service_with_connect_info::<SocketAddr>();

    tracing::info!("Starting server at http://{}", config.bind_address);

    let listener = tokio::net::TcpListener::bind(config.bind_address).await?;
    axum::serve(listener, service).await?;

    Ok(())
}
