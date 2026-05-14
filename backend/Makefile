VERSION ?= 1.0.0
GOARCH ?= $(shell go env GOARCH)
GOOS ?= $(shell go env GOOS)
LD_FLAGS := -ldflags "-X main.Version=$(VERSION) -w -s"

# Build for current system
build-local:
	@mkdir -p bin
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build $(LD_FLAGS) -o bin/main ./cmd/main.go

build-prod:
	@mkdir -p bin
	CGO_ENABLED=1 GOOS=linux GOARCH=arm64 go build $(LD_FLAGS) -o bin/main-linux-arm64 ./cmd/main.go

init:
	go mod tidy

clean:
	rm -rf ./bin/* 

deploy:
	docker build -t rust-code-sandbox -f ./rust-dockerfile .
	make clean && make build-prod
