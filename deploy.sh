#!/bin/bash
# Stop at the first error, so that a failed build is never pushed.
set -e
rm -rf dist || exit 0;
mkdir dist;
npm run build
cp ./ops/CNAME ./dist
( cd dist
 git init
 git add .
 git commit -m "Deployed to Github Pages"
 git push --force git@github.com:anvaka/npmgraph.an.git main:gh-pages
)
