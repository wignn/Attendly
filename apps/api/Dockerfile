FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/server cmd/server/main.go
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/worker cmd/worker/main.go

FROM alpine:3.20

WORKDIR /app

RUN adduser -D -g '' appuser

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/bin/server /app/server
COPY --from=builder /app/bin/worker /app/worker
COPY --from=builder /app/db/migrations /app/db/migrations

USER appuser

EXPOSE 8080

CMD ["/app/server"]
