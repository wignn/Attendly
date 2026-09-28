FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/server cmd/server/main.go
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/migrate cmd/migrate/main.go

FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata curl

RUN adduser -D -g '' appuser

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/bin/server /app/server
COPY --from=builder /app/bin/migrate /app/migrate
COPY --from=builder /app/db/migrations /app/db/migrations
COPY --from=builder /app/db/seeds /app/db/seeds
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh /app/server /app/migrate && chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["/app/server"]
