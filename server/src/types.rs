use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone, Copy, Debug)]
pub struct Color {
    pub red: u8,
    pub green: u8,
    pub blue: u8,
}
