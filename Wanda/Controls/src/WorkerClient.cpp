#include "WorkerClient.hpp"

WorkerClient::WorkerClient() : socket_fd(-1) {
    init_socket();
}

WorkerClient::~WorkerClient() {
    cleanup();
}

int WorkerClient::init_socket() {
    // setup socket file descriptor
    socket_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (socket_fd == -1) {
        std::cerr << "Failed to create UDP Socket" << std::endl;
        exit(EXIT_FAILURE);
    } else {
        std::cout << "UDP Socket created successfully" << std::endl;
    }

    // setup socket client address info
    struct sockaddr_in client_addr;
    client_addr.sin_family = AF_INET;
    client_addr.sin_port = htons(9600);
    client_addr.sin_addr.s_addr = htonl(INADDR_ANY);

    // bind socket to client address
    if (bind(socket_fd, (struct sockaddr*)&client_addr, sizeof(client_addr)) < 0) {
        std::cerr << "Failed to bind UDP Socket" << std::endl;
        exit(EXIT_FAILURE);
    } else {
        std::cout << "UDP Socket bound successfully" << std::endl;
    }

    // set socket timeout
    struct timeval timeout;
    timeout.tv_sec = UDP_TIMEOUT_MS / 1000;
    timeout.tv_usec = (UDP_TIMEOUT_MS % 1000) * 1000;
    if (setsockopt(socket_fd, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout)) < 0) {
        std::cerr << "Failed to set socket timeout" << std::endl;
        exit(EXIT_FAILURE);
    }

    return socket_fd;
}

bool WorkerClient::receive(uint32_t& recieved_state) {
    uint32_t received_data;

    struct sockaddr_in server_addr;
    socklen_t addr_len = sizeof(server_addr);

    int bytes_received = recvfrom(socket_fd,                        // socket to recieve from
                                    &received_data,                        // pointer to place to store recieved data
                                    sizeof(received_data),                 // size of buffer
                                    0,                                // flag to make nonblocking
                                    (struct sockaddr*)&server_addr,   // the teensy ip and port
                                    &addr_len                         // the teensy ip and port length
                                    ); 
                                        
    if (bytes_received < 0) {
        return false; // MSG_DONTWAIT throws an error when no data is ready
    } else {
        recieved_state = ntohl(received_data);
        return true;
    }
}

void WorkerClient::cleanup() {
    if (socket_fd != -1) {
        close(socket_fd);
        socket_fd = -1;
    }
}