from settings import settings
from selenium import webdriver


def test_loop_leds():
    """
    Essentially a simple script to have a bot loop through the leds,
    so I can test consistent state.
    """
    driver = webdriver.Chrome()

    try:
        driver.get(settings.WEBSITE_BASE_URL)

        led_count = 150

        led_index = 0

        for i in range(300):
            led_index = i % led_count
            element = driver.find_element(value=f"led-{led_index}")

            (webdriver.ActionChains(driver)
                .move_to_element_with_offset(element, 0, 0)
                .click()
                .perform())
    finally:
        driver.quit()
