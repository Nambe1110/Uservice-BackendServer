#!/bin/bash
#Stopping existing node servers
echo "Stopping any existing node servers"
pm2 stop ecosystem.config.cjs
pkill node