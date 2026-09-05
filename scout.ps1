param([string]$Command)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock docker:cli sh -c "apk add --no-cache curl && curl -sSfL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh | sh -s -- -b /usr/local/bin && docker login -u fatimzahraebouarafa && $Command"
