use std::collections::HashMap;

use base64::{prelude::BASE64_STANDARD, Engine};
use opentelemetry::{trace::TracerProvider, KeyValue};
use opentelemetry_otlp::{HasExportConfig, WithExportConfig, WithHttpConfig};
use tracing::level_filters::LevelFilter;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub struct TracingConfig<'a> {
    pub service_name: &'static str,
    pub stage: &'static str,
    pub otlp_endpoint: &'a str,
    pub otlp_username: &'a str,
    pub otlp_password: &'a str,
}

pub fn setup_tracing(
    TracingConfig {
        service_name,
        stage,
        otlp_endpoint,
        otlp_username,
        otlp_password,
    }: TracingConfig,
) -> Result<(), shuttle_runtime::CustomError> {
    let resource = opentelemetry_sdk::Resource::builder()
        .with_service_name(service_name)
        .with_attribute(KeyValue::new("stage", stage))
        .build();

    let basic_credentials =
        BASE64_STANDARD.encode(format!("{otlp_username}:{otlp_password}").as_bytes());
    let authorization_headers = HashMap::from([(
        "Authorization".to_string(),
        format!("Basic {}", basic_credentials),
    )]);

    let log_exporter = opentelemetry_otlp::LogExporter::builder()
        .with_http()
        .with_endpoint(format!("{}/v1/logs", otlp_endpoint))
        .with_headers(authorization_headers.clone())
        .build()?;
    let log_provider = opentelemetry_sdk::logs::SdkLoggerProvider::builder()
        .with_batch_exporter(log_exporter)
        .with_resource(resource.clone())
        .build();

    let span_exporter = opentelemetry_otlp::SpanExporter::builder()
        .with_http()
        .with_endpoint(format!("{}/v1/traces", otlp_endpoint))
        .with_headers(authorization_headers)
        .build()?;
    let span_provider = opentelemetry_sdk::trace::SdkTracerProvider::builder()
        .with_batch_exporter(span_exporter)
        .with_resource(resource)
        .build();
    let tracer = span_provider.tracer("controlmylights");

    let filter = EnvFilter::builder()
        .with_default_directive(LevelFilter::INFO.into())
        .from_env_lossy();

    tracing_subscriber::registry()
        .with(filter)
        .with(tracing_opentelemetry::layer().with_tracer(tracer))
        .with(opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge::new(&log_provider))
        .with(tracing_subscriber::fmt::Layer::new().without_time())
        .init();

    Ok(())
}
