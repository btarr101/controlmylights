use std::path::PathBuf;

use axum::Router;
use controlmylights::{repo::led::LedRepo, routers::api, state::AppState, types::Color};
use tower_http::services::ServeDir;

#[shuttle_runtime::main]
async fn main() -> shuttle_axum::ShuttleAxum {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));

    let initial_colors = [Color {
        red: 255,
        green: 255,
        blue: 255,
    }; 250];
    let leds = LedRepo::new(initial_colors);

    let state = AppState { leds };

    let router = Router::new()
        .nest("/api", api::get_router())
        .with_state(state)
        .fallback_service(ServeDir::new(manifest_dir.join("public")));

    Ok(router.into())
}
