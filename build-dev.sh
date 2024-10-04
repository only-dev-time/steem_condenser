docker stop condenser-dev
docker rm condenser-dev
docker build -t="moecki/condenser-dev" -f Dockerfile.dev .
docker run -itd --name condenser-dev -p 8080:8080 -v /home/marko/steem_condenser:/var/app moecki/condenser-dev
