# Compiler settings
CXX = g++
CXXFLAGS = -Iinclude -Wall -O2
# LDFLAGS = -llgpio

# Folders
SRC_DIR = src
BIN_DIR = bin

# Files
SOURCES = $(wildcard $(SRC_DIR)/*.cpp)
TARGET = $(BIN_DIR)/main.exe

# Default rule: create bin folder and build
all: $(TARGET)

$(TARGET): $(SOURCES)
	mkdir -p $(BIN_DIR)
	$(CXX) $(CXXFLAGS) $(SOURCES) -o $(TARGET) $(LDFLAGS)

clean:
	rm -rf $(BIN_DIR)