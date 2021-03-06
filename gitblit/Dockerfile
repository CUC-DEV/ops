# run command: docker run -d --name gitblit -p 8443:443 -p 8080:8080 -p 9418:9418 -p 29418:29418 -v /mnt/gitblit-data/:/opt/gitblit-data mengyu/gitblit
# Basics
#
from ubuntu:latest
maintainer Mengyu LIU <mengyu.dev@outlook.com>
run apt-get update
run apt-get install -q -y git-core redis-server

# Install Java 7

run DEBIAN_FRONTEND=noninteractive apt-get install -q -y software-properties-common
run DEBIAN_FRONTEND=noninteractive apt-get install -q -y python-software-properties
run DEBIAN_FRONTEND=noninteractive apt-add-repository ppa:webupd8team/java -y
run apt-get update
run echo oracle-java7-installer shared/accepted-oracle-license-v1-1 select true | /usr/bin/debconf-set-selections
run DEBIAN_FRONTEND=noninteractive apt-get install oracle-java7-installer -y

# Install Gitblit

run apt-get install -q -y curl
run curl -Lks http://dl.bintray.com/gitblit/releases/gitblit-1.7.1.tar.gz -o /root/gitblit.tar.gz
run mkdir -p /opt/gitblit-tmp
run tar zxf /root/gitblit.tar.gz -C /opt/gitblit-tmp
run mv /opt/gitblit-tmp/gitblit-1.7.1 /opt/gitblit
run rm -rf /opt/gitblit-tmp
run rm -f /root/gitblit.tar.gz

# Move the data files to a separate directory
run mkdir -p /opt/gitblit-data

run mv /opt/gitblit/data/* /opt/gitblit-data

# Adjust the default Gitblit settings to bind to 80, 443, 9418, 29418, and allow RPC administration.
#
# Note: we are writing to a different file here because sed doesn't like to the same file it
# is streaming.  This is why the original properties file was renamed earlier.

run echo "server.httpPort=8080" >> /opt/gitblit-data/gitblit.properties
run echo "server.httpsPort=443" >> /opt/gitblit-data/gitblit.properties
run echo "server.redirectToHttpsPort=false" >> /opt/gitblit-data/gitblit.properties
run echo "web.enableRpcManagement=true" >> /opt/gitblit-data/gitblit.properties
run echo "web.enableRpcAdministration=true" >> /opt/gitblit-data/gitblit.properties

# Setup the Docker container environment and run Gitblit
workdir /opt/gitblit
expose 80
expose 443
expose 9418
expose 29418
cmd ["java", "-server", "-Xmx1024M", "-Djava.awt.headless=true", "-jar", "/opt/gitblit/gitblit.jar", "--baseFolder", "/opt/gitblit-data"]