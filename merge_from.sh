#!/bin/bash
if [ $# != 1 ]; then
	echo "input branch name as argument"
	exit 1
fi
git merge --squash -X theirs --allow-unrelated-histories $1
git checkout HEAD -- .gitignore
git reset HEAD

