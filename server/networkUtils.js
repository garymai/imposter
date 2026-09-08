const os = require('os');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  
  // Prefer Wi-Fi / Ethernet interfaces like en0, en1, eth0, wlan0
  const preferredNames = ['en0', 'en1', 'eth0', 'wlan0'];
  for (const name of preferredNames) {
    if (interfaces[name]) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }

  // Fallback to any non-internal IPv4
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return 'localhost';
}

module.exports = { getLocalIpAddress };
