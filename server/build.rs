use std::{fs, path::Path, process::Command};

fn main() {
    if let Err(err) = build_client_app() {
        cargo_emit::warning!("Client app build failed: {}", err);
    }
}

fn build_client_app() -> anyhow::Result<()> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let workspace_root = root.parent().expect("parent");
    let client_root = workspace_root.join("client");

    cargo_emit::rerun_if_changed!(client_root.to_string_lossy());

    let public = root.join("public");
    let build = client_root.join("dist");

    let status = Command::new("pnpm")
        .arg("install")
        .current_dir(&client_root)
        .status()?;

    if !status.success() {
        anyhow::bail!("pnpm install failed: {status}")
    }

    let status = Command::new("pnpm")
        .arg("build")
        .current_dir(client_root)
        .env("VITE_API_BASE_URL", "/api")
        .status()?;

    if !status.success() {
        panic!("pnpm build failed: {status}")
    }

    if public.exists() {
        fs::remove_dir_all(&public)?;
    }

    fs::rename(&build, &public)?;

    Ok(())
}
