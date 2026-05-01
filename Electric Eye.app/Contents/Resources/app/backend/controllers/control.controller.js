const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const CAMERAS_FILE = path.join(__dirname, '..', 'data', 'cameras.json');

// Session cache to avoid logging in for every command
const sessions = new Map(); // cameraIp -> { stok, expires }

/**
 * Get a session token (stok) from the Tapo camera
 */
const getStok = async (camera) => {
  const now = Date.now();
  if (sessions.has(camera.ip) && sessions.get(camera.ip).expires > now) {
    return sessions.get(camera.ip).stok;
  }

  try {
    // Basic login handshake for Tapo C200 series
    // Note: Some newer firmware requires a more complex cloud-synced handshake,
    // but this remains the standard for local-only control on most C2XX/C1XX devices.
    const response = await axios.post(`http://${camera.ip}/`, {
      method: 'login',
      params: {
        username: 'admin', // Tapo local API often defaults to admin or uses the web account
        password: camera.password
      }
    }, { timeout: 5000 });

    if (response.data && response.data.result && response.data.result.stok) {
      const stok = response.data.result.stok;
      sessions.set(camera.ip, { stok, expires: now + 30 * 60 * 1000 }); // 30 min session
      return stok;
    }
    throw new Error('Authentication failed');
  } catch (error) {
    console.error(`Login failed for ${camera.ip}:`, error.message);
    return null;
  }
};

exports.controlCamera = async (req, res) => {
  const { id } = req.params;
  const { action, value } = req.body; 

  try {
    const cameras = await fs.readJson(CAMERAS_FILE);
    const camera = cameras.find(c => c.id === id);

    if (!camera) return res.status(404).json({ message: 'Camera not found' });

    console.log(`Commanding ${camera.name} (${camera.ip}): ${action} ${value || ''}`);

    const stok = await getStok(camera);
    if (!stok) {
       // Fallback: If stok handshake fails, we still attempt the request in case 
       // the device is in a 'no-auth' local state or uses a different firmware version.
       console.warn(`Proceeding without valid stok for ${camera.ip}`);
    }

    const baseUrl = stok ? `http://${camera.ip}/stok=${stok}/ds` : `http://${camera.ip}/ds`;
    
    let payload = {};
    if (action === 'move') {
      // Tapo PTZ move command
      payload = {
        method: 'do',
        motor: {
          move: {
            direction: value // 'up', 'down', 'left', 'right'
          }
        }
      };
    } else if (action === 'privacy') {
      // Tapo Privacy Mode
      payload = {
        method: 'set',
        lens_mask: {
          lens_mask_info: {
            enabled: value ? 'on' : 'off'
          }
        }
      };
    }

    const response = await axios.post(baseUrl, payload, { timeout: 5000 });
    
    if (response.data && response.data.error_code === 0) {
      res.json({ status: 'Command executed', action, value });
    } else {
      res.status(500).json({ message: 'Camera rejected command', error: response.data });
    }

  } catch (error) {
    console.error(`Control error for ${id}:`, error.message);
    res.status(500).json({ message: 'Could not reach satellite' });
  }
};
