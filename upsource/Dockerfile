FROM java:openjdk-8-jre

MAINTAINER Mengyu LIU <mengyu.liu@outlook.com>

#COMMENTS
#docker run --name upsource-data \
#  -v /opt/Upsource/conf \
#  -v /opt/Upsource/data \
#  -v /opt/Upsource/logs \
#  -v /opt/Upsource/backups \
#  busybox chown -R 999: /opt/Upsource

#docker run -d --volumes-from upsource-data \
#  -p 8080:8080 --name upsource klikatech/upsource

ENV UPSOURCE_VERSION 2.5.4995
VOLUME ["/opt/Upsource/conf", "/opt/Upsource/data", "/opt/Upsource/logs", "/opt/Upsource/backups"]
WORKDIR /opt
RUN mkdir -p /home/upsource \
	&& groupadd -g 999 upsource \
	&& useradd -u 999 -g upsource -d /home/upsource upsource \
	&& chown -R upsource:upsource /home/upsource \
	&& wget -nv http://download.jetbrains.com/upsource/upsource-$UPSOURCE_VERSION.zip \
	&& unzip upsource-$UPSOURCE_VERSION.zip \
	&& rm -rf upsource-$UPSOURCE_VERSION.zip \
	&& chown -R upsource:upsource Upsource
USER upsource
EXPOSE 8080
WORKDIR /opt/Upsource
CMD ["bin/upsource.sh", "run"]