# Eclipse Temurin is the official, production-grade OpenJDK distribution on Alpine
FROM eclipse-temurin:21-jdk-alpine

# Security: create a dedicated non-root user to run untrusted code
RUN addgroup -S runnergroup && adduser -S runneruser -G runnergroup

# Pre-create the /code directory and grant ownership to the runner user
RUN mkdir /code && chown runneruser:runnergroup /code

# Switch to the non-root user for all subsequent operations
USER runneruser

WORKDIR /code

# No CMD — this image is invoked on-demand by the API with:
# sh -c "cd /code && javac Main.java && java Main"
# Users must define 'public class Main' as their entry point.
