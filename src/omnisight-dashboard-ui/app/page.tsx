'use client';

import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDesktop, 
  faPlug, 
  faBolt, 
  faMoon, 
  faLock, 
  faPowerOff, 
  faShieldHalved,
  faPaperPlane,
  faCircleNodes,
  faGear,
  faUserShield,
  faBroadcastTower
} from '@fortawesome/free-solid-svg-icons';

interface ClientInfo {
  clientId: string;
  machineName: string;
  lastFrame?: string;
  framesReceived: number;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [authError, setAuthError] = useState('');
  const [token, setToken] = useState<string | null>(null);

  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [changeStatus, setChangeStatus] = useState('');
  
  const [activeTab, setActiveTab] = useState('monitor');
  const [status, setStatus] = useState('Connecting...');
  const [clients, setClients] = useState<Record<string, ClientInfo>>({});
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [screenSrc, setScreenSrc] = useState<string | null>(null);
  const [customMsg, setCustomMsg] = useState('SYSTEM: Immediate Attention Required');
  const [fps, setFps] = useState(5);
  const [quality, setQuality] = useState(30);
  const [isMonitorOn, setIsMonitorOn] = useState(true);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  
  // Refs to allow SignalR handlers to access current state without effect re-runs
  const isMonitorOnRef = useRef(isMonitorOn);
  const selectedClientIdRef = useRef(selectedClientId);
  const fpsRef = useRef(fps);
  const qualityRef = useRef(quality);

  useEffect(() => {
    isMonitorOnRef.current = isMonitorOn;
  }, [isMonitorOn]);

  useEffect(() => {
    selectedClientIdRef.current = selectedClientId;
  }, [selectedClientId]);

  useEffect(() => {
    fpsRef.current = fps;
    qualityRef.current = quality;
  }, [fps, quality]);

  useEffect(() => {
    const hubUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:5000/monitorHub`
      : 'http://localhost:5000/monitorHub';

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveScreenFrame', (frame: any) => {
      setClients(prev => {
        const mName = (frame.machineName || "Unknown").trim();
        const existing = prev[mName] || { 
          clientId: frame.clientId, 
          machineName: mName, 
          framesReceived: 0 
        };
        
        const updatedClientId = frame.data && frame.data.length > 0 ? frame.clientId : existing.clientId;

        return {
          ...prev,
          [mName]: {
            ...existing,
            clientId: updatedClientId,
            machineName: mName,
            framesReceived: frame.data && frame.data.length > 0 ? existing.framesReceived + 1 : existing.framesReceived,
            lastFrame: new Date(frame.timestamp).toLocaleTimeString()
          }
        };
      });

      if (isMonitorOnRef.current && selectedClientIdRef.current) {
         if (frame.clientId === selectedClientIdRef.current || frame.machineName === selectedClientIdRef.current) {
            if (frame.data && frame.data.length > 0) {
              setScreenSrc(`data:image/jpeg;base64,${frame.data}`);
            }
         }
      }
    });

    connection.on('ReceiveSettings', (settings: any) => {
      setFps(settings.targetFps);
      setQuality(settings.jpegQuality);
    });

    connection.start()
      .then(async () => {
        setStatus('Connected');
        connectionRef.current = connection;
        
        const savedToken = localStorage.getItem('omnisight_token');
        if (savedToken) {
          try {
            const isValid = await connection.invoke('ValidateToken', savedToken);
            if (isValid) {
              setToken(savedToken);
              setIsLoggedIn(true);
            } else {
              localStorage.removeItem('omnisight_token');
            }
          } catch (err) {
            localStorage.removeItem('omnisight_token');
          }
        }
        setIsCheckingAuth(false);
      })
      .catch(() => {
        setStatus('Offline');
        setIsCheckingAuth(false);
      });

    return () => { connection.stop(); };
  }, []); // Only run once on mount

  const toggleMonitor = async () => {
    const newState = !isMonitorOn;
    setIsMonitorOn(newState);
    
    if (selectedClientId && connectionRef.current) {
      try {
        await connectionRef.current.invoke('UpdateSettings', selectedClientId, {
          targetFps: Number(fps),
          jpegQuality: Number(quality),
          isStreaming: newState
        });
      } catch (err) {
        console.error('Failed to update streaming state:', err);
      }
    }
  };

  const selectClient = async (clientId: string) => {
    if (selectedClientId === clientId) return;
    
    const prevId = selectedClientId;
    setSelectedClientId(clientId);
    setActiveTab('monitor');

    if (connectionRef.current) {
      try {
        // 1. Turn OFF previous client
        if (prevId) {
          await connectionRef.current.invoke('UpdateSettings', prevId, {
            targetFps: Number(fps),
            jpegQuality: Number(quality),
            isStreaming: false
          });
        }
        // 2. Turn ON new client if monitor is globally "on"
        if (isMonitorOn) {
          await connectionRef.current.invoke('UpdateSettings', clientId, {
            targetFps: Number(fps),
            jpegQuality: Number(quality),
            isStreaming: true
          });
        }
      } catch (err) {
        console.error('Failed to switch client streaming:', err);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (connectionRef.current && !isAuthenticating) {
      setIsAuthenticating(true);
      setAuthError('');
      try {
        const response: any = await connectionRef.current.invoke('Login', { username, password });
        if (response.success) {
          setIsLoggedIn(true);
          setToken(response.token);
          if (trustDevice) {
            localStorage.setItem('omnisight_token', response.token);
          }
          setAuthError('');
        } else {
          setAuthError(response.error);
        }
      } catch (err) {
        setAuthError('Authentication failed');
      } finally {
        setIsAuthenticating(false);
      }
    }
  };

  const handleUpdateCredentials = async () => {
    if (connectionRef.current && token) {
      const success = await connectionRef.current.invoke('ChangeAdminCredentials', { 
        username: newAdminUser, 
        password: newAdminPass 
      }, token);
      
      if (success) {
        setChangeStatus('Security credentials updated successfully.');
        setTimeout(() => setChangeStatus(''), 3000);
      } else {
        setChangeStatus('Failed to update credentials.');
      }
    }
  };

  const sendCommand = async (type: string, targetId: string | null = selectedClientId) => {
    if (connectionRef.current && targetId) {
      try {
        await connectionRef.current.invoke('SendCommand', { 
          targetClientId: targetId, 
          type, 
          payload: type === 'Message' ? customMsg : "" 
        });
        console.log(`Sent ${type} to ${targetId}`);
      } catch (err) {
        console.error('SignalR Invoke Error:', err);
      }
    }
  };

  const updateSettings = async () => {
    if (connectionRef.current) {
      await connectionRef.current.invoke('UpdateSettings', "all", {
        targetFps: Number(fps),
        jpegQuality: Number(quality),
        isStreaming: false // Globally disable streaming by default to optimize network
      });
      // Then re-enable only for the selected client if needed
      if (selectedClientId && isMonitorOn) {
        await connectionRef.current.invoke('UpdateSettings', selectedClientId, {
          targetFps: Number(fps),
          jpegQuality: Number(quality),
          isStreaming: true
        });
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
      <style dangerouslySetInnerHTML={{ __html: `
        input::-ms-reveal,
        input::-ms-clear {
          filter: invert(100%);
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white !important;
          -webkit-box-shadow: 0 0 0px 1000px #020617 inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}} />
      {isCheckingAuth ? (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
           <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Restoring Session</p>
        </div>
      ) : !isLoggedIn ? (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
          <div className="w-full max-w-md">
            <div className="bg-slate-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black tracking-tighter">OMNISIGHT</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Secure Admin Access</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isAuthenticating}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner disabled:opacity-50 outline-none"
                      placeholder="Enter administrator ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isAuthenticating}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner disabled:opacity-50 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 px-2">
                   <input 
                    type="checkbox" 
                    id="trust" 
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    disabled={isAuthenticating}
                    className="w-4 h-4 rounded border-white/10 bg-black/40 checked:bg-blue-600 focus:ring-0 transition-all cursor-pointer disabled:opacity-50"
                   />
                   <label htmlFor="trust" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none">Trust this device</label>
                </div>

                {authError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest p-4 rounded-xl text-center animate-shake">
                    {authError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isAuthenticating}
                  className="w-full bg-white text-black py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isAuthenticating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faShieldHalved} className="text-xs" />
                      Login
                    </>
                  )}
                </button>
              </form>
            </div>
            <p className="text-center mt-8 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              Access is restricted to authorized network administrators only.
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-[1400px] mx-auto p-6">
        <header className="flex justify-between items-center mb-10 bg-slate-900/30 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold tracking-tight">OMNISIGHT</h1>
            {selectedClientId && (
              <nav className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                {[
                  { id: 'monitor', label: 'monitor', icon: faDesktop },
                  { id: 'broadcast', label: 'broadcast', icon: faBroadcastTower },
                  { id: 'settings', label: 'settings', icon: faGear }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="text-[10px]" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-4 bg-slate-900/50 px-5 py-2.5 rounded-2xl border border-white/5">
             <div className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{status}</span>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Active Devices List */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
             <div className="bg-slate-900/20 p-4 rounded-[2.5rem] border border-white/5">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 px-4 pt-2">Active Devices</h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                   {Object.values(clients).map(client => (
                     <button
                       key={client.machineName}
                       onClick={() => selectClient(client.clientId)}
                       className={`w-full text-left p-5 rounded-3xl transition-all duration-300 ${
                         selectedClientId === client.clientId 
                         ? 'bg-white text-black shadow-2xl' 
                         : 'bg-slate-900/40 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/5'
                       }`}
                     >
                        <div className="font-bold text-sm mb-1">{client.machineName}</div>
                        <div className="text-[9px] font-mono opacity-60 uppercase tracking-tighter">Status: {client.framesReceived > 0 ? 'Active' : 'Standby'}</div>
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="col-span-12 lg:col-span-9">
             {!selectedClientId ? (
                <div className="h-[600px] bg-slate-900/10 border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center opacity-30">
                   <FontAwesomeIcon icon={faDesktop} className="text-5xl mb-6" />
                   <p className="text-[11px] font-bold uppercase tracking-[0.3em]">Select a device to monitor</p>
                </div>
             ) : (
                <div className="space-y-6">
                   {activeTab === 'monitor' && (
                      <div className="animate-in fade-in duration-500">
                         <div className="bg-black rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden aspect-video relative flex items-center justify-center">
                            {isMonitorOn && screenSrc ? (
                               <img src={screenSrc} alt="Live Stream" className="w-full h-full object-contain" />
                            ) : (
                               <div className="text-center space-y-6">
                                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2 ${isMonitorOn ? 'border-white/10' : 'border-red-500/20 bg-red-500/5'}`}>
                                    {isMonitorOn ? <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div> : <FontAwesomeIcon icon={faMoon} className="text-xl opacity-40" />}
                                  </div>
                                  <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.4em]">{isMonitorOn ? 'Receiving Active Feed' : 'Monitor Standby Mode'}</p>
                               </div>
                            )}
                            
                            {/* Overlay Controls */}
                            <div className="absolute top-8 left-8 flex gap-3">
                               <span className={`text-[10px] font-black px-4 py-2 rounded-2xl shadow-2xl transition-colors flex items-center gap-2 ${isMonitorOn ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                 <div className={`w-1.5 h-1.5 rounded-full ${isMonitorOn ? 'bg-white animate-pulse' : 'bg-slate-600'}`}></div>
                                 {isMonitorOn ? 'LIVE FEED' : 'OFFLINE'}
                               </span>
                            </div>

                            <button 
                              onClick={toggleMonitor}
                              className={`absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl border transition-all shadow-2xl ${isMonitorOn ? 'bg-black/60 border-white/10 text-white hover:bg-red-600 hover:border-red-400' : 'bg-green-600 border-green-400 text-white animate-pulse'}`}
                              title={isMonitorOn ? "Turn Off Monitor" : "Turn On Monitor"}
                            >
                               <FontAwesomeIcon icon={isMonitorOn ? faPlug : faBolt} />
                            </button>
                         </div>
                      </div>
                   )}

                   {activeTab === 'broadcast' && (
                      <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
                         <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
                            <div className="space-y-4">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Message Broadcast Content</label>
                               <textarea 
                                 value={customMsg}
                                 onChange={(e) => setCustomMsg(e.target.value)}
                                 className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-all h-48 shadow-inner"
                               />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <button onClick={() => sendCommand('Message')} className="bg-white text-black p-5 rounded-3xl text-[11px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3">
                                  <FontAwesomeIcon icon={faPaperPlane} className="text-[10px]" />
                                  Send Message
                               </button>
                               <button onClick={() => sendCommand('Message', 'all')} className="bg-slate-800 text-white p-5 rounded-3xl text-[11px] font-black uppercase tracking-wider hover:bg-slate-700 transition-all active:scale-95 border border-white/5 flex items-center justify-center gap-3">
                                  <FontAwesomeIcon icon={faCircleNodes} className="text-[10px]" />
                                  Send to All
                               </button>
                            </div>
                         </div>

                         <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 flex justify-center gap-12 shadow-xl">
                            <button onClick={() => sendCommand('Lock')} className="flex items-center gap-5 group">
                               <div className="w-16 h-16 bg-slate-800 rounded-[1.5rem] flex items-center justify-center text-xl group-hover:bg-blue-600 transition-all border border-white/5">
                                  <FontAwesomeIcon icon={faLock} />
                               </div>
                               <div className="text-left">
                                  <div className="text-xs font-black uppercase tracking-widest">Lock Computer</div>
                                  <div className="text-[9px] text-slate-500 font-bold mt-1 uppercase">Instant Lock</div>
                               </div>
                            </button>
                            <div className="w-px bg-white/5 h-16"></div>
                            <button onClick={() => sendCommand('Shutdown')} className="flex items-center gap-5 group">
                               <div className="w-16 h-16 bg-red-950/20 rounded-[1.5rem] flex items-center justify-center text-xl group-hover:bg-red-600 transition-all border border-red-900/20">
                                  <FontAwesomeIcon icon={faPowerOff} className="text-red-500 group-hover:text-white" />
                               </div>
                               <div className="text-left">
                                  <div className="text-xs font-black uppercase tracking-widest text-red-500">Shutdown Computer</div>
                                  <div className="text-[9px] text-slate-700 font-bold mt-1 uppercase">Emergency Power</div>
                               </div>
                            </button>
                         </div>
                      </div>
                   )}

                   {activeTab === 'settings' && (
                      <div className="max-w-2xl mx-auto animate-in fade-in duration-300 space-y-12 pb-12">
                         <div className="bg-slate-900/40 p-12 rounded-[3.5rem] border border-white/5 space-y-12 shadow-2xl">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] text-center">Optimization Profiles</h3>
                            <div className="space-y-10">
                               <div className="space-y-5">
                                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                                     <span>Frame Rate</span>
                                     <span className="text-blue-500">{fps} FPS</span>
                                  </div>
                                  <input type="range" min="1" max="30" value={fps} onChange={(e) => setFps(Number(e.target.value))} className="w-full h-1.5 bg-black rounded-full appearance-none cursor-pointer accent-white" />
                               </div>
                               <div className="space-y-5">
                                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                                     <span>Fidelity</span>
                                     <span className="text-emerald-500">{quality}%</span>
                                  </div>
                                  <input type="range" min="5" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full h-1.5 bg-black rounded-full appearance-none cursor-pointer accent-white" />
                               </div>
                            </div>
                            <button onClick={updateSettings} className="w-full bg-white text-black p-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-200 transition-all active:scale-95">Commit Global settings</button>
                         </div>

                         {/* Admin Credential Change */}
                         <div className="bg-slate-900/40 p-12 rounded-[3.5rem] border border-white/5 space-y-12 shadow-2xl">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] text-center">Update Access Credentials</h3>
                            <div className="space-y-6">
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">New Admin Username</label>
                                  <input 
                                    type="text" 
                                    value={newAdminUser} 
                                    onChange={(e) => setNewAdminUser(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-inner text-slate-300"
                                    placeholder="Enter new username"
                                  />
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">New Admin Password</label>
                                  <input 
                                    type="password" 
                                    value={newAdminPass} 
                                    onChange={(e) => setNewAdminPass(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-inner text-slate-300"
                                    placeholder="••••••••"
                                  />
                               </div>
                            </div>
                            
                            {changeStatus && (
                              <div className={`text-[10px] font-black uppercase tracking-widest text-center p-4 rounded-xl border ${changeStatus.includes('success') ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                {changeStatus}
                              </div>
                            )}

                            <button onClick={handleUpdateCredentials} className="w-full bg-slate-800 text-white p-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-700 transition-all active:scale-95 border border-white/5 flex items-center justify-center gap-3">
                               <FontAwesomeIcon icon={faUserShield} className="text-[10px]" />
                               Update Credentials
                            </button>
                         </div>
                      </div>
                   )}
                </div>
             )}
          </div>
        </div>
      </div>
      )}
    </main>
  );
}
