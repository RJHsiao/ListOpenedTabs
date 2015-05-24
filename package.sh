#!/bin/bash

# Package the necessary files into a zip file.
# Chrome Developer Dashboard can only accept
# zip format, not crx format.

if [ $# -ne 1 ]; then
	echo "Usage: $0 <new tag name>"
	exit 1
fi

tag=$1
git tag -s $tag -m "$tag released"
if [ $? -ne 0 ]; then
	exit 2
fi

path=`pwd`
fd=`basename $path`
dt=`date +%F`
fn="$fd"_"$tag"_"$dt"

# Create zip file
cd ..
zip -r $fn.zip $fd -i $fd/css/* $fd/images/* $fd/js/* $fd/LICENSE $fd/manifest.json $fd/*.html
exit $?