# BACK UP AND RESTORE DOCKER VOLUMES:
#     backup: 
Run /backup/backup.sh `volume_name1` `volume_name2` ...etc to backup multiple volumes at current folderpath.<br/>
For example: `backup.sh jenkins_data skribbl_db_data` to back up volumes `jenkins_data` and `skribbl_db_data` into `jenkins_data_[BACKUP DATE]`.tar.gz and `skribbl_db_data_[BACKUP DATE]`.tar.gz files.

#     restore: 
Run /backup/restore.sh `PATH TO VOLUME1 FILE` `volume_name1` `PATH TO VOLUME2 FILE2` `volume_name2` ...etc to restore multiple volumes from multiple files.<br/>
For example: `restore.sh jenkins_data*.tar.gz jenkins_home skribbl_db_data*.tar.gz skribbl_db_data` to restore volume `jenkins_home` from `jenkins_data.tar.gz`, `skribbl_db_data` from `skribbl_db_data.tar.gz`.


# RUN JENKINS WITH EXISTING `jenkins_home` VOLUME (can be restored with /backup/jenkins*.tar.gz):
docker run -d -p 8080:8080 -p 50000:50000 --name jenkins -v jenkins_home:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock jenkins/jenkins:lts


# DEPLOY PROJECT TO DOCKER:
Requirements: restore volume `skribbl_db_data` with data from `/backup/skribbl*.tar.gz` before deploying.<br/>
Run with docker compose.
