#!/bin/bash

# Define colors
YELLOW='\033[1;33m'
NC='\033[0m'    # No Color

# warning
echo -e "${YELLOW}Warning. Run command with sudo. Ensure env variables are between "". ${NC}"

# ensure correct directory
script_dir=$(dirname "$(realpath "$0")")
parent_dir=$(dirname "$script_dir")
cd "$parent_dir" || exit

# set container name as environment variable
export container_name="explainit-client-production"
export env_file=".env.production"
export resource_group="explainit"
export image_tag="matzapata/explainit-client"
export port=3000
export environment="explainit-env"

echo "Enter release name: (examples: latest / 1.0.0)"
read release_name
export release_name

source ./scripts/deploy.sh