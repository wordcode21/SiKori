@echo off
echo Running Unit Tests in Docker...
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
echo Tests Completed.
pause
