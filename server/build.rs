use std::{fs, path::Path, process::Command};

fn main() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let workspace_root = root.parent().expect("parent");
    let client_root = workspace_root.join("client");

    let public = root.join("public");
    let build = client_root.join("dist");

    let status = Command::new("pnpm")
        .arg("install")
        .current_dir(&client_root)
        .status()
        .expect("Failed to run pnpm install");

    if !status.success() {
        panic!("pnpm install failed: {status}")
    }

    let status = Command::new("pnpm")
        .arg("build")
        .current_dir(client_root)
        .status()
        .expect("Failed to run pnpm build");

    if !status.success() {
        panic!("pnpm build failed: {status}")
    }

    if public.exists() {
        fs::remove_dir_all(&public).expect("Failed to remove old public directory");
    }

    fs::rename(&build, &public).expect("Faile to copy over build client application");
}
