APP=kantan
BIN_DIR=bin

LINUX_X86_64=x86_64-unknown-linux-gnu
LINUX_ARM64=aarch64-unknown-linux-gnu
MACOS_INTEL=x86_64-apple-darwin
MACOS_ARM64=aarch64-apple-darwin

build:
	cargo build

build-linux-x86:
	cargo zigbuild --target $(LINUX_X86_64) --release
	mkdir -p $(BIN_DIR)
	cp target/$(LINUX_X86_64)/release/$(APP) \
		$(BIN_DIR)/$(APP)-linux-x86_64

build-linux-arm:
	cargo zigbuild --target $(LINUX_ARM64) --release
	mkdir -p $(BIN_DIR)
	cp target/$(LINUX_ARM64)/release/$(APP) \
		$(BIN_DIR)/$(APP)-linux-arm64

build-macos-intel:
	cargo build --release --target $(MACOS_INTEL)
	mkdir -p $(BIN_DIR)
	cp target/$(MACOS_INTEL)/release/$(APP) \
		$(BIN_DIR)/$(APP)-macos-intel

build-macos-arm:
	cargo build --release --target $(MACOS_ARM64)
	mkdir -p $(BIN_DIR)
	cp target/$(MACOS_ARM64)/release/$(APP) \
		$(BIN_DIR)/$(APP)-macos-arm64

build-all: \
	build-linux-x86 \
	build-linux-arm \
	build-macos-intel \
	build-macos-arm

clean:
	cargo clean
	rm -rf $(BIN_DIR)

run_local:
	cargo run example.kn
