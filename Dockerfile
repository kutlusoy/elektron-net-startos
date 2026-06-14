FROM debian:stable-slim AS builder
WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake git pkg-config python3 \
    libboost-all-dev libssl-dev libevent-dev libzmq3-dev \
    libsqlite3-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/kutlusoy/elektron-net.git /elektron
WORKDIR /elektron
RUN cmake -B build \
        -DBUILD_GUI=OFF \
        -DBUILD_TESTS=OFF \
        -DBUILD_BENCH=OFF \
        -DBUILD_FUZZ_BINARY=OFF \
        -DENABLE_IPC=OFF \
        -DWITH_ZMQ=ON \
        -DBUILD_TX=ON \
        -DBUILD_UTIL=ON \
        -DBUILD_WALLET_TOOL=ON \
        -DINSTALL_MAN=OFF && \
    cmake --build build -j$(nproc) && \
    cmake --install build

FROM debian:stable-slim
ENV ELEKTRON_DATA=/root/.elektron
ENV ELEKTRON_PREFIX=/opt/elektron
ENV PATH=${ELEKTRON_PREFIX}/bin:$PATH

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl jq tini e2fsprogs \
    libboost-filesystem1.83.0 \
    libboost-thread1.83.0 \
    libboost-system1.83.0 \
    libevent-core-2.1-7 \
    libevent-pthreads-2.1-7 \
    libzmq5 \
    libsqlite3-0 && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p ${ELEKTRON_PREFIX}/bin
COPY --from=builder /usr/local/bin/elektrond ${ELEKTRON_PREFIX}/bin/elektrond
COPY --from=builder /usr/local/bin/elektron-cli ${ELEKTRON_PREFIX}/bin/elektron-cli
COPY --from=builder /usr/local/bin/elektron ${ELEKTRON_PREFIX}/bin/elektron
COPY --from=builder /usr/local/bin/elektron-tx ${ELEKTRON_PREFIX}/bin/elektron-tx
COPY --from=builder /usr/local/bin/elektron-util ${ELEKTRON_PREFIX}/bin/elektron-util
COPY --from=builder /usr/local/bin/elektron-wallet ${ELEKTRON_PREFIX}/bin/elektron-wallet

EXPOSE 8332 8333
