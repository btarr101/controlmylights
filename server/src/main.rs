use std::path::PathBuf;

use axum::Router;
use chrono::Utc;
use controlmylights::{
    config::Config,
    repo::led::{Led, LedRepo, LedRepoSnapshot},
    routers::api,
    state::AppState,
    tasks::persist::persist,
    tracing::{setup_tracing, TracingConfig},
    types::Color,
};
use shuttle_runtime::{CustomError, SecretStore};
use shuttle_shared_db::SerdeJsonOperator;
use tower_http::{
    cors::{AllowMethods, AllowOrigin, CorsLayer},
    services::ServeDir,
    trace::{DefaultMakeSpan, DefaultOnRequest, DefaultOnResponse, TraceLayer},
};
use tracing::Level;

#[shuttle_runtime::main]
async fn main(
    #[shuttle_runtime::Secrets] secret_store: SecretStore,
    #[shuttle_shared_db::Postgres] operator: SerdeJsonOperator,
) -> shuttle_axum::ShuttleAxum {
    let config = Config::try_from(&secret_store)
        .map_err(|err| shuttle_runtime::Error::Custom(CustomError::new(err)))?;

    setup_tracing(TracingConfig {
        service_name: config.service_name,
        stage: config.stage,
        otlp_endpoint: &config.otlp_endpoint,
        otlp_username: &config.otlp_username,
        otlp_password: &config.otlp_password,
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
                .make_span_with(
                    DefaultMakeSpan::new()
                        .include_headers(true)
                        .level(Level::INFO),
                )
                .on_request(DefaultOnRequest::new().level(Level::INFO))
                .on_response(DefaultOnResponse::new().level(Level::INFO)),
        )
        .into())
}
