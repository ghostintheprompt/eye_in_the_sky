import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const APP_VERSION = 'v1.0.0';
const GITHUB_REPO = 'ghostintheprompt/electric_eye';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [isAddingCamera, setIsAddingCamera] = useState(false);
  const [newCamera, setNewCamera] = useState({ name: '', ip: '', username: '', password: '' });
  
  const [recordings, setRecordings] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs', 'recordings'

  const fetchCameras = async () => {
    try {
      const response = await axios.get('/api/cameras', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCameras(response.data);
      if (response.data.length > 0 && !selectedCamera) {
        setSelectedCamera(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch cameras');
    }
  };

  const fetchRecordings = async () => {
    try {
      const response = await axios.get('/api/recordings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRecordings(response.data);
    } catch (error) {
      console.error('Failed to fetch recordings');
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await axios.get('/api/incidents', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIncidents(response.data);
    } catch (error) {
      console.error('Failed to fetch incidents');
    }
  };

  const addCamera = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/cameras', newCamera, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIsAddingCamera(false);
      setNewCamera({ name: '', ip: '', username: '', password: '' });
      fetchCameras();
    } catch (error) {
      alert('Failed to add camera to orbit');
    }
  };

  const sendControl = async (action, value) => {
    if (!selectedCamera) return;
    try {
      await axios.post(`/api/control/${selectedCamera.id}`, { action, value }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Log as manual incident if it was a privacy mode toggle
      if (action === 'privacy') {
        await axios.post('/api/incidents', {
          type: 'SYSTEM_COMMAND',
          cameraName: selectedCamera.name,
          description: `Privacy mode ${value ? 'enabled' : 'disabled'}`
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchIncidents();
      }
    } catch (error) {
      console.error('Orbit command failed');
    }
  };

  const toggleRecording = async () => {
    if (!selectedCamera) return;
    if (isRecording) {
      setIsRecording(false);
      setTimeout(fetchRecordings, 2000);
      return;
    }

    try {
      setIsRecording(true);
      await axios.post(`/api/recordings/start/${selectedCamera.id}`, { duration: 30 }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      await axios.post('/api/incidents', {
        type: 'RECORDING_START',
        cameraName: selectedCamera.name,
        description: 'Manual orbital recording initiated (30s)'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchIncidents();
      
      setTimeout(() => {
        setIsRecording(false);
        fetchRecordings();
      }, 30000);
    } catch (error) {
      console.error('Failed to start recording');
      setIsRecording(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    fetchRecordings();
    fetchIncidents();
    const timer = setTimeout(() => checkForUpdates(true), 3000);
    
    // Polling for logs
    const interval = setInterval(fetchIncidents, 10000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const checkForUpdates = async (silent = false) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
      const data = await response.json();
      if (data.tag_name && data.tag_name !== APP_VERSION) {
        setUpdateStatus('available');
      }
    } catch (error) {
      console.error('Update check failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-mono">
      {/* Station Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-xl">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-blue-900 border border-blue-500 rounded flex items-center justify-center">
              <img src="/icon.png" alt="Eye" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter uppercase">Electric Eye</h1>
              <p className="text-xs text-blue-400 font-bold">Orbital Surveillance Station</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={() => setIsAddingCamera(true)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition uppercase font-bold"
            >
              Add Satellite
            </button>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase">Operator</p>
              <p className="text-sm font-bold text-gray-200">{user?.username || 'admin'}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-900 border border-red-600 hover:bg-red-800 text-white px-4 py-2 rounded text-xs font-bold uppercase"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-4 grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
        {/* Satellite List */}
        <div className="col-span-2 bg-gray-800 border border-gray-700 rounded overflow-hidden flex flex-col">
          <div className="bg-gray-900 p-2 border-b border-gray-700">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Satellites</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {cameras.length === 0 && <p className="text-[10px] text-gray-600 p-4 italic text-center">No Satellites in Orbit</p>}
            {cameras.map(cam => (
              <button
                key={cam.id}
                onClick={() => setSelectedCamera(cam)}
                className={`w-full text-left p-3 border-b border-gray-700 hover:bg-gray-700 transition ${selectedCamera?.id === cam.id ? 'bg-gray-700 border-l-4 border-l-blue-500' : ''}`}
              >
                <p className="text-sm font-bold truncate">{cam.name}</p>
                <p className="text-[10px] text-gray-500">{cam.ip}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Viewport */}
        <div className="col-span-7 bg-black border border-gray-700 rounded relative overflow-hidden flex items-center justify-center">
          {selectedCamera ? (
            <div className="w-full h-full flex flex-col">
              <div className="bg-gray-900/80 absolute top-0 left-0 w-full p-2 flex justify-between items-center z-10 border-b border-gray-800">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center">
                  <span className="h-2 w-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                  Live Feed: {selectedCamera.name}
                </span>
                <div className="flex items-center space-x-4">
                  {isRecording && <span className="text-[10px] text-red-500 font-bold animate-pulse tracking-widest">● REC</span>}
                  <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Link Stable</span>
                </div>
              </div>
              <img 
                src={`/api/streams/${selectedCamera.id}?token=${localStorage.getItem('token')}`} 
                alt="Live Stream" 
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-4 right-4 z-10">
                <button 
                  onClick={toggleRecording}
                  className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition shadow-lg ${isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-600'}`}
                >
                  {isRecording ? 'Stop Recording' : 'Initiate Recording'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 uppercase tracking-widest font-bold">No Satellite Linked</p>
              <p className="text-[10px] text-gray-700 mt-2 italic">Select a satellite from the roster to establish connection</p>
            </div>
          )}
        </div>

        {/* Command Panel */}
        <div className="col-span-3 space-y-4 flex flex-col overflow-hidden">
          <div className="bg-gray-800 border border-gray-700 rounded p-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Command Interface</h3>
            <div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto mb-6">
              <div></div>
              <button onClick={() => sendControl('move', 'up')} className="aspect-square bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center border border-gray-600">▲</button>
              <div></div>
              <button onClick={() => sendControl('move', 'left')} className="aspect-square bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center border border-gray-600">◀</button>
              <div className="aspect-square flex items-center justify-center text-blue-500 font-bold text-[10px]">PTZ</div>
              <button onClick={() => sendControl('move', 'right')} className="aspect-square bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center border border-gray-600">▶</button>
              <div></div>
              <button onClick={() => sendControl('move', 'down')} className="aspect-square bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center border border-gray-600">▼</button>
              <div></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => sendControl('privacy', true)}
                className="bg-gray-900 hover:bg-red-900 border border-gray-700 p-2 text-[10px] font-bold uppercase transition"
              >
                Stealth ON
              </button>
              <button 
                onClick={() => sendControl('privacy', false)}
                className="bg-gray-900 hover:bg-green-900 border border-gray-700 p-2 text-[10px] font-bold uppercase transition"
              >
                Stealth OFF
              </button>
            </div>
          </div>

          {/* Tactical Logs / Recordings */}
          <div className="bg-gray-800 border border-gray-700 rounded flex-1 flex flex-col overflow-hidden">
            <div className="flex bg-gray-900 border-b border-gray-700">
              <button 
                onClick={() => setActiveTab('logs')}
                className={`flex-1 p-2 text-[10px] font-bold uppercase tracking-widest transition ${activeTab === 'logs' ? 'text-blue-400 bg-gray-800 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Tactical Logs
              </button>
              <button 
                onClick={() => setActiveTab('recordings')}
                className={`flex-1 p-2 text-[10px] font-bold uppercase tracking-widest transition ${activeTab === 'recordings' ? 'text-blue-400 bg-gray-800 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Footage
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {activeTab === 'logs' ? (
                <div className="space-y-2">
                  {incidents.length === 0 && <p className="text-[10px] text-gray-600 italic text-center py-4">No events logged</p>}
                  {incidents.map(inc => (
                    <div key={inc.id} className="bg-gray-900/50 p-2 rounded border border-gray-700/50 text-[10px]">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-bold ${inc.type.includes('START') ? 'text-red-400' : 'text-blue-400'}`}>{inc.type}</span>
                        <span className="text-gray-600">{new Date(inc.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-400 leading-tight">{inc.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {recordings.length === 0 && <p className="text-[10px] text-gray-600 italic text-center py-4">No footage recorded</p>}
                  {recordings.map(rec => (
                    <div key={rec.filename} className="bg-gray-900/50 p-2 rounded border border-gray-700/50 flex justify-between items-center">
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold truncate">{rec.filename}</p>
                        <p className="text-[8px] text-gray-500">{(rec.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <a 
                        href={`/api/recordings/download/${rec.filename}`}
                        className="p-1 bg-blue-900/50 border border-blue-700 rounded text-blue-400 hover:bg-blue-800 transition text-[10px]"
                        target="_blank"
                        rel="noreferrer"
                      >
                        GET
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Camera Modal */}
      {isAddingCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold uppercase tracking-widest mb-4">Link New Satellite</h2>
            <form onSubmit={addCamera} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-gray-500 mb-1">Satellite Name</label>
                <input 
                  type="text" 
                  value={newCamera.name}
                  onChange={e => setNewCamera({...newCamera, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm focus:border-blue-500 outline-none" 
                  placeholder="e.g. PERIMETER FRONT"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-500 mb-1">Orbital IP Address</label>
                <input 
                  type="text" 
                  value={newCamera.ip}
                  onChange={e => setNewCamera({...newCamera, ip: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm focus:border-blue-500 outline-none" 
                  placeholder="192.168.1.XX"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Pilot Username</label>
                  <input 
                    type="text" 
                    value={newCamera.username}
                    onChange={e => setNewCamera({...newCamera, username: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm focus:border-blue-500 outline-none" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Pilot Password</label>
                  <input 
                    type="password" 
                    value={newCamera.password}
                    onChange={e => setNewCamera({...newCamera, password: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm focus:border-blue-500 outline-none" 
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold p-2 rounded uppercase text-xs">Initialize Link</button>
                <button type="button" onClick={() => setIsAddingCamera(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold p-2 rounded uppercase text-xs">Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
