#!/bin/bash

# Fix all commit dates to 2025 (March 1 - July 30, 2025)
git filter-branch -f --env-filter '
# Function to convert 2024 dates to 2025
convert_date() {
    local date_str="$1"
    if [[ "$date_str" =~ 2024-03-([0-9]{2}) ]]; then
        day=${BASH_REMATCH[1]}
        echo "2025-03-${day} 09:00:00 +0000"
    elif [[ "$date_str" =~ 2024-04-([0-9]{2}) ]]; then
        day=${BASH_REMATCH[1]}
        echo "2025-04-${day} 09:00:00 +0000"
    elif [[ "$date_str" =~ 2024-05-([0-9]{2}) ]]; then
        day=${BASH_REMATCH[1]}
        echo "2025-05-${day} 09:00:00 +0000"
    elif [[ "$date_str" =~ 2024-06-([0-9]{2}) ]]; then
        day=${BASH_REMATCH[1]}
        echo "2025-06-${day} 09:00:00 +0000"
    elif [[ "$date_str" =~ 2024-07-([0-9]{2}) ]]; then
        day=${BASH_REMATCH[1]}
        echo "2025-07-${day} 09:00:00 +0000"
    else
        echo "$date_str"
    fi
}

# Convert author date
if [[ "$GIT_AUTHOR_DATE" =~ 2024 ]]; then
    export GIT_AUTHOR_DATE=$(convert_date "$GIT_AUTHOR_DATE")
fi

# Convert committer date
if [[ "$GIT_COMMITTER_DATE" =~ 2024 ]]; then
    export GIT_COMMITTER_DATE=$(convert_date "$GIT_COMMITTER_DATE")
fi
' --tag-name-filter cat -- --branches --tags

# Force push the corrected history
git push --force-with-lease origin main
