use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};

use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::types::Color;

#[derive(Clone, Copy, Serialize, Deserialize)]
pub struct Led {
    pub color: Color,
}

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
        Self(Arc::new(LedRepoInner {
            generation: 0.into(),
            leds: RwLock::new(
                initial_colors
                    .into_iter()
                    .map(|color| Led { color })
                    .collect(),
            ),
        }))
    }

    pub async fn get(&self, id: usize) -> Option<Led> { self.0.leds.read().await.get(id).cloned() }

    pub async fn set(&self, id: usize, led: Led) -> Result<(), LedRepoError> {
        let mut lock = self.0.leds.write().await;
        let current_led = lock.get_mut(id).ok_or(LedRepoError::OutOfBounds(id))?;

        *current_led = led;

        self.0.generation.fetch_add(1, Ordering::AcqRel);

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
