#pragma once

#include "RelayManager.hpp"
#include <cstdint>


class CommandProcessor {
public:
    void process(uint32_t state_data);
};