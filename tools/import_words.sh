#!/bin/bash
FILE_PATH=$(realpath "$1")
CONTENT=$(cat $FILE_PATH | tr '\n' ' ')
IFS=',' read -r -a WORDS <<< "$CONTENT"

declare -a WORD_OBJECTS

for WORD in "${WORDS[@]}"; do
    TRIMMED_WORD=$(echo $WORD | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    WORD_OBJECTS+=("{\"word\": \"$TRIMMED_WORD\"}")
done

echo $(printf "[%s]" "$(IFS=,; echo "${WORD_OBJECTS[*]}")") > output.json