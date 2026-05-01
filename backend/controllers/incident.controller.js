const fs = require('fs-extra');
const path = require('path');

const INCIDENTS_FILE = path.join(__dirname, '..', 'data', 'incidents.json');

exports.getIncidents = async (req, res) => {
  try {
    if (!(await fs.pathExists(INCIDENTS_FILE))) {
      await fs.writeJson(INCIDENTS_FILE, []);
    }
    const incidents = await fs.readJson(INCIDENTS_FILE);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Could not retrieve incidents' });
  }
};

exports.addIncident = async (req, res) => {
  try {
    const { type, cameraName, description } = req.body;
    
    if (!(await fs.pathExists(INCIDENTS_FILE))) {
      await fs.writeJson(INCIDENTS_FILE, []);
    }
    
    const incidents = await fs.readJson(INCIDENTS_FILE);
    
    const newIncident = {
      id: `INC-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: type || 'MOTION_DETECTED',
      cameraName,
      description: description || `Event triggered on ${cameraName}`,
      status: 'NEW'
    };

    incidents.unshift(newIncident); // Newest first
    await fs.writeJson(INCIDENTS_FILE, incidents);
    res.status(201).json(newIncident);
  } catch (error) {
    res.status(500).json({ message: 'Could not log incident' });
  }
};
