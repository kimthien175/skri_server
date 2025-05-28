# JENKINS WITH DOCKER AS THE SAME HOST
docker run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_data:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock jenkins/jenkins:lts

# FRESH RUN: including docker compose and basic server data
run setup.sh