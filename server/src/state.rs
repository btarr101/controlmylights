use axum::extract::FromRef;

use crate::repo::led::LedRepo;

#[derive(Clone)]
pub struct AppState {
    pub leds: LedRepo,
}

impl FromRef<AppState> for LedRepo {
    fn from_ref(state: &AppState) -> Self { state.leds.clone() }
}
