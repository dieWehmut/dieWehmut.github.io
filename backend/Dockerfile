FROM golang:1.25-alpine AS builder

WORKDIR /app

# 先复制依赖
COPY go.mod go.sum ./
RUN go mod download

# 再复制源码
COPY . .

# 构建
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -o server ./cmd/server


FROM alpine:3.20

RUN adduser -D -u 10001 appuser

WORKDIR /app

COPY --from=builder /app/server ./server

USER appuser

EXPOSE 7860

CMD ["./server"]