# Start from bare Alpine and install only g++ — much smaller than full gcc images
FROM alpine:3.19

RUN apk add --no-cache g++

# Security: dedicated non-root user
RUN addgroup -S runnergroup && adduser -S runneruser -G runnergroup

# Pre-create and own the code directory
RUN mkdir /code && chown runneruser:runnergroup /code

USER runneruser

WORKDIR /code

# No CMD — invoked by the API as:
# sh -c "g++ /code/main.cpp -o /tmp/prog && /tmp/prog"
# /tmp inside the container is world-writable, so the non-root user can write the binary there.
