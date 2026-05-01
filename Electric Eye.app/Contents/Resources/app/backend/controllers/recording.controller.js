const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const RECORDINGS_DIR = path.join(__dirname, '..', 'recordings');
const CAMERAS_FILE = path.join(__dirname, '..', 'data', 'cameras.json');

exports.getRecordings = async (req, res) => {
  try {
    await fs.ensureDir(RECORDINGS_DIR);
    const files = await fs.readdir(RECORDINGS_DIR);
    const recordings = files
      .filter(f => f.endsWith('.mp4'))
      .map(f => ({
        filename: f,
        timestamp: f.split('-')[1].replace('.mp4', ''),
        size: fs.statSync(path.join(RECORDINGS_DIR, f)).size
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
    res.json(recordings);
  } catch (error) {
    res.status(500).json({ message: 'Could not retrieve recordings' });
  }
};

exports.startRecording = async (req, res) => {
  const { id } = req.params;
  const { duration = 60 } = req.body; // Default 60 seconds

  try {
    const cameras = await fs.readJson(CAMERAS_FILE);
    const camera = cameras.find(c => c.id === id);
    if (!camera) return res.status(404).json({ message: 'Camera not found' });

    const rtspUrl = `rtsp://${camera.username}:${camera.password}@${camera.ip}:554/stream1`;
    const filename = `rec-${Date.now()}.mp4`;
    const outputPath = path.join(RECORDINGS_DIR, filename);

    await fs.ensureDir(RECORDINGS_DIR);

    ffmpeg(rtspUrl)
      .inputOptions(['-rtsp_transport tcp'])
      .outputOptions(['-c copy', `-t ${duration}`])
      .on('start', (cmd) => console.log('Started recording:', cmd))
      .on('error', (err) => console.error('Recording error:', err.message))
      .on('end', () => console.log('Recording finished:', filename))
      .save(outputPath);

    res.json({ message: 'Recording initiated', filename });
  } catch (error) {
    res.status(500).json({ message: 'Recording failed to start' });
  }
};

exports.downloadRecording = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(RECORDINGS_DIR, filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ message: 'File not found' });
  }
};
