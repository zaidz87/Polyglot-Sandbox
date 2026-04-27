# Use the explicitly requested standard Python 3.12 image
FROM python:3.12-alpine

# Security Best Practice: Do not run as root.
# Creating a dedicated non-root user and group
RUN addgroup -S runnergroup && adduser -S runneruser -G runnergroup

# Pre-create the directory where external code will be mounted
RUN mkdir /code && chown runneruser:runnergroup /code

# Switch context to the non-root user
USER runneruser

# Set working directory to the mount point
WORKDIR /code

# There is no CMD instruction here. This image is utilized strictly as an execution runner 
# spawned on-demand by the API container with a specific script argument.
