#include <Arduino.h>
#include <WsClient.h>

constexpr const char* WS_HOST = "arduino-place-server-lrpx.shuttle.app";
constexpr const int WS_PORT = 443;
constexpr const char* WS_PATH = "/ws";

WsClient wsClient;

void setupWifi();

void setup()
{
	Serial.begin(115200);
	Serial.println("STARTING!!!");
	setupWifi();
}

void loop()
{
	if (!wsClient.getConnected()) {
		wsClient.connect(WS_HOST, WS_PORT, WS_PATH);
	}

	bool receivedPayload = wsClient.poll();
	if (receivedPayload) {
		Payload payload = wsClient.getLatestPayload();
		Serial.print("Got payload!: ");
		Serial.println(payload.opcode);
	}
}

void setupWifi()
{
	// check for the WiFi module:
	if (WiFi.status() == WL_NO_MODULE) {
		Serial.print("[Wifi]: Communication with WiFi module failed!");
		// don't continue
		while (true) { }
	}

	wl_status_t wifiStatus = wl_status_t::WL_IDLE_STATUS;
	while (wifiStatus != WL_CONNECTED) {
		Serial.print("[Wifi]: Attempting to connect to SSID: ");
		Serial.print(WIFI_SSID);

		// Connect to WPA/WPA2 network. Change this line if using open or WEP network:
		wifiStatus = (wl_status_t)WiFi.begin(WIFI_SSID, WIFI_PASS);

		delay(1000);
	}

	Serial.println("[Wifi]: Connected!");

	IPAddress ip = WiFi.localIP();
	Serial.print("[Wifi]: IP Address: ");
	Serial.println(ip);
}
