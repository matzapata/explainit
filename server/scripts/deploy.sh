#!/bin/bash

# given a existing deployment, update it with latest image and env vars

# ============================== az setup ==============================

# skip if already done
# az login
# az upgrade
# az extension add --name containerapp --upgrade
# az provider register --namespace Microsoft.App
# az provider register --namespace Microsoft.OperationalInsights

# ============================== utils funcitons ==============================

print_blue() {
    echo -e "\033[1;34m$1\033[0m"
}
print_red() {
    echo -e "\033[1;31m$1\033[0m"
}
print_yellow() {
    echo -e "\033[1;33m$1\033[0m"
}
print_green() {
    echo -e "\033[1;32m$1\033[0m"
}

confirm() {
    print_blue "$1"
    while true; do
        read -p "Enter [Y/N]: " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please enter Y or N.";;
        esac
    done
}

# ============================== settings ==============================

# warning
print_yellow "Warning. Run command with sudo. Ensure env variables are between ""."

# Check if required environment variables are set
if [ -z "$container_name" ] || [ -z "$resource_group" ] || [ -z "$image_tag" ] || [ -z "$release_name" ] || [ -z "$env_file" ] || [ -z "$port" ] || [ -z "$environment"]; then
    print_red "Required environment variables are not set. Exiting..."
    exit 1
fi

# confirm settings
print_blue "Deployment settings:"
echo "Container name: $container_name"
echo "Resource group: $resource_group"
echo "Image: $image_tag:$release_name"
echo "Environment file: $env_file"
echo "Port: $port"

if confirm "Do you want to proceed with these settings?"; then
    print_green "Proceeding with deployment..."
else
    print_red "Deployment cancelled."
    exit 1
fi

# ============================== build image ==============================

if confirm "Do you want to create and publish a new build?"; then
    print_blue "Building the container image..."
    docker build -t $image_tag:$release_name .
    if [ $? -eq 0 ]; then
        print_green "Container image built successfully."
    else
        print_red "Failed to build container image."
        exit 1
    fi

    print_blue "Publishing image..."
    docker push $image_tag:$release_name
    if [ $? -eq 0 ]; then
        print_green "Container image pushed successfully."
    else
        print_red "Failed to push container image."
        exit 1
    fi
else
    print_yellow "No new image will be pushed."
fi

# ============================== load env vars and create depl ==============================

env_vars=""
while IFS='=' read -r key value; do
    if [[ ! -z $key && ! $key =~ ^# ]]; then
        env_vars+=" $key=$value"
    fi
done < $env_file
print_blue "Updating container app with env vars:"
echo $env_vars

if confirm "We're going to create/update container $container_name in $resource_group. Sounds good?"; then
    create_command="az containerapp create  --name $container_name --resource-group $resource_group  --environment $environment  --image $image_tag:$release_name --target-port $port --ingress external --env-vars $env_vars"
    print_blue "Executing command:"
    echo $create_command
    eval $create_command

    print_green "Container app updated successfully."
else
    print_red "Container app not updated."
fi