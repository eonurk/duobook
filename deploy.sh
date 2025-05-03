#!/usr/bin/env bash
set -o pipefail
set -x
# build both website and server
npm run build && npm run server:build
# copy static files for website
sudo rsync -av --delete /root/duobook/dist/ /var/www/duobook.co/html/
# update server
pm2 restart duobook-backend
