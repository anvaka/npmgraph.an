#!/bin/bash
rm -rf dist || exit 0;
mkdir dist;
npm run build
cp ./ops/CNAME ./dist
( cd dist
 git init
 git add .
 git commit -m "Deployed to Github Pages"
 git push --force git@github.com:anvaka/npmgraph.an.git master:gh-pages
)
