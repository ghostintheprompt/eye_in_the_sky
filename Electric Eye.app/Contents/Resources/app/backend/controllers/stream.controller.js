const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');

const CAMERAS_FILE = path.join(__dirname, '..', 'data', 'cameras.json');
const activeStreams = new Map();

exports.streamCamera = async (req, res) => {
  const { id } = req.params;
  
  try {
    const cameras = await fs.readJson(CAMERAS_FILE);
    const camera = cameras.find(c => c.id === id);
    
    if (!camera) {
      return res.status(404).json({ message: 'Camera not found' });
    }

    // RTSP URL for Tapo (default stream1 for high quality)
    const rtspUrl = `rtsp://${camera.username}:${camera.password}@${camera.ip}:554/stream1`;

    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
      'Cache-Control': 'no-cache',
      'Connection': 'close',
      'Pragma': 'no-cache'
    });

    const command = ffmpeg(rtspUrl)
      .native()
      .inputOptions([
        '-rtsp_transport tcp',
        '-stimeout 5000000'
      ])
      .outputOptions([
        '-q:v 5',
        '-f mpjpeg',
        '-an' // Disable audio for MJPEG
      ])
      .on('error', (err) => {
        console.error(`Stream error for ${camera.name}:`, err.message);
        activeStreams.delete(id);
      })
      .on('end', () => {
        activeStreams.delete(id);
      });

    command.pipe(res, { end: true });
    activeStreams.set(id, command);

    req.on('close', () => {
      command.kill();
      activeStreams.delete(id);
    });

  } catch (error) {
    res.status(500).json({ message: 'Stream initialization failed' });
  }
};
