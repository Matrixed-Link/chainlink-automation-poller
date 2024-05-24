#!/bin/sh
export PORT=$(jq -r '.port' config.json)
