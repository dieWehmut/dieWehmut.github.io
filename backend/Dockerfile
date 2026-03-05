FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
# 在容器里临时修改 Go 版本
RUN sed -i 's/^go .*/go 1.22/' go.mod
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/server ./cmd/server

FROM alpine:3.20
RUN adduser -D -u 10001 appuser
USER appuser
WORKDIR /app
COPY --from=builder /out/server /app/server

ENV PORT=7860
EXPOSE 7860
CMD ["/app/server"]
