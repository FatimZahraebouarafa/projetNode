param([string]$Command)
docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock docker:cli sh -c "apk add --no-cache curl -q && curl -sSfL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh | sh -s -- -b /usr/local/bin -q && docker login -u fatimzahraebouarafa && $Command"
