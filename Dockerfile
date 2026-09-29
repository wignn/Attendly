# syntax=docker/dockerfile:1.7
FROM golang:1.25-alpine AS builder

WORKDIR /src

COPY apps/api/go.mod apps/api/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY apps/api/ ./

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

USER app:app

EXPOSE 8080

CMD ["/bin/sh", "-c", "/app/migrate up || echo '[komas-api] Notice: migration failed or already current'; exec /app/server"]
