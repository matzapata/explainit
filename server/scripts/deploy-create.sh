#!/bin/bash

# create the container app. Requires existing resource group and environment.

# ============================== az setup ==============================

# skip if already done
# az login
# az upgrade
# az extension add --name containerapp --upgrade
# az provider register --namespace Microsoft.App
# az provider register --namespace Microsoft.OperationalInsights

# ============================== utils ==============================

# Function to prompt for confirmation
confirm() {
    echo "$1"
    while true; do
        read -p "Enter [Y/N]: " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please enter Y or N.";;
        esac
    done
}

# ==============================  settings ==============================

echo "Enter environment name:"
read environment

echo "Enter container name:"
read container_name

echo "Enter resource group:"
read resource_group

echo "Enter image tag (withour release name, example username/my-app):"
read image_tag

echo "Enter release name: (examples: latest / 1.0.0)"
read release_name

echo "Enter port:"
read port

# confirm settings
echo "Deployment settings:"
echo "Container name: $container_name"
echo "Resource group: $resource_group"
echo "Image: $image_tag:$release_name"
echo "Environment: $environment"
echo "Port: $port"

if confirm "Do you want to proceed with these settings?"; then
    echo "Proceeding with deployment..."
else
    echo "Deployment cancelled."
    exit 1
fi

# ==============================  main ==============================

# build the container image
echo "Building the container image..."
docker build -t $image_tag:$release_name .
build_status=$?

# check if the build was successful
if [ $build_status -eq 0 ]; then
    echo "Container image built successfully."
else
    echo "Failed to build container image."
    exit 1
fi

# publish image
docker push $image_tag:$release_name

# Read .env file and set environment variables
while IFS='=' read -r key value; do
    if [[ ! -z $key && ! $key =~ ^# ]]; then
        env_vars+=" $key=$value"
    fi
done < .env.prod
echo "Updating container app with env vars:"
echo $env_vars

# Prompt for confirmation and publish the container to Azure
if confirm "We're going to create a container app named $container_name in $resource_group. Sounds good?"; then
    az containerapp create \
        --name $container_name \
        --resource-group $resource_group \
        --environment $environment \
        --image $image_tag:$release_name \
        --target-port $port \
        --ingress external \
        --env-vars $env_vars
else
    echo "Container app not updated."
fi
