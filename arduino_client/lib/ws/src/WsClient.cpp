#include "WsClient.h"
#include <base64.hpp>

constexpr const uint8_t SEC_WEBSOCKET_KEY_LENGTH = 16;
constexpr const uint8_t SEC_WEBSOCKET_KEY_BASE64_MAX_LENGTH((SEC_WEBSOCKET_KEY_LENGTH + 2) / 3 * 4);

unsigned int generateSecWebsocketKey(unsigned char (&r_secWebsocketKey)[SEC_WEBSOCKET_KEY_BASE64_MAX_LENGTH + 1]);
void sendOpeningHandshake(WiFiSSLClient& wifiClient, const char* t_host, const char* t_path, const char* secWebsocketKey);

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

bool WsClient::poll()
{
	// If the wifi client is not connected, ensure the state of this client
	// reflects that.
	if (!m_wifiClient.connected()) {
		disconnect();
	}

	switch (m_status) {
	case Status::CONNECTING:
		// Here we are "re-using" m_receivedPayload as a buffer for the initial Upgrade Payload response.
		{
			size_t bytesRead = m_wifiClient.readBytesUntil('\n', m_receivedPayloadData, sizeof(m_receivedPayloadData));
			m_receivedPayloadData[bytesRead] = '\0';
		}

		// We don;t actually care what we get, just as soon as we finish reading all the bloat
		// we assume we are connected.
		if (strcmp((char*)m_receivedPayloadData, "\r") == 0) {
			m_status = Status::WAITING;
		} else {
			break;
		}
	case Status::WAITING:
		// Keepalive
		{
			unsigned long currentMillis = millis();
			if (currentMillis - m_lastPing > 50) {
				ping();
				m_lastPing = currentMillis;
			}
		}

		// Payload header is two bytes, so unless there are two bytes available to read,
		// we don't do anything.
		if (m_wifiClient.available() >= 2) {
			byte header[2];
			m_wifiClient.read(header, 2);

			byte finRsvOpcode = header[0];
			m_receivedPayloadFin = (finRsvOpcode & 0x80) != 0;
			m_receivedPayloadOpcode = (Opcode)(finRsvOpcode & 0x0F);

			byte maskAndLength = header[1];
			m_receivedPayloadMask = (maskAndLength & 0x80) != 0;
			m_receivedPayloadLength = maskAndLength & 0x7F;

			m_status = Status::RECEIVING;
		} else {
			break;
		}
	case Status::RECEIVING:
		// Handle extended length
		// -- If we were good little programemers we would also make sure the opcode lines up... but meh. Let's
		//    just let a 300 byte PONG break things maybe.
		if (m_receivedPayloadLength == 126) {
			if (m_wifiClient.available() >= 2) {
				byte extendedLength[2];
				m_wifiClient.read(extendedLength, sizeof(extendedLength));
				m_receivedPayloadLength = (extendedLength[0] << 8) | extendedLength[1];
			} else {
				break;
			}
		}

		// Read masking key
		if (m_receivedPayloadMask && !m_maskingKeyRead) {
			if (m_wifiClient.available() >= 4) {
				m_wifiClient.read(m_receivedPayloadMaskingKey, 4);
				m_maskingKeyRead = true;
			} else {
				break;
			}
		}

		// Read and potentially unmask payload
		if (m_wifiClient.available() >= m_receivedPayloadLength) {
			m_wifiClient.read(m_receivedPayloadData, m_receivedPayloadLength);
			if (m_receivedPayloadMask) {
				for (int i = 0; i < m_receivedPayloadLength; i++) {
					m_receivedPayloadData[i] ^= m_receivedPayloadMaskingKey[i % 4];
				}
			}

			m_status = Status::WAITING;
			// we do NOT call update() here again, because we want to give the consumer
			// a chance to do something with this payload rather than potentially immediately overwriting it with
			// another payload.

			return true;
		} else {
			break;
		}
	case Status::DISCONNECTED:
		break;
	}

	return false;
}

Payload WsClient::getLatestPayload()
{
	return Payload {
		.opcode = m_receivedPayloadOpcode,
		.data = m_receivedPayloadData,
		.length = m_receivedPayloadLength
	};
}