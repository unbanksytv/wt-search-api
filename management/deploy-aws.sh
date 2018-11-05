#!/bin/bash
ENVIRONMENT=$1

# AWS command opts
TASK_FAMILY="$ENVIRONMENT-wt-search-api"
SERVICE_NAME="$ENVIRONMENT-wt-search-api"
AWS_REGION="eu-west-1"

# container setup options
LATEST_TAG=`git describe --abbrev=0 --tags`

# container startup options
WT_CONFIG=$ENVIRONMENT

# Change port, environment variables, memoryReservation and cpu to be in line with your task
# definition.
TASK_DEF="[{\"portMappings\": [{\"hostPort\": 0,\"protocol\": \"tcp\",\"containerPort\": 1918}],
    \"environment\": [
      {
        \"name\": \"WT_CONFIG\",
        \"value\": \"$WT_CONFIG\"
      },
      {
        \"name\": \"WT_API_BASE_URL\",
        \"value\": \"https://$WT_CONFIG-search-api.windingtree.com\"
      },
      {
        \"name\": \"WT_READ_API_URL\",
        \"value\": \"https://$WT_CONFIG-api.windingtree.com\"
      }
    ],
    \"image\": \"029479441096.dkr.ecr.eu-west-1.amazonaws.com/wt-search-api:$LATEST_TAG-$ENVIRONMENT\",
    \"name\": \"$ENVIRONMENT-wt-search-api\",
    \"memoryReservation\": 128,
    \"cpu\": 128
  }]"

echo "Updating task definition"
aws ecs register-task-definition --region $AWS_REGION --family $TASK_FAMILY --container-definitions "$TASK_DEF" > /dev/null
echo "Updating service"
aws ecs update-service --region $AWS_REGION --cluster shared-docker-cluster-t3 --service "$SERVICE_NAME" --task-definition "$TASK_FAMILY" > /dev/null
