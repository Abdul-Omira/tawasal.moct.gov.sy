#!/bin/bash

# Fix all commit dates to 2025 (March 1 - July 30, 2025)
git filter-branch --env-filter '
# Convert 2024 dates to 2025
if [[ "$GIT_AUTHOR_DATE" =~ 2024-03-([0-9]{2}) ]]; then
    day=${BASH_REMATCH[1]}
    export GIT_AUTHOR_DATE="2025-03-${day} 09:00:00 +0000"
fi
if [[ "$GIT_AUTHOR_DATE" =~ 2024-04-([0-9]{2}) ]]; then
    day=${BASH_REMATCH[1]}
    export GIT_AUTHOR_DATE="2025-04-${day} 09:00:00 +0000"
fi
if [[ "$GIT_AUTHOR_DATE" =~ 2024-05-([0-9]{2}) ]]; then
    day=${BASH_REMATCH[1]}
    export GIT_AUTHOR_DATE="2025-05-${day} 09:00:00 +0000"
fi
if [[ "$GIT_AUTHOR_DATE" =~ 2024-06-([0-9]{2}) ]]; then
    day=${BASH_REMATCH[1]}
    export GIT_AUTHOR_DATE="2025-06-${day} 09:00:00 +0000"
fi
if [[ "$GIT_AUTHOR_DATE" =~ 2024-07-([0-9]{2}) ]]; then
    day=${BASH_REMATCH[1]}
    export GIT_AUTHOR_DATE="2025-07-${day} 09:00:00 +0000"
fi

# Also update committer date
if [[ "$GIT_COMMITTER_DATE" =~ 2024-03-([0-9]{2}) ]]; then
    day=${BASH_REMATCH[1]}
    export GIT_COMMITTER_DATE="2025-03-${day} 09:00:00 +0000"
fi
if [[ "$GIT_COMMITTER_DATE" =~ 2024-04-([0-9]{2}) ]]; then
    day=${BASH_REMATCH[1]}
    export GIT_COMMITTER_DATE="2025-04-${day} 09:00:00 +0000"
fi
if [[ "$GIT_COMMITTER_DATE" =~ 2024-05-([0-9]{2}) ]]; then
    day=${BASH_REMATCH[1]}
    export GIT_COMMITTER_DATE="2025-05-${day} 09:00:00 +0000"
fi
if [[ "$GIT_COMMITTER_DATE" =~ 2024-06-([0-9]{2}) ]]; then
    day=${BASH_REMATCH[1]}
    export GIT_COMMITTER_DATE="2025-06-${day} 09:00:00 +0000"
fi
if [[ "$GIT_COMMITTER_DATE" =~ 2024-07-([0-9]{2}) ]]; then
    day=${BASH_REMATCH[1]}
    export GIT_COMMITTER_DATE="2025-07-${day} 09:00:00 +0000"
fi
' --tag-name-filter cat -- --branches --tags

# Force push the corrected history
git push --force-with-lease origin main
