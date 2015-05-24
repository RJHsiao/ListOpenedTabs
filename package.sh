#!/bin/bash

# Package the necessary files into a zip file.
# Chrome Developer Dashboard can only accept
# zip format, not crx format.

if [ $# -eq 0 ]; then
	read -p "Package files without create a git tag before? [y/N] "
	if [ ${REPLY^^} != "Y" ]; then
		echo "Do nothing..."
		exit 0
	fi
elif [ $# -eq 1 ]; then
	tag=$1
	git tag -s $tag -m "$tag released"
	if [ $? -ne 0 ]; then
		exit 2
	else
		read -p "Push git tag \"$tag\" before? [y/N] "
		if [ ${REPLY^^} = "Y" ]; then
			git push origin $tag
		fi
	fi
else
	echo "Usage: $0 [<new tag name>]"
	exit 1
fi

path=`pwd`
fd=`basename $path`
dt=`date +%F`
if [ $tag ]; then
	fn="$fd"_"$tag"_"$dt"
else
	fn="$fd"_"$dt"
fi

# Create zip file
cd ..
zip -r $fn.zip $fd -i $fd/css/* $fd/images/* $fd/js/* $fd/LICENSE $fd/manifest.json $fd/*.html
exit $?