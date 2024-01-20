FOR DEVELOPMENT:
    REQUIREMENT FOR REMOTING FROM LOCAL REPO: 
        typescript installed globally
        nodemon installed globally

BUILD IMAGE: docker-compose build
RUN CONTAINER IN DETACHED MODE(IN THE BACKGROUND): docker-compose up -d
STOP CONTAINER: docker-compose down

THE STUPID WAY TO CLONE AND CONTINUE DEV: export data from mongodb then build image, run container then import again