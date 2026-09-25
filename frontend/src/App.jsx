import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

export default function App() {
  const [data, setData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = async () => {
    // Step 1: Find the absolute newest record in the database
    const { data: latestRecord, error: latestErr } = await supabase
      .from('water_data')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (latestErr || !latestRecord || latestRecord.length === 0) {
      setLoading(false);
      return;
    }

    // Step 2: Calculate 30 minutes BEFORE that newest record
    const newestTime = new Date(latestRecord[0].created_at).getTime();
    const thirtyMinsBeforeNewest = new Date(newestTime - 30 * 60 * 1000).toISOString();
    
    // Step 3: Fetch all data within that specific 30-minute window of activity
    const { data: telemetry, error } = await supabase
      .from('water_data')
      .select('*')
      .gte('created_at', thirtyMinsBeforeNewest)
      .order('created_at', { ascending: false })
      .limit(500); // Safety limit to prevent browser lag if sensor spams too fast

    if (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      return;
    }

    if (telemetry && telemetry.length > 0) {
      const chartData = [...telemetry].reverse().map(item => {
        let percent = ((22 - item.water_level_cm) / 22) * 100;
        percent = Math.max(0, Math.min(100, percent));
        
        // Convert to IST (Indian Standard Time)
        const dateObj = new Date(item.created_at);
        const timeLabel = dateObj.toLocaleTimeString('en-IN', { 
          timeZone: 'Asia/Kolkata', 
          hour12: false 
        });

        return {
          ...item,
          timeLabel,
          volumePercent: percent
        };
      });
      setData(chartData);
      setLatest(chartData[chartData.length - 1]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTelemetry();
    
    // Supabase Realtime Subscription
    const channel = supabase
      .channel('public:water_data')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'water_data' }, () => {
        fetchTelemetry();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500 font-semibold uppercase tracking-wider">Loading Telemetry...</p></div>;
  if (!latest) return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500 font-semibold uppercase tracking-wider">No telemetry data found.</p></div>;

  // Water Safety Logic (Adjusted for real-world salt/mud thresholds)
  const isTdsSafe = latest.tds_ppm <= 1200;
  const isTurbiditySafe = latest.turbidity_ntu <= 50;
  const isTotallySafe = isTdsSafe && isTurbiditySafe;
  
  let safetyColor = "bg-green-500";
  let safetyLabel = "SAFE TO DRINK";
  let safetyPercent = 100;
  
  if (!isTotallySafe) {
    safetyColor = "bg-red-500";
    safetyLabel = "CONTAMINATED";
    safetyPercent = 15;
  } else if (latest.tds_ppm > 800 || latest.turbidity_ntu > 20) {
    safetyColor = "bg-yellow-500";
    safetyLabel = "MARGINAL QUALITY";
    safetyPercent = 50;
  }

  // Live Drain Rate Calculation
  let timeUntilEmpty = "No Consumption";
  let forecastColor = "text-slate-800";
  
  if (data.length >= 5) {
    const latestPoint = data[data.length - 1];
    const oldPoint = data[data.length - 5]; // Look back roughly 20 seconds
    
    // Time difference in seconds
    const timeDiffSec = (new Date(latestPoint.created_at).getTime() - new Date(oldPoint.created_at).getTime()) / 1000;
    // Volume difference (Positive = Draining)
    const volDiffPercent = oldPoint.volumePercent - latestPoint.volumePercent; 
    
    if (volDiffPercent > 0.2 && timeDiffSec > 0) { // Actively Draining
      const drainRatePerSec = volDiffPercent / timeDiffSec;
      const secondsToEmpty = latestPoint.volumePercent / drainRatePerSec;
      
      if (secondsToEmpty < 120) {
        timeUntilEmpty = `${Math.round(secondsToEmpty)} Seconds`;
        forecastColor = "text-red-500";
      } else {
        timeUntilEmpty = `${Math.round(secondsToEmpty / 60)} Minutes`;
        forecastColor = "text-orange-500";
      }
    } else if (volDiffPercent < -0.2) { // Actively Filling
      timeUntilEmpty = "Refilling...";
      forecastColor = "text-blue-500";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      
      <header className="mb-8 border-b border-slate-300 pb-4">
        <h1 className="text-3xl font-bold text-slate-900">Aqua Sentinel</h1>
      </header>

      {/* Top Visuals & Current Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* 2D Tanks Display */}
        <div className="bg-white border border-slate-200 rounded p-8 flex justify-around items-end h-80 shadow-sm">
          
          {/* Tank 1: Water Volume */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-48 border-4 border-slate-700 rounded-b-xl relative bg-slate-100 overflow-hidden mb-4">
              <div 
                className="absolute bottom-0 w-full bg-blue-500 transition-all duration-1000 ease-in-out" 
                style={{ height: `${latest.volumePercent}%` }} 
              />
            </div>
            <p className="font-bold text-slate-700 uppercase tracking-wide text-xs">Current Volume</p>
            <p className="text-xl font-bold text-slate-900">{latest.volumePercent.toFixed(1)}%</p>
          </div>

          {/* Tank 2: Drinkability / Safety */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-48 border-4 border-slate-700 rounded-b-xl relative bg-slate-100 overflow-hidden mb-4">
              <div 
                className={`absolute bottom-0 w-full ${safetyColor} transition-all duration-1000 ease-in-out`} 
                style={{ height: `${safetyPercent}%` }} 
              />
            </div>
            <p className="font-bold text-slate-700 uppercase tracking-wide text-xs">Safety Status</p>
            <p className={`text-xs font-bold mt-1 px-3 py-1 rounded text-white ${safetyColor}`}>
              {safetyLabel}
            </p>
          </div>
        </div>

        {/* Current Stat Cards (Now a 1x3 Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm flex flex-col justify-center">
             <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Time To Empty (Live)</p>
             <p className={`text-3xl font-bold ${forecastColor}`}>{timeUntilEmpty}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm flex flex-col justify-center">
             <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Total Dissolved Solids</p>
             <p className="text-3xl font-medium text-slate-800">{latest.tds_ppm} <span className="text-lg text-slate-500 font-normal">PPM</span></p>
             <p className="text-xs text-slate-400 mt-1 font-semibold text-red-500">Danger Zone: &gt; 1200 PPM</p>
          </div>
          
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm flex flex-col justify-center">
             <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Turbidity</p>
             <p className="text-3xl font-medium text-slate-800">{latest.turbidity_ntu} <span className="text-lg text-slate-500 font-normal">NTU</span></p>
             <p className="text-xs text-slate-400 mt-1 font-semibold text-red-500">Danger Zone: &gt; 50 NTU</p>
          </div>
        </div>
      </div>

      {/* 3 Separate Graphs */}
      <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-300 pb-2">Historical Telemetry (T=0 to T=-30 mins)</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph 1: Volume */}
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm h-64">
          <p className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2">Volume (%)</p>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={10} tickMargin={5} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <ReferenceArea y1={0} y2={20} fill="#fecaca" fillOpacity={0.3} />
              <Line type="monotone" dataKey="volumePercent" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Graph 2: TDS */}
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm h-64">
          <p className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2">TDS (PPM)</p>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={10} tickMargin={5} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              {/* Omit y2 so the danger zone extends infinitely upwards to the top of the graph! */}
              <ReferenceArea y1={1200} fill="#fecaca" fillOpacity={0.3} />
              <Line type="monotone" dataKey="tds_ppm" stroke="#64748b" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Graph 3: Turbidity */}
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm h-64">
          <p className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-2">Turbidity (NTU)</p>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={10} tickMargin={5} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <ReferenceArea y1={50} fill="#fecaca" fillOpacity={0.3} />
              <Line type="monotone" dataKey="turbidity_ntu" stroke="#475569" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
}
