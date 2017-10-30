#!/bin/sh

echo "relink project ..."

exec > /dev/null 2>&1

# first register project
yarn link

# try unregister project
yarn unlink

# relink project
yarn link
