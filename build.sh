#!/bin/bash
echo "About to install node, which requires root, only continue if you don't have node js"
echo "feel free to exit and not run this, all were doing is installing node js for linux"
echo "also only works in Linux (ubuntu), make sure you have node Js installed on your system"
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs

