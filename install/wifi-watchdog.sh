#!/bin/bash

# =============================================================================
# Script Name: wifi-watchdog.sh
# Description: Keeps the InkyPi's WiFi connection alive. The Raspberry Pi WiFi
#              adapter sometimes drops its connection (often because of power
#              saving) and NetworkManager does not always bring it back without
#              a power cycle. This script is run periodically by a systemd timer
#              (inkypi-wifi-watchdog.timer). When it detects that the connection
#              is down it escalates through a series of reconnect attempts until
#              connectivity is restored.
#
# Installed to: /usr/local/bin/inkypi-wifi-watchdog
# Output is captured by journald (see: journalctl -u inkypi-wifi-watchdog)
# =============================================================================

set -u

log() {
  echo "[wifi-watchdog] $*"
}

# Detect the WiFi device name (e.g. wlan0). Fall back to wlan0 if detection
# fails so the script still does something sensible.
WIFI_DEV="$(nmcli -t -f DEVICE,TYPE device 2>/dev/null | awk -F: '$2=="wifi"{print $1; exit}')"
WIFI_DEV="${WIFI_DEV:-wlan0}"

# Make sure power saving is disabled at runtime. The persistent setting lives in
# /etc/NetworkManager/conf.d/inkypi-wifi-powersave-off.conf, but disabling it
# here too guarantees it is off immediately after a reconnect.
iw dev "$WIFI_DEV" set power_save off >/dev/null 2>&1

# Returns 0 if we can reach the default gateway, 1 otherwise. Pinging the
# gateway is a local layer-2/3 check that does not depend on internet access.
is_connected() {
  local gw
  gw="$(ip route 2>/dev/null | awk '/^default/{print $3; exit}')"
  if [ -z "$gw" ]; then
    return 1
  fi
  ping -c 1 -W 2 "$gw" >/dev/null 2>&1
}

if is_connected; then
  log "WiFi ($WIFI_DEV) connected, no action needed."
  exit 0
fi

log "WiFi ($WIFI_DEV) appears DOWN. Starting reconnect attempts."

# Step 1: ask NetworkManager to reconnect the device to its known profile.
log "Step 1: nmcli device connect $WIFI_DEV"
nmcli device connect "$WIFI_DEV" >/dev/null 2>&1
sleep 8
if is_connected; then
  log "Reconnected after step 1."
  exit 0
fi

# Step 2: toggle the WiFi radio off and on.
log "Step 2: toggling WiFi radio off/on"
nmcli radio wifi off >/dev/null 2>&1
sleep 2
nmcli radio wifi on >/dev/null 2>&1
sleep 10
if is_connected; then
  log "Reconnected after step 2."
  exit 0
fi

# Step 3: restart NetworkManager entirely.
log "Step 3: restarting NetworkManager"
systemctl restart NetworkManager >/dev/null 2>&1
sleep 15
if is_connected; then
  log "Reconnected after step 3."
  exit 0
fi

# Step 4: last resort, bounce the interface directly.
log "Step 4: bouncing interface $WIFI_DEV (ip link down/up)"
ip link set "$WIFI_DEV" down >/dev/null 2>&1
sleep 2
ip link set "$WIFI_DEV" up >/dev/null 2>&1
sleep 10
if is_connected; then
  log "Reconnected after step 4."
  exit 0
fi

log "WiFi still down after all reconnect attempts. Will retry on next timer run."
# Exit 0 so the oneshot service is not marked failed; the timer keeps retrying.
exit 0
