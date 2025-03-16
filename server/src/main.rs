use std::{net::SocketAddr, path::PathBuf, sync::Arc};

use axum::{
    extract::connect_info::IntoMakeServiceWithConnectInfo, http::request::Request, routing::get,
    Extension, Router,
};
use axum_client_ip::InsecureClientIp;
use controlmylights::{
    config::Config,
    repo::led::{LedRepo, LedRepoSnapshot},
    routers::api,
    routes::light_bulb_generated::get_randomly_generated_light_bulb_svg,
    state::AppState,
    tasks::persist::persist,
    tracing::{setup_tracing, TracingConfig},
};
use ipinfo::{IpInfo, IpInfoConfig};
use shuttle_runtime::{CustomError, SecretStore, Service};
use shuttle_shared_db::SerdeJsonOperator;
use tokio::sync::Mutex;
use tower_http::{
    cors::{AllowMethods, AllowOrigin, CorsLayer},
    services::{ServeDir, ServeFile},
    trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer},
};
use tracing::{error, info, Instrument, Level, Span};

const LED_COUNT: usize = 150;

pub struct MyService(IntoMakeServiceWithConnectInfo<Router, SocketAddr>);

#[shuttle_runtime::async_trait]
impl Service for MyService {
    async fn bind(mut self, addr: SocketAddr) -> Result<(), shuttle_runtime::Error> {
        let tcp_listener = shuttle_runtime::tokio::net::TcpListener::bind(addr)
            .await
            .map_err(|err| shuttle_runtime::Error::BindPanic(err.to_string()))?;
        axum::serve(tcp_listener, self.0)
            .await
            .map_err(CustomError::new)?;

        Ok(())
    }
}

#[shuttle_runtime::main]
async fn main(
    #[shuttle_runtime::Secrets] secret_store: SecretStore,
    #[shuttle_shared_db::Postgres] operator: SerdeJsonOperator,
) -> Result<MyService, shuttle_runtime::Error> {
    let config = Config::try_from(&secret_store)
        .map_err(|err| shuttle_runtime::Error::Custom(CustomError::new(err)))?;

    setup_tracing(TracingConfig {
        service_name: config.service_name,
        stage: config.stage,
        otlp_endpoint: &config.otlp_endpoint,
        otlp_username: &config.otlp_username,
        otlp_password: &config.otlp_password,
    })?;

    let ipinfo_config = IpInfoConfig {
        token: Some(config.ipinfo_token),
        ..Default::default()
    };
    let ipinfo = Arc::new(Mutex::new(
        IpInfo::new(ipinfo_config).map_err(shuttle_runtime::CustomError::new)?,
    ));

    let snapshot = operator
        .read_serialized("snapshot")
        .await
        .unwrap_or_else(|_| LedRepoSnapshot {
            generation: 0,
            leds: vec![],
        });
    let leds = LedRepo::from(snapshot);
    leds.resize(LED_COUNT).await;

    let state = AppState { leds: leds.clone() };

    tokio::spawn(persist(leds.clone(), operator));

    let cors = CorsLayer::new()
        .allow_methods(AllowMethods::any())
        .allow_origin(AllowOrigin::any());

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let router = Router::new()
        .nest("/api", api::get_router().layer(cors))
        .with_state(state)
        .route(
            "/light-bulb-generated.svg",
            get(get_randomly_generated_light_bulb_svg),
        )
        .fallback_service(
            ServeDir::new(manifest_dir.join("public")).fallback(ServeFile::new(
                manifest_dir.join("public").join("index.html"),
            )),
        );

    let service = router
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(
                    DefaultMakeSpan::new()
                        .include_headers(true)
                        .level(Level::INFO),
                )
                .on_request(move |request: &Request<axum::body::Body>, _span: &Span| {
                    info!("started processing request");

                    let extensions = request.extensions();
                    let ip_result = InsecureClientIp::from(request.headers(), extensions);

                    if let Ok(InsecureClientIp(ip)) = ip_result {
                        info!("Extracted ip: {}", ip);

                        let ipinfo = request.extensions().get::<Arc<Mutex<IpInfo>>>();

                        if let Some(ipinfo) = ipinfo.cloned() {
                            tokio::task::spawn(
                                async move {
                                    let lookup = ipinfo.lock().await.lookup(&ip.to_string()).await;
                                    match lookup {
                                        Ok(details) => info!("Looked up '{}': {:?}", ip, details),
                                        Err(err) => {
                                            error!("Failed to look up ip '{}': {}", ip, err)
                                        }
                                    }
                                }
                                .instrument(Span::current()),
                            );
                        }
                    };
                })
                .on_response(DefaultOnResponse::new().level(Level::INFO)),
        )
        .layer(Extension(ipinfo))
        .into_make_service_with_connect_info::<SocketAddr>();

    Ok(MyService(service))
}
