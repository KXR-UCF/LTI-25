
#pragma once

#include <iostream>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <cstdint>
// #include <arpa/inet.h>
// #include <sys/time.h>

#define UDP_TIMEOUT_MS 1000

class WorkerClient {
private:
    int socket_fd;

public:
    WorkerClient();
    ~WorkerClient();
    int init_socket();
    bool receive(uint32_t& recieved_state);
    void cleanup();
};