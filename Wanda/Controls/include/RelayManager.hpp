#pragma once

class RelayManager {
public:
    void setup();
    void set_relay(int relay_id, bool state);
};