FROM ctilab2/dti_nvm:1.1
WORKDIR /usr/app
COPY . /usr/app
EXPOSE 3003
ENV NVM_DIR /usr/local/nvm
ENV TZ Asia/Seoul

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm use 8.17.0"

RUN /bin/bash -c "source $NVM_DIR/nvm.sh && npm i"

RUN mkdir -p /data/ds/file
RUN mkdir -p /data/ds/log

ENTRYPOINT /bin/bash -c "source $NVM_DIR/nvm.sh && nvm use 14.16.1 && npm run start:dev"
