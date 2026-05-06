# Official Go 1.22 on Alpine — includes the full toolchain for go run
FROM golang:1.22-alpine

# Security: dedicated non-root user
RUN addgroup -S runnergroup && adduser -S runneruser -G runnergroup

# Pre-create and own the code directory
RUN mkdir /code && chown runneruser:runnergroup /code

USER runneruser

WORKDIR /code

# No CMD — invoked by the API as:
# go run /code/main.go
# 'go run' compiles and executes in a single step — no separate build phase needed.
