use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use tracing::{instrument, Level};

use crate::types::Color;

#[derive(Clone, Copy, Serialize, Deserialize)]
pub struct Led {
    pub color: Color,
    pub last_updated: DateTime<Utc>,
}

#[derive(Serialize, Deserialize)]
pub struct LedRepoSnapshot {
    pub generation: usize,
    pub leds: Vec<Led>,
}

#[derive(Clone)]
pub struct LedRepo(Arc<LedRepoInner>);

pub struct LedRepoInner {
    generation: AtomicUsize,
    leds: RwLock<Vec<Led>>,
}

#[derive(thiserror::Error, Debug)]
pub enum LedRepoError {
    #[error("Id {0} is out of bounds")]
    OutOfBounds(usize),
}

impl LedRepo {
    pub fn new(initial_colors: impl IntoIterator<Item = Color>) -> Self {
        let now = Utc::now();

        Self(Arc::new(LedRepoInner {
            generation: 0.into(),
            leds: RwLock::new(
                initial_colors
                    .into_iter()
                    .map(|color| Led {
                        color,
                        last_updated: now,
                    })
                    .collect(),
            ),
        }))
    }

    pub async fn get(&self, id: usize) -> Option<Led> { self.0.leds.read().await.get(id).cloned() }

    #[instrument(skip(self), level=Level::TRACE)]
    pub async fn set(&self, id: usize, color: Color) -> Result<(), LedRepoError> {
        let mut lock = self.0.leds.write().await;
        let current_led = lock.get_mut(id).ok_or(LedRepoError::OutOfBounds(id))?;

        current_led.color = color;
        current_led.last_updated = Utc::now();

        let previous_generation = self.0.generation.fetch_add(1, Ordering::AcqRel);

        tracing::trace!("Led updated (previous generation was {previous_generation})!");

        Ok(())
    }

    pub fn generation(&self) -> usize { self.0.generation.load(Ordering::Acquire) }

    pub async fn snapshot(&self) -> LedRepoSnapshot {
        LedRepoSnapshot {
            generation: self.generation(),
            leds: self.0.leds.read().await.clone(),
        }
    }
}

impl From<LedRepoSnapshot> for LedRepo {
    fn from(value: LedRepoSnapshot) -> Self {
        let generation = value.generation;
        let leds = value.leds;

        Self(Arc::new(LedRepoInner {
            generation: generation.into(),
            leds: RwLock::new(leds),
        }))
    }
}
