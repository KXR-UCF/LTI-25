#include <iostream>
#include "WorkerClient.hpp"
#include "CommandProcessor.hpp"
#include <unistd.h>

#define UDP_TIMEOUT_MS 1000

char hostname[_SC_HOST_NAME_MAX + 1];

int main() {
    if (gethostname(hostname, _SC_HOST_NAME_MAX + 1) == -1) {
        perror("gethostname");
        exit(EXIT_FAILURE);
    }
    std::cout << "Hostname: " << hostname << std::endl;

    WorkerClient worker_client = WorkerClient();
    CommandProcessor processor = CommandProcessor();
    
    // std::cout << "Waiting for state broadcast..." << std::endl;
    
    while (true) {
        uint32_t state_data;
        if (worker_client.receive(state_data)) {
            processor.process(state_data);
        } else {
            std::cout << "TIMEDOUT" << std::endl;
        }
    }

    return 0;
}
