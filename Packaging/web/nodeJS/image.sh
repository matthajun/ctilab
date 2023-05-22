#!/bin/bash

if [ $# -lt 1 ] ; then
    echo "인수를 입력해주세요 (이미지의 버전 값)"
    exit 1
fi

argument=$1

echo "버전 태그 : $argument"
docker build -f Dockerfile -t dti_sv:$argument .

name=$argument

docker tag dti_sv:$name ctilab2/dti_sv:$name
docker push ctilab2/dti_sv:$name

docker tag dti_sv:$name ctilabworkernode1:5000/ctilab/dti_sv:$name
docker push ctilabworkernode1:5000/ctilab/dti_sv:$name
