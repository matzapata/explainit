#!/bin/bash

# ensure correct directory
script_dir=$(dirname "$(realpath "$0")")
parent_dir=$(dirname "$script_dir")
cd "$parent_dir" || exit

# set container name as environment variable
export container_name="explainit-client-staging"
export env_file=".env.staging"
export resource_group="explainit"
export image_tag="matzapata/explainit-client"
export port=3000
export environment="explainit-env"

echo "Enter release name: (examples: latest / 1.0.0)"
read release_name
export release_name

source ./scripts/deploy.sh