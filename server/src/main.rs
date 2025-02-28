use std::path::PathBuf;

use axum::Router;
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
};
use tracing::level_filters::LevelFilter;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[shuttle_runtime::main]
async fn main(
    #[shuttle_runtime::Secrets] secret_store: SecretStore,
    #[shuttle_shared_db::Postgres] operator: SerdeJsonOperator,
) -> shuttle_axum::ShuttleAxum {
    let config = Config::try_from(&secret_store)
        .map_err(|err| shuttle_runtime::Error::Custom(CustomError::new(err)))?;

    let filter = EnvFilter::builder()
        .with_default_directive(LevelFilter::DEBUG.into())
        .from_env_lossy();

    let (grafana_layer, grafana_task) = build_grafana_layer(GrafanaConfig {
        host: config.grafana_host,
        username: &config.grafana_username,
        password: &config.grafana_password,
        stage: config.stage,
    })
    .map_err(|err| shuttle_runtime::Error::Custom(CustomError::new(err)))?;

    tracing_subscriber::registry()
        .with(filter)
        .with(tracing_subscriber::fmt::Layer::new())
        .with(grafana_layer)
        .init();

    tokio::spawn(grafana_task);

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

    Ok(router.into())
}
