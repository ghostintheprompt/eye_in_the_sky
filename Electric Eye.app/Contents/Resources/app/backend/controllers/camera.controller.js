const fs = require('fs-extra');
const path = require('path');

const CAMERAS_FILE = path.join(__dirname, '..', 'data', 'cameras.json');

exports.getCameras = async (req, res) => {
  try {
    const cameras = await fs.readJson(CAMERAS_FILE);
    // Remove passwords before sending to frontend
    const safeCameras = cameras.map(({ password, ...rest }) => rest);
    res.json(safeCameras);
  } catch (error) {
    res.status(500).json({ message: 'Could not retrieve camera list' });
  }
};

exports.addCamera = async (req, res) => {
  try {
    const { name, ip, username, password, type } = req.body;
    const cameras = await fs.readJson(CAMERAS_FILE);
    
    const newCamera = {
      id: Date.now().toString(),
      name,
      ip,
      username,
      password, // Encrypted at rest in a real prod app, but keeping simple for local workstation
      type: type || 'tapo'
    };

    cameras.push(newCamera);
    await fs.writeJson(CAMERAS_FILE, cameras);
    res.status(201).json({ id: newCamera.id, name: newCamera.name });
  } catch (error) {
    res.status(500).json({ message: 'Could not add camera' });
  }
};

exports.deleteCamera = async (req, res) => {
  try {
    const { id } = req.params;
    let cameras = await fs.readJson(CAMERAS_FILE);
    cameras = cameras.filter(c => c.id !== id);
    await fs.writeJson(CAMERAS_FILE, cameras);
    res.json({ message: 'Camera removed from orbit' });
  } catch (error) {
    res.status(500).json({ message: 'Could not remove camera' });
  }
};
