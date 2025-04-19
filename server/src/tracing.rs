use std::collections::HashMap;

use opentelemetry::{trace::TracerProvider, KeyValue};
use opentelemetry_otlp::{WithExportConfig, WithHttpConfig};
use tracing::level_filters::LevelFilter;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub struct TracingConfig<'a> {
    pub service_name: &'a str,
    pub stage: &'a str,
    pub otlp_endpoint: Option<&'a str>,
    pub otlp_authorization_header: Option<&'a str>,
}

pub fn setup_tracing(
    TracingConfig {
        service_name,
        stage,
        otlp_endpoint,
        otlp_authorization_header,
    }: TracingConfig,
) -> Result<(), anyhow::Error> {
    let filter = EnvFilter::builder()
        .with_default_directive(LevelFilter::INFO.into())
        .from_env_lossy();

    let registry = tracing_subscriber::registry()
        .with(filter)
        .with(tracing_subscriber::fmt::Layer::new().without_time());

    if let Some(otlp_endpoint) = otlp_endpoint {
        let resource = opentelemetry_sdk::Resource::builder()
            .with_service_name(service_name.to_string())
            .with_attribute(KeyValue::new("stage", stage.to_string()))
            .build();

        let mut headers = HashMap::new();
        if let Some(otlp_authorization_header) = otlp_authorization_header {
            headers.insert(
                "Authorization".to_string(),
                otlp_authorization_header.to_string(),
            );
        };

        let log_exporter = opentelemetry_otlp::LogExporter::builder()
            .with_http()
            .with_endpoint(format!("{}/v1/logs", otlp_endpoint))
            .with_headers(headers.clone())
            .build()?;
        let log_provider = opentelemetry_sdk::logs::SdkLoggerProvider::builder()
            .with_batch_exporter(log_exporter)
            .with_resource(resource.clone())
            .build();

        let span_exporter = opentelemetry_otlp::SpanExporter::builder()
            .with_http()
            .with_endpoint(format!("{}/v1/traces", otlp_endpoint))
            .with_headers(headers)
            .build()?;
        let span_provider = opentelemetry_sdk::trace::SdkTracerProvider::builder()
            .with_batch_exporter(span_exporter)
            .with_resource(resource)
            .build();
        let tracer = span_provider.tracer("controlmylights");

        registry
            .with(tracing_opentelemetry::layer().with_tracer(tracer))
            .with(
                opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge::new(
                    &log_provider,
                ),
            )
            .init();

        tracing::info!(
            "OpenTelemetry initialized with OTLP endpoint: {}",
            otlp_endpoint
        );

        if otlp_authorization_header.is_none() {
            tracing::warn!(
                "OTLP authorization header not provided, no authorization will be included when sending OTLP requests"
            );
        }
    } else {
        registry.init();
        tracing::warn!("OTLP endpoint not provided, OpenTelemetry will be disabled");
    };

    Ok(())
}
