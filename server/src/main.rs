use std::path::PathBuf;

use axum::{
    body::Body,
    http::{Request, Response},
    Router,
};
use chrono::Utc;
use controlmylights::{
    config::Config,
    repo::led::{Led, LedRepo, LedRepoSnapshot},
    routers::api,
    state::AppState,
    tasks::persist::persist,
    tracing::{build_grafana_layer, GrafanaConfig},
    types::Color,
};
use shuttle_runtime::{CustomError, SecretStore};
use shuttle_shared_db::SerdeJsonOperator;
use tower_http::{
    cors::{AllowMethods, AllowOrigin, CorsLayer},
    services::ServeDir,
    trace::{DefaultOnRequest, DefaultOnResponse, TraceLayer},
};
use tracing::{level_filters::LevelFilter, span, Level};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[shuttle_runtime::main]
async fn main(
    #[shuttle_runtime::Secrets] secret_store: SecretStore,
    #[shuttle_shared_db::Postgres] operator: SerdeJsonOperator,
) -> shuttle_axum::ShuttleAxum {
    let config = Config::try_from(&secret_store)
        .map_err(|err| shuttle_runtime::Error::Custom(CustomError::new(err)))?;

    setup_tracing(GrafanaConfig {
        host: config.grafana_host,
        username: &config.grafana_username,
        password: &config.grafana_password,
        stage: config.stage,
    })?;

    let snapshot = operator
        .read_serialized("snapshot")
        .await
        .unwrap_or_else(|_| {
            let now = Utc::now();
            LedRepoSnapshot {
                generation: 0,
                leds: vec![
                    Led {
                        color: Color {
                            red: 255,
                            green: 255,
                            blue: 255,
                        },
                        last_updated: now
                    };
                    250
                ],
            }
        });
    let leds = LedRepo::from(snapshot);
    let state = AppState { leds: leds.clone() };

    tokio::spawn(persist(leds.clone(), operator));

    let cors = CorsLayer::new()
        .allow_methods(AllowMethods::any())
        .allow_origin(AllowOrigin::any());

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let router = Router::new()
        .nest("/api", api::get_router().layer(cors))
        .with_state(state)
        .fallback_service(ServeDir::new(manifest_dir.join("public")));

    Ok(router
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(|request: &Request<Body>| {
                    span!(
                        Level::INFO,
                        "request",
                        method = %request.method(),
                        uri = %request.uri(),
                        version = ?request.version(),
                        headers = ?request.headers(),
                        request_id = %uuid::Uuid::new_v4(),
                    )
                })
                .on_request(DefaultOnRequest::new().level(Level::INFO))
                .on_response(DefaultOnResponse::new().level(Level::INFO)),
        )
        .into())
}

fn setup_tracing(grafana_config: GrafanaConfig) -> Result<(), shuttle_runtime::Error> {
    let filter = EnvFilter::builder()
        .with_default_directive(LevelFilter::INFO.into())
        .from_env_lossy();

    let (grafana_layer, grafana_task) = build_grafana_layer(grafana_config)
        .map_err(|err| shuttle_runtime::Error::Custom(CustomError::new(err)))?;

    tracing_subscriber::registry()
        .with(filter)
        .with(tracing_subscriber::fmt::Layer::new().without_time())
        .with(grafana_layer)
        .init();

    tokio::spawn(grafana_task);

    Ok(())
}
