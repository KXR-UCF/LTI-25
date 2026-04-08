#include "RelayManager.hpp"

#include <iostream>

void RelayManager::setup() {
    std::cout << "[TEST] Setup Relays!]" << std::endl;
}

void RelayManager::set_relay(int relay_id, bool state) {
    std::cout << "[TEST] Set Relay " << relay_id << " to " << state << "!" << std::endl;
}