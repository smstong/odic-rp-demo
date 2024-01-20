#!/bin/bash
build_dir=$(cd `dirname $0`; pwd)
project_dir=$(dirname $build_dir)

cd $project_dir || exit

GOOS=linux go build -o debug/oidc-client

DOCKER_REGISTRY=utsso
IMAGE_NAME=oidc-client
IMAGE_VERSION=$(cat VERSION)
IMAGE_TAG=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_VERSION}
IMAGE_TAG_LATEST=${DOCKER_REGISTRY}/${IMAGE_NAME}:latest

docker build -t ${IMAGE_TAG} -f $build_dir/Dockerfile .
docker tag ${IMAGE_TAG} ${IMAGE_TAG_LATEST}

docker push ${IMAGE_TAG}
docker push ${IMAGE_TAG_LATEST}