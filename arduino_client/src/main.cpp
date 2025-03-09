#include <Arduino.h>
#include <WsClient.h>

#include "logging.h"
#include <ArduinoLog.h>

// http://0.0.0.0:8000
constexpr const char* WS_HOST = "192.168.1.47";
constexpr const int WS_PORT = 8000;
constexpr const char* WS_PATH = "/api/leds/ws?colors_only=true&snapshot_interval=250";

WsClient wsClient;

void safeBoot();
void setupWifi();

void setup()
{
	Serial.begin(115200);
	while (!Serial && !Serial.available()) { }

	setupLogging();
	safeBoot();
	setupWifi();
}

void loop()
{
	while (wsClient.getStatus() == WsClient::Status::DISCONNECTED) {
		delay(1000);
		wsClient.connect(WS_HOST, WS_PORT, WS_PATH);
	}

	bool receivedPayload = wsClient.poll();
	if (receivedPayload) {
		Payload payload = wsClient.getLatestPayload();
		Log.infoln("Received payload (opcode=%d, length=%d)", payload.opcode, payload.length);
	}
}

void safeBoot()
{
	for (uint8_t t = 4; t > 0; t--) {
		Log.infoln("[SETUP] Boot Wait (%d)", t);
		delay(1000);
	}
}

void setupWifi()
{
	// check for the WiFi module:
	if (WiFi.status() == WL_NO_MODULE) {
		Log.errorln("[WiFi] Communication with WiFi module failed!");
		// don't continue
		while (true) { }
	}

	wl_status_t wifiStatus = wl_status_t::WL_IDLE_STATUS;
	while (wifiStatus != WL_CONNECTED) {
		Log.infoln("[WiFi] Attempting to connect to '%s'", WIFI_SSID);

		// Connect to WPA/WPA2 network. Change this line if using open or WEP network:
		wifiStatus = (wl_status_t)WiFi.begin(WIFI_SSID, WIFI_PASS);

		delay(500);
	}

	IPAddress ip = WiFi.localIP();
	Log.infoln("[WiFi] Connected! (ip='%p')", ip);
}
