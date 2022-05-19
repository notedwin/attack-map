#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail
set -o xtrace

readonly TARGET_HOST=ubuntu@192.168.0.106
readonly TARGET_PATH=/home/ubuntu/
readonly TARGET_ARCH=aarch64-unknown-linux-musl

readonly LOG_PATH=./target/${TARGET_ARCH}/release/log_ingestion
readonly WEB_PATH=./target/${TARGET_ARCH}/release/web-server

export CC_aarch64_unknown_linux_musl=clang
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_MUSL_RUSTFLAGS="-Clink-self-contained=yes -Clinker=rust-lld"

echo "Starting script..."
# print out starting script
cargo build --release --target=${TARGET_ARCH}

rsync ${LOG_PATH} ${TARGET_HOST}:${TARGET_PATH}
rsync ${WEB_PATH} ${TARGET_HOST}:${TARGET_PATH}
rsync -r ./static/ ${TARGET_HOST}:${TARGET_PATH}/static
rsync -r ./templates/ ${TARGET_HOST}:${TARGET_PATH}/templates