#include "WsClient.h"
#include <base64.hpp>

constexpr uint8_t SEC_WEBSOCKET_KEY_LENGTH = 16;
constexpr uint8_t SEC_WEBSOCKET_KEY_BASE64_MAX_LENGTH((SEC_WEBSOCKET_KEY_LENGTH + 2) / 3 * 4);

WsClient::WsClient()
{
}

void WsClient::connect(const char* t_host, uint16_t t_port, const char* t_path = "/")
{
	disconnect();

	if (!m_wifiClient.connect(t_host, t_port)) {
		return;
	}

	unsigned char secWebsocketKey[SEC_WEBSOCKET_KEY_BASE64_MAX_LENGTH + 1]; // +1 for null terminator
	generateSecWebsocketKey(secWebsocketKey);

	sendOpeningHandshake(m_wifiClient, t_host, t_path, (char*)secWebsocketKey);
	m_status = Status::CONNECTING;
}

void WsClient::disconnect()
{
	m_wifiClient.stop();
	m_status = Status::DISCONNECTED;
}

unsigned int generateSecWebsocketKey(unsigned char (&r_secWebsocketKey)[SEC_WEBSOCKET_KEY_BASE64_MAX_LENGTH + 1])
{
	unsigned char randomBytes[SEC_WEBSOCKET_KEY_LENGTH];
	for (size_t i = 0; i < SEC_WEBSOCKET_KEY_LENGTH; ++i) {
		randomBytes[i] = random(0, 256);
	}

	return encode_base64(randomBytes, SEC_WEBSOCKET_KEY_LENGTH, r_secWebsocketKey);
}

void sendOpeningHandshake(WiFiSSLClient& wifiClient, const char* t_host, const char* t_path, const char* secWebsocketKey)
{
	wifiClient.print("GET ");
	wifiClient.print(t_path);
	wifiClient.println(" HTTP/1.1");

	wifiClient.print("Host: ");
	wifiClient.println(t_host);

	wifiClient.println("Upgrade: websocket");
	wifiClient.println("Connection: Upgrade");
	wifiClient.print("Sec-WebSocket-Key: ");
	wifiClient.println(secWebsocketKey);
	wifiClient.println("Sec-WebSocket-Version: 13");
	wifiClient.println();
}

WsClient::Status WsClient::getStatus()
{
	return m_status;
}

bool WsClient::getConnected()
{
	switch (getStatus()) {
	case DISCONNECTED:
	case CONNECTING:
		return false;
	case WAITING:
	case RECEIVING:
		return true;
	}
}

size_t WsClient::send(Opcode t_opcode, const byte* t_bytes, uint8_t t_length)
{
	if (!getConnected()) {
		return 0;
	}

	// 2 byte header + 4 byte masking key + payload (max payload size wo/ extension)
	//
	// If the length is > 125, we kinda just uh-oh. But not expecting anything w/
	// length > 125 to be sent, so ignoring this case for now.
	byte frame[2 + 4 + 125];

	// (FIN = 1) + Opcode
	frame[0] = (byte)0x80 | t_opcode;

	// Mask = 1
	frame[1] = (byte)0x80 | (byte)t_length;

	// Masking key
	frame[2] = random(0, 256);
	frame[3] = random(0, 256);
	frame[4] = random(0, 256);
	frame[5] = random(0, 256);

	//  Write the masked payload
	for (uint8_t i = 0; i < t_length; ++i) {
		frame[6 + i] = t_bytes[i] ^ frame[2 + (i % 4)];
	}

	// 6 bc/ 1 byte FIN + OPCODE, 1 byte mask and length, 4 bytes masking key
	return m_wifiClient.write(frame, 6 + t_length);
}

bool WsClient::ping()
{
	return send(Opcode::PING, nullptr, 0) > 0;
}
