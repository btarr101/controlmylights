#pragma once
#include <WiFiS3.h>

enum Opcode {
	CONTINUATION = 0x0,
	TEXT = 0x1,
	BINARY = 0x2,
	CLOSE = 0x8,
	PING = 0x9,
	PONG = 0xA
};

struct Payload {
	Opcode opcode;
	byte* bytes;
	size_t length;
};

class WsClient {
public:
	WsClient();
	void connect(const char* t_host, uint16_t t_port, const char* t_path);
	void disconnect();

	enum Status {
		DISCONNECTED,
		CONNECTING,
		WAITING,
		RECEIVING
	};

	Status getStatus();
	bool getConnected();

	/// @brief Sends a websocket payload with a max size of 124.
	/// @param t_opcode Frame opcode
	/// @param t_bytes Buffer of bytes to send.
	/// @param t_length Length of bytes (no more than 124)
	/// @return Number of bytes sent in total (including frame header)
	size_t send(Opcode t_opcode, const byte* t_bytes, uint8_t t_length);

	/// @brief Sends a ping frame.
	/// @return If the frame was sent successfully.
	bool ping();

	bool update(); // TODO

	Payload getLatestPayload(); // TODO

private:
	WiFiSSLClient m_wifiClient;
	Status m_status = Status::DISCONNECTED;
};
