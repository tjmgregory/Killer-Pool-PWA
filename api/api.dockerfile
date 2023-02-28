FROM rust:1.66-alpine as build

RUN apk add --update --no-cache openssl-dev musl-dev libpq-dev
RUN rustup component add rustfmt

WORKDIR /app

COPY . .

ENV RUSTFLAGS="-C target-feature=-crt-static"
RUN cargo install --path .

FROM alpine:3.17

WORKDIR /app

ENV USER=appuser \
    UID=1000 \
    ROCKET_PORT=8000 \
    ROCKET_ADDRESS=0.0.0.0

COPY --from=build /usr/local/cargo/bin/api /usr/local/bin/api

RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    "${USER}" && \
    chown -R appuser:appuser /app && \
    chmod +x /usr/local/bin/api && \
    apk add --update --no-cache libgcc ca-certificates

USER appuser:appuser

ENTRYPOINT ["/usr/local/bin/api"]
