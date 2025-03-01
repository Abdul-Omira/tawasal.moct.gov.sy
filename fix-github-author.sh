#!/bin/bash

# Fix author information to use GitHub noreply email
git filter-branch --env-filter '
export GIT_AUTHOR_NAME="Abdulwahab Omira"
export GIT_AUTHOR_EMAIL="Abdul-Omira@users.noreply.github.com"
export GIT_COMMITTER_NAME="Abdulwahab Omira"
export GIT_COMMITTER_EMAIL="Abdul-Omira@users.noreply.github.com"
' --tag-name-filter cat -- --branches --tags

# Force push the corrected history
git push --force-with-lease origin main
