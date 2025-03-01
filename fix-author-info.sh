#!/bin/bash

# Fix author information for all commits to match GitHub account
git filter-branch --env-filter '
if [ "$GIT_AUTHOR_EMAIL" != "abdulwahab.omira@moct.gov.sy" ]
then
    export GIT_AUTHOR_NAME="Abdulwahab Omira"
    export GIT_AUTHOR_EMAIL="abdulwahab.omira@moct.gov.sy"
fi
if [ "$GIT_COMMITTER_EMAIL" != "abdulwahab.omira@moct.gov.sy" ]
then
    export GIT_COMMITTER_NAME="Abdulwahab Omira"
    export GIT_COMMITTER_EMAIL="abdulwahab.omira@moct.gov.sy"
fi
' --tag-name-filter cat -- --branches --tags

# Force push the corrected history
git push --force-with-lease origin main
