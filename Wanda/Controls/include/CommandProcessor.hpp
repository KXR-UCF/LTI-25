#pragma once

#include <map>
#include <string>
#include <functional>
#include <vector>
#include <atomic>

#include "RelayManager.hpp"

using OverrideFunc = std::function<void(RelayManager&, std::atomic<bool>&)>;

class CommandProcessor {
private:
    std::map<std::string, OverrideFunc> overrides;

    std::atomic<bool> sequence_running{false};
    std::atomic<bool> abort_signal{false};

    void execute_override(const std::string& name, RelayManager& relay_manager);

public:
    void process(uint32_t state_data);

    void register_override(std::string name, OverrideFunc func);

    void request_abort();
    void clear_abort();
};