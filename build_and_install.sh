#!/bin/bash

# build
npm run vscode:prepublish

# install
vsce package
