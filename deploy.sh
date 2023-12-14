#!/bin/bash
set -e

env=prod
project=porrima

echo ====================================================================================
echo env: $env
echo project: $project
echo ====================================================================================

echo deploy backend AWS...
cd ./backend
npm install
npm run pre:deploy
aws cloudformation package --template-file aws/cloudformation/template.yaml --output-template-file packaged.yaml --s3-bucket ginzacraftworks-cf-midway
aws cloudformation deploy --template-file packaged.yaml --stack-name $project-$env-stack --parameter-overrides TargetEnvr=$env Project=$project --no-fail-on-empty-changeset --s3-bucket ginzacraftworks-cf-midway --capabilities CAPABILITY_NAMED_IAM
echo ====================================================================================

echo deploy frontend to S3...
cd ../frontend
npm i
npm run build
aws s3 sync ./dist s3://$project-$env --delete --cache-control no-cache
echo ====================================================================================
