# syntax=docker/dockerfile:1.7
FROM golang:1.25-alpine AS builder

WORKDIR /src

# Cache module downloads separately from application source.
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

# Build static binaries with stripped symbols for a smaller runtime image.
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server && \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/migrate ./cmd/migrate

FROM alpine:3.22

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app && adduser -S -G app app

WORKDIR /app

COPY --from=builder --chown=app:app /out/server /app/server
COPY --from=builder --chown=app:app /out/migrate /app/migrate
COPY --from=builder --chown=app:app /src/db/migrations /app/db/migrations
COPY --from=builder --chown=app:app /src/db/seeds /app/db/seeds
COPY --chown=app:app entrypoint.sh /app/entrypoint.sh

RUN chmod 0555 /app/entrypoint.sh /app/server /app/migrate

USER app:app

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["/app/server"]
