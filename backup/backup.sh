#!/bin/bash

set -e

# Ensure at least one volume is provided
if [ "$#" -lt 1 ]; then
  echo "❌ Usage: $0 volume1 [volume2 ...]"
  exit 1
fi


# Prepare mount flags and backup commands
MOUNTS=""
TAR_COMMANDS=""

for VOLUME_NAME in "$@"; do

  # Check if volume exists
  if ! docker volume inspect "$VOLUME_NAME" &> /dev/null; then
    echo "❌ Volume '$VOLUME_NAME' does not exist. Aborting."
    exit 1
  fi

  VOLUME_PATH="/volumes/${VOLUME_NAME}"
  MOUNTS="$MOUNTS -v ${VOLUME_NAME}:${VOLUME_PATH}"
  DATE=$(date +%Y-%m-%d-%H-%M-%S)
  TAR_COMMANDS="$TAR_COMMANDS tar czvf /backup/${VOLUME_NAME}_${DATE}.tar.gz -C ${VOLUME_PATH} . &&"
done

# Trim trailing &&
TAR_COMMANDS="${TAR_COMMANDS%&&}"

# Run everything in one container
eval docker run --rm \
  -v "$PWD:/backup" \
  $MOUNTS \
  alpine sh -c \""$TAR_COMMANDS"\"

echo "✅ Backup complete!"