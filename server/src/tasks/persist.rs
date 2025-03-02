use shuttle_shared_db::SerdeJsonOperator;
use tracing::instrument;

use crate::repo::led::LedRepo;

#[instrument(skip_all)]
pub async fn persist(leds: LedRepo, operator: SerdeJsonOperator) {
    let mut previous_generation = leds.generation();
    loop {
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
        let generation = leds.generation();
        if generation <= previous_generation {
            continue;
        }

        previous_generation = generation;

        let latest_snapshot = leds.snapshot().await;
        match operator
            .write_serialized("snapshot", &latest_snapshot)
            .await
        {
            Ok(_) => {
                tracing::info!("Persisted snapshot");
            }
            Err(err) => {
                tracing::error!("Failed to persist snapshot: {}", err);
            }
        }
    }
}
