# BACK UP AND RESTORE DOCKER VOLUMES:
#    # BACK UP: 
run /backup/backup.sh `volume_name1` `volume_name2` ...etc to backup multiple volumes at current folderpath
for example: `backup.sh jenkins_data skribbl_db_data` to back up volumes `jenkins_data` and `skribbl_db_data` into `jenkins_data``_[BACKUP DATE]`.tar.gz and `skribbl_db_data``_[BACKUP DATE]`.tar.gz files

#    # RESTORE: 
run /backup/restore.sh `PATH TO VOLUME1 FILE` `volume_name1` `PATH TO VOLUME2 FILE2` `volume_name2` ...etc to restore multiple volumes from multiple files 
for example: `restore.sh jenkins_data*.tar.gz jenkins_data skribbl_db_data*.tar.gz skribbl_db_data` to restore volume `jenkins_data` from `jenkins_data.tar.gz`, `skribbl_db_data` from `skribbl_db_data.tar.gz`


# RUN JENKINS WITH EXISTING `jenkins_home` VOLUME (can be restored with /backup/jenkins*.tar.gz):
docker run -d -p 8080:8080 -p 50000:50000 --name jenkins -v jenkins_home:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock jenkins/jenkins:lts


# DEPLOY PROJECT TO DOCKER (REQUIRED TO RESTORE `skribbl_db_data` VOLUME with `/backup/skribbl*.tar.gz` BEFORE DEPLOYING):
run with docker compose
