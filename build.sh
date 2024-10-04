docker stop condenser
docker rm condenser
docker build -t="moecki/condenser" -f Dockerfile .
docker run -itd --name condenser -p 8080:8080 moecki/condenser
