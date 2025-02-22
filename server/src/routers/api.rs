use std::time::Duration;

use axum::{
    extract::{
        ws::{Message, WebSocket},
        Path, State, WebSocketUpgrade,
    },
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Form, Json, Router,
};
use axum_thiserror::ErrorStatus;
use futures::{
    stream::{SplitSink, SplitStream},
    SinkExt, StreamExt,
};
use tokio::{spawn, time::sleep};

use crate::{
    repo::led::{Led, LedRepo, LedRepoError},
    state::AppState,
    types::Color,
};

pub fn get_router() -> Router<AppState> {
    Router::new()
        .route("/leds", get(get_leds))
        .route("/leds/{id}", get(get_led).post(post_led))
        .route("/leds/ws", get(get_ws))
}

#[derive(thiserror::Error, Debug, ErrorStatus)]
pub enum LedRouterError {
    #[error("Led with id {0} does not exist")]
    #[status(StatusCode::INTERNAL_SERVER_ERROR)]
    NotFound(usize),
}

async fn get_led(
    State(leds): State<LedRepo>,
    Path(id): Path<usize>,
) -> Result<Json<Led>, LedRouterError> {
    let led = leds.get(id).await.ok_or(LedRouterError::NotFound(id))?;

    Ok(Json(led))
}

async fn get_leds(State(leds): State<LedRepo>) -> Json<Vec<Led>> {
    Json(leds.snapshot().await.leds)
}

async fn post_led(
    State(leds): State<LedRepo>,
    Path(id): Path<usize>,
    Form(color): Form<Color>,
) -> Result<(), LedRouterError> {
    leds.set(id, Led { color }).await.map_err(|err| match err {
        LedRepoError::OutOfBounds(id) => LedRouterError::NotFound(id),
    })?;

    Ok(())
}

async fn get_ws(State(leds): State<LedRepo>, ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(|ws| {
        Box::pin(async {
            let (tx, rx) = ws.split();

            let mut rx_task = spawn(rx_handler(rx, leds.clone()));
            let mut tx_task = spawn(tx_handler(tx, leds));

            tokio::select! {
                _ = &mut rx_task => rx_task.abort(),
                _ = &mut tx_task => tx_task.abort(),
            };
        })
    })
}

impl From<Color> for [u8; 3] {
    fn from(value: Color) -> Self { [value.red, value.green, value.blue] }
}

async fn rx_handler(mut rx: SplitStream<WebSocket>, leds: LedRepo) {
    loop {
        if let Some(Ok(message)) = rx.next().await {
            match message {
                Message::Binary(bytes) => {
                    if bytes.len() >= 5 {
                        let id = usize::from_be_bytes([0, 0, 0, 0, 0, 0, bytes[0], bytes[1]]);
                        let red = bytes[2];
                        let green = bytes[3];
                        let blue = bytes[4];

                        let _ = leds
                            .set(
                                id,
                                Led {
                                    color: Color { red, green, blue },
                                },
                            )
                            .await;
                    }
                }
                Message::Close(_) => break,
                _ => (),
            }
        }
    }
}

async fn tx_handler(mut tx: SplitSink<WebSocket, Message>, leds: LedRepo) {
    let mut latest_generation = 0;
    loop {
        if latest_generation < leds.generation() {
            let snapshot = leds.snapshot().await;
            let _ = tx
                .send(Message::Binary(
                    snapshot
                        .leds
                        .into_iter()
                        .flat_map(|led| <[u8; 3]>::from(led.color))
                        .collect(),
                ))
                .await;
            latest_generation = snapshot.generation;
        }

        sleep(Duration::from_millis(100)).await;
    }
}
