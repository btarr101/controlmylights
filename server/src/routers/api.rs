use std::{sync::Arc, time::Duration};

use axum::{
    body::Bytes,
    extract::{
        ws::{Message, WebSocket},
        Path, Query, State, WebSocketUpgrade,
    },
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Form, Json, Router,
};
use axum_client_ip::InsecureClientIp;
use axum_thiserror::ErrorStatus;
use futures::{
    stream::{SplitSink, SplitStream},
    SinkExt, StreamExt,
};
use serde::{Deserialize, Serialize};
use serde_inline_default::serde_inline_default;
use tokio::{spawn, sync::Mutex, time::sleep};
use tracing::{error, info, info_span, instrument, Instrument};
use uuid::Uuid;

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
        .fallback(handler_404)
}

async fn handler_404() -> StatusCode { StatusCode::NOT_FOUND }

#[derive(thiserror::Error, Debug, ErrorStatus)]
pub enum LedRouterError {
    #[error("Led with id {0} does not exist")]
    #[status(StatusCode::NOT_FOUND)]
    NotFound(usize),
}

async fn get_led(
    State(leds): State<LedRepo>,
    Path(id): Path<usize>,
) -> Result<Json<Led>, LedRouterError> {
    let led = leds.get(id).await.ok_or(LedRouterError::NotFound(id))?;

    Ok(Json(led))
}

#[derive(Serialize)]
struct WithId<T: Serialize> {
    id: usize,
    #[serde(flatten)]
    inner: T,
}

impl<T: Serialize> WithId<T> {
    fn new(id: usize, inner: T) -> Self { Self { id, inner } }
}

async fn get_leds(State(leds): State<LedRepo>) -> Json<Vec<WithId<Led>>> {
    Json(
        leds.snapshot()
            .await
            .leds
            .into_iter()
            .enumerate()
            .map(|(id, led)| WithId::new(id, led))
            .collect(),
    )
}

async fn post_led(
    State(leds): State<LedRepo>,
    Path(id): Path<usize>,
    Form(color): Form<Color>,
) -> Result<Json<Led>, LedRouterError> {
    let led = leds.set(id, color).await.map_err(|err| match err {
        LedRepoError::OutOfBounds(id) => LedRouterError::NotFound(id),
    })?;

    Ok(Json(led))
}

#[serde_inline_default]
#[derive(Deserialize)]
struct WsParams {
    #[serde_inline_default(false)]
    colors_only: bool,
    #[serde_inline_default(100)]
    snapshot_interval: u64,
}

async fn get_ws(
    State(leds): State<LedRepo>,
    Query(WsParams {
        colors_only,
        snapshot_interval,
    }): Query<WsParams>,
    InsecureClientIp(ip): InsecureClientIp,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    let ws_client_id = Uuid::new_v4();
    let snapshot_interval = snapshot_interval.max(100);

    ws.on_upgrade(move |ws| {
        Box::pin(async move {
            let rx_span = info_span!(
                "rx",
                ws_client_id = ws_client_id.to_string(),
                ip = ip.to_string(),
            );

            let tx_span = info_span!(
                "tx",
                ws_client_id = ws_client_id.to_string(),
                ip = ip.to_string(),
                colors_only = colors_only
            );

            let (tx, rx) = ws.split();
            let tx = Arc::new(Mutex::new(tx));
            let mut rx_task = spawn(rx_handler(rx, tx.clone(), leds.clone()).instrument(rx_span));
            let mut tx_task =
                spawn(tx_handler(tx, leds, colors_only, snapshot_interval).instrument(tx_span));

            tokio::select! {
                _ = &mut rx_task => tx_task.abort(),
                _ = &mut tx_task => rx_task.abort(),
            };
        })
    })
}

impl From<Color> for [u8; 3] {
    fn from(value: Color) -> Self { [value.red, value.green, value.blue] }
}

impl From<Led> for [u8; 11] {
    fn from(value: Led) -> Self {
        let color: [u8; 3] = value.color.into();
        let last_updated = value.last_updated.timestamp().to_be_bytes();

        [
            color[0],
            color[1],
            color[2],
            last_updated[0],
            last_updated[1],
            last_updated[2],
            last_updated[3],
            last_updated[4],
            last_updated[5],
            last_updated[6],
            last_updated[7],
        ]
    }
}

async fn rx_handler(
    mut rx: SplitStream<WebSocket>,
    tx: Arc<Mutex<SplitSink<WebSocket, Message>>>,
    leds: LedRepo,
) {
    loop {
        match rx.next().await {
            Some(Ok(message)) => {
                let handle_message_result = handle_message(message, leds.clone()).await;

                // Purely for satiating react-use-websocket
                if handle_message_result.send_pong {
                    let mut tx = tx.lock().await;
                    let _ = tx.send(Message::Text("pong".into())).await;
                }

                if handle_message_result.close_handler {
                    break;
                }
            }
            Some(Err(err)) => {
                error!(
                    "Error when receiving message: {}. Closing connection...",
                    err
                );
                break;
            }
            None => {
                error!("Connection closed unexpectedly");
                break;
            }
        }
    }

    info!("Connection closed");
}

#[derive(Debug)]
struct HandleMessageResult {
    close_handler: bool,
    send_pong: bool,
}

#[instrument(skip(leds), ret)]
async fn handle_message(message: Message, leds: LedRepo) -> HandleMessageResult {
    let mut close_handler = false;
    let mut send_pong = false;

    match message {
        Message::Binary(bytes) => {
            if bytes.len() >= 5 {
                let id = usize::from_be_bytes([0, 0, 0, 0, 0, 0, bytes[0], bytes[1]]);
                let red = bytes[2];
                let green = bytes[3];
                let blue = bytes[4];

                let _ = leds.set(id, Color { red, green, blue }).await;
            }
        }
        Message::Text(utf8) => {
            let text = utf8.to_string();
            if text == "ping" {
                send_pong = true;
            }
        }
        Message::Close(_) => {
            close_handler = true;
        }
        _ => (),
    };

    HandleMessageResult {
        close_handler,
        send_pong,
    }
}

async fn tx_handler(
    tx: Arc<Mutex<SplitSink<WebSocket, Message>>>,
    leds: LedRepo,
    colors_only: bool,
    snapshot_interval: u64,
) {
    let mut latest_generation = 0;
    loop {
        if latest_generation < leds.generation() {
            let mut tx = tx.lock().await;
            latest_generation = send_snapshot(&mut tx, &leds, colors_only).await.generation;
            info!("Sent snapshot");
        }

        sleep(Duration::from_millis(snapshot_interval)).await;
    }
}

#[derive(Debug)]
struct SendSnapshotResult {
    generation: usize,
}

async fn send_snapshot(
    tx: &mut SplitSink<WebSocket, Message>,
    leds: &LedRepo,
    colors_only: bool,
) -> SendSnapshotResult {
    let snapshot = leds.snapshot().await;
    let leds = snapshot.leds.into_iter();
    let bytes: Bytes = if colors_only {
        leds.flat_map(|led| <[u8; 3]>::from(led.color)).collect()
    } else {
        leds.flat_map(<[u8; 11]>::from).collect()
    };
    let _ = tx.send(Message::Binary(bytes)).await;

    SendSnapshotResult {
        generation: snapshot.generation,
    }
}
