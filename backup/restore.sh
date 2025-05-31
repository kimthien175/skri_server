#!/bin/bash

set -e

if (( $# % 2 != 0 )); then
  echo "❌ Usage: $0 path_to_backup1 volume_name1 [path_to_backup2 volume_name2 ...]"
  exit 1
fi

MOUNTS=""
RESTORE_COMMANDS=""

# Accumulate all mounts and restore commands
while (( "$#" )); do
  BACKUP_FILE_PATH=$(realpath "$1")
  VOLUME_NAME="$2"

  # Verify backup file exists before launching container
  if [[ ! -f "$BACKUP_FILE_PATH" ]]; then
    echo "❌ Backup file not found: $BACKUP_FILE_PATH"
    exit 2
  fi

  BACKUP_FILE_NAME=$(basename "$BACKUP_FILE_PATH")

  # Check if volume exists
  if docker volume inspect "$VOLUME_NAME" &> /dev/null; then
    # Ask user whether to overwrite
    read -rp "⚠️ Volume '$VOLUME_NAME' exists. Overwrite with backup '$BACKUP_FILE_NAME'? [y/N]: " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      echo "⏭️ Skipping volume '$VOLUME_NAME'."
      shift 2
      continue
    fi
  else
    echo "ℹ️ Volume '$VOLUME_NAME' does not exist, will be created automatically by Docker."
  fi

  BACKUP_DIR_ABS=$(realpath "$(dirname "$BACKUP_FILE_PATH")")

  VOLUME_PATH="/extracted/${VOLUME_NAME}"
  FILE_PATH="/mounted/${VOLUME_NAME}/${BACKUP_FILE_NAME}"

  # Mount volume to /extracted/xxx, and backup file's dir to /mounted/xxx
  MOUNTS="$MOUNTS -v ${VOLUME_NAME}:${VOLUME_PATH} -v ${BACKUP_DIR_ABS}:/mounted/${VOLUME_NAME}"

  # Add tar command
  RESTORE_COMMANDS="$RESTORE_COMMANDS tar xzvf ${FILE_PATH} -C ${VOLUME_PATH} &&"

  shift 2
done

# Remove trailing '&&'
RESTORE_COMMANDS="${RESTORE_COMMANDS%&&}"

# Run once with all volumes and restore commands
echo "🔧 Running restore in a single container..."
eval docker run --rm $MOUNTS alpine sh -c \""$RESTORE_COMMANDS"\"
echo "✅ Restore complete!"