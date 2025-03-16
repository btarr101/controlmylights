use axum::response::IntoResponse;
use rand::random;

const LIGHT_BULB_SVG_TEMPLATE: &str = include_str!("light-bulb-template.svg");

pub async fn get_randomly_generated_light_bulb_svg() -> impl IntoResponse {
    let red = random::<u8>();
    let green = random::<u8>();
    let blue = random::<u8>();

    let hex_color = format!("#{:02x}{:02x}{:02x}", red, green, blue);

    (
        [
            ("content-type", "image/svg+xml"),
            (
                "cache-control",
                "no-store, no-cache, must-revalidate, proxy-revalidate",
            ),
        ],
        LIGHT_BULB_SVG_TEMPLATE.replace("#FFFFFF", &hex_color),
    )
}
