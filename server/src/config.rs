use multiple_errors::return_multiple_errors;
use shuttle_runtime::SecretStore;
use tracing_loki::url::Url;

pub struct Config {
    pub stage: &'static str,
    pub grafana_host: Url,
    pub grafana_username: String,
    pub grafana_password: String,
}

#[derive(thiserror::Error, Debug)]
pub enum NewConfigError {
    #[error("Invalid secrets: {0:?}")]
    InvalidSecrets(Vec<SecretStoreObtainError>),
}

impl TryFrom<&SecretStore> for Config {
    type Error = NewConfigError;

    fn try_from(secret_store: &SecretStore) -> Result<Config, Self::Error> {
        return_multiple_errors!(
            let mut errors: Vec<SecretStoreObtainError> = vec![];
            let grafana_host = secret_store.obtain("GRAFANA_HOST");
            let grafana_username = secret_store.obtain("GRAFANA_USERNAME");
            let grafana_password = secret_store.obtain("GRAFANA_PASSWORD");
            if_there_are_errors {
                return Err(NewConfigError::InvalidSecrets(errors));
            }
        );

        let stage = if cfg!(debug_assertions) {
            "dev"
        } else {
            "prod"
        };

        let config = Config {
            stage,
            grafana_host,
            grafana_username,
            grafana_password,
        };

        Ok(config)
    }
}

#[derive(thiserror::Error, Debug)]
pub enum SecretStoreObtainError {
    #[error("Secret {0} is missing")]
    MissingSecret(String),
    #[error("Value for secret {0} is invalid")]
    InvalidSecret(String),
}

trait SecretStoreExt {
    fn obtain<T: for<'a> TryFrom<&'a str>>(&self, key: &str) -> Result<T, SecretStoreObtainError>;
}

impl SecretStoreExt for SecretStore {
    fn obtain<T: for<'a> TryFrom<&'a str>>(&self, key: &str) -> Result<T, SecretStoreObtainError> {
        self.get(key)
            .ok_or(SecretStoreObtainError::MissingSecret(key.to_string()))
            .and_then(|value| {
                T::try_from(value.as_str())
                    .map_err(|_| SecretStoreObtainError::InvalidSecret(key.to_string()))
            })
    }
}
