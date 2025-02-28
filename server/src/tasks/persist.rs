use shuttle_shared_db::SerdeJsonOperator;

use crate::repo::led::LedRepo;

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
                println!("Persisted snapshot");
            }
            Err(err) => {
                eprintln!("Failed to persist snapshot: {}", err);
            }
        }
    }
}
