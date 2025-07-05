FROM rust:1.88-alpine AS rust-builder
WORKDIR /backend
COPY ./backend .
RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconfig git build-base
RUN cargo fetch
RUN cargo build --release --target x86_64-unknown-linux-musl

FROM node:current-alpine AS react-builder
WORKDIR /frontend
COPY ./frontend /frontend
RUN corepack yarn && \
    corepack yarn build

FROM scratch AS prod
WORKDIR /app
COPY --from=rust-builder /backend/target/x86_64-unknown-linux-musl/release/kom /app
COPY --from=react-builder /frontend/build /app/frontend
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/app/kom"]