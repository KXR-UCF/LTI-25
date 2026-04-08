#pragma once

#include <vector>

// vector of relay pins in order in physical
std::vector<int> relay_pins = {5, 6, 13, 16, 19, 20, 21, 26};

class RelayManager {
public:
    void setup();
    void set_relay(int relay_id, bool state);
};