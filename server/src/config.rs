use std::{env, path::PathBuf};

use multiple_errors::return_multiple_errors;

#[derive(Debug)]
pub struct Config {
    pub service_name: &'static str,
    pub bind_address: String,
    pub public_dir: PathBuf,
    pub stage: &'static str,
    pub otlp_endpoint: String,
    pub otlp_username: String,
    pub otlp_password: String,
    pub ipinfo_token: String,
}

#[derive(thiserror::Error, Debug)]
pub enum NewConfigError {
    #[error("Invalid secrets: {0:?}")]
    InvalidVars(Vec<VarError>),
}

#[derive(thiserror::Error, Debug)]
pub enum VarError {
    #[error("Env var {0} is missing")]
    Missing(String),
    #[error("Value for env var {0} is invalid")]
    Invalid(String),
}

impl Config {
    pub fn new_from_env() -> Result<Self, NewConfigError> {
        return_multiple_errors!(
            let mut errors: Vec<VarError> = vec![];
            let otlp_endpoint = obtain_from_env("OTLP_ENDPOINT");
            let otlp_username = obtain_from_env("OTLP_USERNAME");
            let otlp_password = obtain_from_env("OTLP_PASSWORD");
            let ipinfo_token = obtain_from_env("IPINFO_TOKEN");
            if_there_are_errors {
                return Err(NewConfigError::InvalidVars(errors));
            }
        );

        let bind_address = obtain_from_env("ADDRESS").unwrap_or("127.0.0.1:3000".to_string());
        let public_dir = obtain_from_env("PUBLIC_DIR")
            .unwrap_or(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("public"));

        let service_name = env!("CARGO_CRATE_NAME");

        let stage = if cfg!(debug_assertions) {
            "dev"
        } else {
            "prod"
        };

        let config = Config {
            service_name,
            bind_address,
            public_dir,
            stage,
            otlp_endpoint,
            otlp_username,
            otlp_password,
            ipinfo_token,
        };

        Ok(config)
    }
}

fn obtain_from_env<T: for<'a> TryFrom<&'a str>>(key: &str) -> Result<T, VarError> {
    env::var(key)
        .map_err(|err| match err {
            env::VarError::NotPresent => VarError::Missing(key.to_string()),
            env::VarError::NotUnicode(_) => VarError::Invalid(key.to_string()),
        })
        .and_then(|value| {
            T::try_from(value.as_str()).map_err(|_| VarError::Invalid(key.to_string()))
        })
}
