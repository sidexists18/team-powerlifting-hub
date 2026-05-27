import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- LEADERSHIP COUNCIL EMAILS ---
const VICE_CAPTAINS = [
  'sidhantbhutani1801@gmail.com',
  'f20240535@goa.bits-pilani.ac.in',
  'f20241051@goa.bits-pilani.ac.in'
];

// --- IPF GL MATH ENGINE ---
const calculateIPFGL = (squat, bench, deadlift, bw) => {
  if (!bw || bw <= 0) return 0;
  const total = (squat || 0) + (bench || 0) + (deadlift || 0);
  if (total === 0) return 0;
  const A = 1199.72839, B = 1025.18162, C = 0.00921;
  return parseFloat(((total * 100) / (A - B * Math.exp(-C * bw))).toFixed(2));
};

// --- DOTS MATH ENGINE ---
const calculateDOTS = (total, bw) => {
  if (!bw || bw <= 0 || total === 0) return 0;
  const a = -307.27237, b = 24.0900756, c = -0.1918759221, d = 0.0007391293, e = -0.0000010930;
  return parseFloat(((total * 500) / (a + b * bw + c * Math.pow(bw, 2) + d * Math.pow(bw, 3) + e * Math.pow(bw, 4))).toFixed(2));
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'classic');

  // --- NEW USER ONBOARDING STATES ---
  const [registrationName, setRegistrationName] = useState('');
  const [showNameForm, setShowNameForm] = useState(false);

  // --- LIFT UPDATE STATES ---
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [squat, setSquat] = useState('');
  const [bench, setBench] = useState('');
  const [deadlift, setDeadlift] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [liftHistory, setLiftHistory] = useState([]);
  const [chartMetric, setChartMetric] = useState('total');

  // --- TRAINING LOG STATES ---
  const [logMovementSelect, setLogMovementSelect] = useState('Squat');
  const [customMovement, setCustomMovement] = useState('');
  const [logWeight, setLogWeight] = useState('');
  const [logSets, setLogSets] = useState(''); 
  const [logReps, setLogReps] = useState('');
  const [logRpe, setLogRpe] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]); 
  const [isLogging, setIsLogging] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState([]);
  
  // --- MANAGEMENT MONITOR STATES ---
  const [allProfiles, setAllProfiles] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [athleteTrainingHistory, setAthleteTrainingHistory] = useState([]);
  const [expandedMonitorDates, setExpandedMonitorDates] = useState({});

  // --- TOGGLES & EDITS ---
  const [expandedDates, setExpandedDates] = useState({}); 
  const [expandedExercises, setExpandedExercises] = useState({}); 
  const [editingLogId, setEditingLogId] = useState(null);
  const [editWeight, setEditWeight] = useState(''); 
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState(''); 
  const [editRpe, setEditRpe] = useState('');

  // --- TABS & LEADERBOARDS ---
  const [activeTab, setActiveTab] = useState('training-log');
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('ipf');

  // --- NUTRITION & GALLERY STATES ---
  const [targetCalories, setTargetCalories] = useState(parseInt(localStorage.getItem('cal-target')) || 2500);
  const [targetProtein, setTargetProtein] = useState(parseInt(localStorage.getItem('macro-p-target')) || 160);
  const [targetCarbs, setTargetCarbs] = useState(parseInt(localStorage.getItem('macro-c-target')) || 250);
  const [targetFats, setTargetFats] = useState(parseInt(localStorage.getItem('macro-f-target')) || 70);
  const [foodName, setFoodName] = useState(''); const [foodCalories, setFoodCalories] = useState('');
  const [foodProtein, setFoodProtein] = useState(''); const [foodCarbs, setFoodCarbs] = useState('');
  const [foodFats, setFoodFats] = useState(''); const [dailyFoods, setDailyFoods] = useState(JSON.parse(localStorage.getItem('cal-foods-v2')) || []);
  const [imageFileString, setImageFileString] = useState(''); const [imageCaption, setImageCaption] = useState('');
  const [galleryImages, setGalleryImages] = useState(JSON.parse(localStorage.getItem('team-gallery-v3')) || []);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('app-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('cal-target', targetCalories); localStorage.setItem('macro-p-target', targetProtein); localStorage.setItem('macro-c-target', targetCarbs); localStorage.setItem('macro-f-target', targetFats); }, [targetCalories, targetProtein, targetCarbs, targetFats]);
  useEffect(() => { localStorage.setItem('cal-foods-v2', JSON.stringify(dailyFoods)); }, [dailyFoods]);
  useEffect(() => { localStorage.setItem('team-gallery-v3', JSON.stringify(galleryImages)); }, [galleryImages]);

  // --- AUTO-PROFILER FUNCTION ---
  const fetchProfile = async (userId) => {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (profileData) {
      setProfile(profileData);
      if (profileData.full_name) setDisplayNameInput(profileData.full_name);
      setShowNameForm(false);
    } else {
      setShowNameForm(true);
    }
  };

  const handleRegisterProfile = async (e) => {
    e.preventDefault();
    if (!registrationName.trim()) return;

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{ id: session.user.id, full_name: registrationName.trim(), is_approved: false }])
      .select()
      .single();

    if (newProfile) {
      setProfile(newProfile);
      if (newProfile.full_name) setDisplayNameInput(newProfile.full_name);
      setShowNameForm(false);
    } else {
      console.error("Profile registration error:", insertError);
      alert("Failed to register name parameters. Verify database connection permissions.");
    }
  };

  const fetchLiftHistory = async (userId) => {
    const { data } = await supabase.from('lift_history').select('*').eq('user_id', userId).order('date', { ascending: true });
    if (data) setLiftHistory(data);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
      const enriched = data.map(athlete => {
        const s = athlete.best_squat || 0, b = athlete.best_bench || 0, d = athlete.best_deadlift || 0, bw = athlete.current_bodyweight || 1, total = s + b + d;
        return { ...athlete, squat: s, bench: b, deadlift: d, total, bw, glScore: calculateIPFGL(s, b, d, bw), dotsScore: calculateDOTS(total, bw), bwRatio: parseFloat((total / bw).toFixed(2)) };
      });
      setLeaderboard(enriched);
      setAllProfiles(data); 
    }
  };

  const fetchTrainingLogs = async (userId) => {
    const { data } = await supabase.from('training_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).order('sets', { ascending: true });
    if (data) setTrainingHistory(data);
  };

  const fetchSelectedAthleteLogs = async (athleteId) => {
    if (!athleteId) return;
    const { data } = await supabase.from('training_logs').select('*').eq('user_id', athleteId).order('date', { ascending: false }).order('sets', { ascending: true });
    if (data) setAthleteTrainingHistory(data);
  };

  useEffect(() => { if (selectedAthleteId) fetchSelectedAthleteLogs(selectedAthleteId); }, [selectedAthleteId]);

  const toggleDateGroup = (dateKey) => {
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const toggleExerciseGroup = (dateKey, mKey) => {
    const combineKey = `${dateKey}-${mKey}`;
    setExpandedExercises(prev => ({ ...prev, [combineKey]: !prev[combineKey] }));
  };

  const getSortedLeaderboard = () => {
    return [...leaderboard].sort((a, b) => {
      if (sortBy === 'ipf') return b.glScore - a.glScore; if (sortBy === 'dots') return b.dotsScore - a.dotsScore;
      if (sortBy === 'ratio') return b.bwRatio - a.bwRatio; if (sortBy === 'squat') return b.squat - a.squat;
      if (sortBy === 'bench') return b.bench - a.bench; if (sortBy === 'deadlift') return b.deadlift - a.deadlift;
      if (sortBy === 'total') return b.total - a.total; return 0;
    });
  };

  const compileNestedLogStructure = (flatLogsArray) => {
    const structure = {};
    flatLogsArray.forEach(log => {
      const dKey = log.date, mKey = log.movement;
      if (!structure[dKey]) structure[dKey] = {}; if (!structure[dKey][mKey]) structure[dKey][mKey] = [];
      structure[dKey][mKey].push(log);
    });
    return structure;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); if (session) { fetchProfile(session.user.id); fetchLiftHistory(session.user.id); fetchLeaderboard(); fetchTrainingLogs(session.user.id); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); if (session) { fetchProfile(session.user.id); fetchLiftHistory(session.user.id); fetchLeaderboard(); fetchTrainingLogs(session.user.id); } else { setProfile(null); setLiftHistory([]); setLeaderboard([]); setTrainingHistory([]); setShowNameForm(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    if (activeTab === 'leaderboard' || activeTab === 'monitor') fetchLeaderboard();
    if (activeTab === 'dashboard') { fetchProfile(session.user.id); fetchLiftHistory(session.user.id); }
    if (activeTab === 'training-log') fetchTrainingLogs(session.user.id);
  }, [activeTab]);

  const handleGoogleLogin = async () => { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' }); if (error) setErrorMsg(error.message); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleUpdateStats = async (e) => {
    e.preventDefault(); setIsUpdating(true);
    const sVal = parseFloat(squat), bVal = parseFloat(bench), dVal = parseFloat(deadlift), bwVal = parseFloat(bodyweight), calculatedTotal = sVal + bVal + dVal;
    const finalName = displayNameInput.trim() || profile?.full_name || 'Athlete';

    const { error: pErr } = await supabase.from('profiles').update({ 
      best_squat: sVal, best_bench: bVal, best_deadlift: dVal, current_bodyweight: bwVal, full_name: finalName
    }).eq('id', session.user.id);

    const { error: hErr } = await supabase.from('lift_history').insert([{ user_id: session.user.id, date: updateDate, bodyweight: bwVal, squat: sVal, bench: bVal, deadlift: dVal, total: calculatedTotal }]);
    if (!pErr && !hErr) { fetchProfile(session.user.id); fetchLiftHistory(session.user.id); fetchLeaderboard(); setSquat(''); setBench(''); setDeadlift(''); setBodyweight(''); }
    setIsUpdating(false);
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm("Are you sure you want to permanently delete this milestone entry?")) return;
    const { error: deleteError } = await supabase.from('lift_history').delete().eq('id', milestoneId);
    if (deleteError) { alert("Error deleting milestone: " + deleteError.message); return; }

    const { data: remainingPoints, error: fetchError } = await supabase.from('lift_history').select('*').eq('user_id', session.user.id).order('date', { ascending: true });
    if (!fetchError) {
      setLiftHistory(remainingPoints);
      if (remainingPoints.length > 0) {
        const primaryPeak = remainingPoints[remainingPoints.length - 1];
        await supabase.from('profiles').update({ best_squat: primaryPeak.squat, best_bench: primaryPeak.bench, best_deadlift: primaryPeak.deadlift, current_bodyweight: primaryPeak.bodyweight }).eq('id', session.user.id);
      } else {
        await supabase.from('profiles').update({ best_squat: 0, best_bench: 0, best_deadlift: 0, current_bodyweight: 0 }).eq('id', session.user.id);
      }
      fetchProfile(session.user.id); fetchLeaderboard();
    }
  };

  const handleLogWorkout = async (e) => {
    e.preventDefault(); setIsLogging(true);
    const finalMovement = logMovementSelect === 'Accessory' ? customMovement : logMovementSelect;
    if (!finalMovement.trim()) { alert("Please provide an exercise name."); setIsLogging(false); return; }
    const { error } = await supabase.from('training_logs').insert([{ user_id: session.user.id, date: logDate, movement: finalMovement, weight_kg: parseFloat(logWeight), sets: parseInt(logSets), reps: parseInt(logReps), rpe: logRpe ? parseFloat(logRpe) : null }]);
    if (!error) { fetchTrainingLogs(session.user.id); setLogWeight(''); setLogSets(''); setLogReps(''); setLogRpe(''); setCustomMovement(''); }
    setIsLogging(false);
  };

  const handleDeleteLog = async (id) => { if (!window.confirm("Are you sure you want to delete this set?")) return; const { error } = await supabase.from('training_logs').delete().eq('id', id); if (!error) fetchTrainingLogs(session.user.id); };
  
  const startEditing = (log) => { 
    setEditingLogId(log.id); 
    setEditWeight(log.weight_kg); 
    setEditSets(log.sets); 
    setEditReps(log.reps); 
    setEditRpe(log.rpe || ''); 
  };
  
  const handleUpdateLog = async (id) => {
    const { error } = await supabase.from('training_logs').update({ weight_kg: parseFloat(editWeight), sets: parseInt(editSets), reps: parseInt(editReps), rpe: editRpe ? parseFloat(editRpe) : null }).eq('id', id);
    if (!error) { setEditingLogId(null); fetchTrainingLogs(session.user.id); }
  };

  const handleAddCalories = (e) => {
    e.preventDefault(); if (!foodName || !foodCalories) return;
    setDailyFoods([{ id: Date.now(), name: foodName, calories: parseInt(foodCalories), protein: parseInt(foodProtein) || 0, carbs: parseInt(foodCarbs) || 0, fats: parseInt(foodFats) || 0 }, ...dailyFoods]);
    setFoodName(''); setFoodCalories(''); setFoodProtein(''); setFoodCarbs(''); setFoodFats('');
  };
  const clearCalories = () => { if (window.confirm("Reset your nutrition log for today?")) setDailyFoods([]); };

  const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onloadend = () => { setImageFileString(r.result); }; r.readAsDataURL(file); };
  const handleAddImage = (e) => { e.preventDefault(); if (!imageFileString) return; setGalleryImages([{ id: Date.now(), url: imageFileString, caption: imageCaption || 'Fun lift content' }, ...galleryImages]); setImageFileString(''); setImageCaption(''); document.getElementById('gallery-file-input').value = ''; };
  const handleDeleteImage = (id) => { if (window.confirm("Remove image?")) setGalleryImages(galleryImages.filter(img => img.id !== id)); };

  const headingStyle = (metric) => { return sortBy === metric ? { backgroundColor: 'var(--accent-color)', color: 'var(--accent-text)' } : {}; };

  const renderSvgLineGraph = () => {
    if (liftHistory.length < 2) return <div className="p-8 text-center text-sm italic" style={{ color: 'var(--text-muted)' }}>Log at least 2 distinct date updates to compile a trajectory chart view.</div>;
    const width = 600, height = 200, padding = 35;
    const dataPoints = liftHistory.map(h => ({ dateStr: h.date, val: chartMetric === 'total' ? h.total : chartMetric === 'squat' ? h.squat : chartMetric === 'bench' ? h.bench : h.deadlift }));
    const vals = dataPoints.map(p => p.val), minVal = Math.min(...vals) * 0.95, maxVal = Math.max(...vals) * 1.05, valRange = maxVal - minVal || 1;
    const points = dataPoints.map((p, idx) => ({ x: padding + (idx / (dataPoints.length - 1)) * (width - padding * 2), y: height - padding - ((p.val - minVal) / valRange) * (height - padding * 2), ...p }));
    let pathD = `M ${points[0].x} ${points[0].y}`; for (let i = 1; i < points.length; i++) pathD += ` L ${points[i].x} ${points[i].y}`;

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-color)" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--border-color)" strokeWidth="1" />
          <text x={padding - 5} y={padding + 5} textAnchor="end" className="text-[10px] font-bold fill-current" style={{ color: 'var(--text-muted)' }}>{Math.round(maxVal)}kg</text>
          <text x={padding - 5} y={height - padding} textAnchor="end" className="text-[10px] font-bold fill-current" style={{ color: 'var(--text-muted)' }}>{Math.round(minVal)}kg</text>
          <path d={pathD} fill="none" stroke="var(--accent-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((pt, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={pt.x} cy={pt.y} r="4" fill="var(--bg-card)" stroke="var(--accent-color)" strokeWidth="2" />
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <rect x={pt.x - 30} y={pt.y - 28} width="60" height="20" rx="4" fill="var(--text-main)" />
                <text x={pt.x} y={pt.y - 14} textAnchor="middle" className="text-[9px] font-black" style={{ color: 'var(--bg-main)' }}>{pt.val} kg</text>
                <text x={pt.x} y={height - padding + 15} textAnchor="middle" className="text-[9px] font-medium fill-current" style={{ color: 'var(--text-main)' }}>{pt.dateStr.substring(5)}</text>
              </g>
            </g>
          ))}
        </svg>
      </div>
    );
  };


  // =========================================================================
  // --- THE GATEKEEPER PROTOCOL ---
  // =========================================================================

  const currentUserEmail = session?.user?.email?.toLowerCase().trim() || '';
  const isViceCaptain = VICE_CAPTAINS.includes(currentUserEmail);
  
  // 1. Domain Check
  const isAllowedEmail = currentUserEmail.endsWith('@goa.bits-pilani.ac.in') || isViceCaptain;
  
  // 2. Approval Check
  const isApproved = isViceCaptain || profile?.is_approved === true;

  // SCREEN 1: Not Logged In
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors duration-200" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="w-full max-w-md border rounded-2xl p-8 shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>Team Login</h1>
            <p className="text-sm mt-6 mb-2" style={{ color: 'var(--text-muted)' }}>Authenticate to access the team hub.</p>
          </div>
          <button onClick={handleGoogleLogin} className="w-full font-extrabold py-3.5 rounded-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 bg-white text-slate-900 shadow-md border border-slate-200">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" /> 
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 2: Wrong Email Domain
  if (!isAllowedEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors duration-200" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="w-full max-w-md border rounded-2xl p-8 shadow-xl text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h1 className="text-2xl font-black tracking-tight text-rose-500 mb-2">Unauthorized Domain</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>You must use a valid @goa.bits-pilani.ac.in email to access this hub.</p>
          <button onClick={handleLogout} className="font-bold py-2 px-4 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20">Sign Out</button>
        </div>
      </div>
    );
  }

  // SCREEN 2.5: MANUALLY COLLECT NAME IF NEW USER
  if (showNameForm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors duration-200" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="w-full max-w-md border rounded-2xl p-8 shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>Complete Registration</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Enter your name to request access to the team platform.</p>
          </div>
          
          <form onSubmit={handleRegisterProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-slate-400">Full Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Kunal Sharma"
                value={registrationName} 
                onChange={(e) => setRegistrationName(e.target.value)} 
                className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} 
              />
            </div>
            <button 
              type="submit" 
              className="w-full font-bold py-3 rounded-lg border transition-transform active:scale-95 text-sm" 
              style={{ backgroundColor: 'var(--accent-color)', color: 'var(--accent-text)', borderColor: 'var(--border-color)' }}
            >
              Submit Membership Request
            </button>
          </form>
        </div>
      </div>
    );
  }

  // SCREEN 3: Loading Profile Data (Crucial for sync windows)
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center font-bold" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}>Syncing secure athlete profile...</div>;
  }

  // SCREEN 4: Pending Admin Verification
  if (!isApproved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors duration-200" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="w-full max-w-md border rounded-2xl p-8 shadow-xl text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h1 className="text-2xl font-black tracking-tight text-amber-500 mb-2">Pending Approval</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Your account is waiting for manual verification from the Leadership Council.</p>
          <button onClick={handleLogout} className="font-bold py-2 px-4 rounded-lg border hover:bg-slate-500/10 transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>Sign Out</button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // --- MAIN APP RENDER (ONLY REACHED IF APPROVED OR VICE CAPTAIN) ---
  // =========================================================================

  const userPersonalLogs = compileNestedLogStructure(trainingHistory);
  const targetAthleteLogs = compileNestedLogStructure(athleteTrainingHistory);
  
  const currentCalories = dailyFoods.reduce((sum, item) => sum + item.calories, 0);
  const currentProtein = dailyFoods.reduce((sum, item) => sum + (item.protein || 0), 0);
  const currentCarbs = dailyFoods.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const currentFats = dailyFoods.reduce((sum, item) => sum + (item.fats || 0), 0);

  const finalWelcomeName = profile?.full_name || 'Athlete';

  return (
    <div className="min-h-screen font-sans transition-colors duration-200" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      
      {/* NAVBAR WITH FLEX-WRAP FIX */}
      <nav className="border-b backdrop-blur sticky top-0 z-50 transition-colors duration-200" style={{ backgroundColor: 'var(--bg-card)80', borderColor: 'var(--border-color)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="font-black px-2.5 py-1 rounded text-sm tracking-wider" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--accent-text)' }}>BITS GOA</div>
            <span className="font-bold text-xl tracking-tight hidden sm:block text-cyan-400">🟢 SYSTEM ONLINE 🟢</span>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {['training-log', 'dashboard', 'leaderboard', 'calories', 'gallery'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold capitalize transition-all" style={{ backgroundColor: activeTab === tab ? 'var(--accent-color)' : 'transparent', color: activeTab === tab ? 'var(--accent-text)' : 'var(--text-muted)' }}>
                {tab.replace('-', ' ')}
              </button>
            ))}
            
            {/* REAL VICE CAPTAIN BUTTON */}
            {isViceCaptain && (
              <button onClick={() => setActiveTab('monitor')} className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-black capitalize transition-all border border-dashed border-amber-400 text-amber-400 bg-amber-400/10 hover:bg-amber-400/20">
                🛡️ Roster Monitor
              </button>
            )}

            <div className="h-6 w-[1px] mx-1 hidden sm:block" style={{ backgroundColor: 'var(--border-color)' }} />
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="text-xs font-bold border rounded px-1.5 py-1.5 outline-none transition-colors" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}>
              <option value="light">Light</option><option value="dark">Dark</option><option value="classic">Classic</option>
            </select>
            <button onClick={handleLogout} className="px-2 py-1.5 rounded-md text-xs sm:text-sm font-bold text-rose-500 hover:bg-rose-950/20">Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: TRAINING LOG */}
        {activeTab === 'training-log' && (
          <div className="space-y-8">
            <div><h1 className="text-3xl font-extrabold tracking-tight">Training Log</h1><p className="mt-1" style={{ color: 'var(--text-muted)' }}>Track daily sets and execution data.</p></div>
            <div className="border rounded-xl p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-bold mb-4">Log New Workout</h2>
              <form onSubmit={handleLogWorkout} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Date</label><input type="date" required value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Movement</label><select value={logMovementSelect} onChange={(e) => setLogMovementSelect(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}><option value="Squat">Squat</option><option value="Bench Press">Bench Press</option><option value="Deadlift">Deadlift</option><option value="Accessory">Other Accessory...</option></select></div>
                  {logMovementSelect === 'Accessory' && (<div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Exercise Name</label><input type="text" placeholder="e.g. Overhead Press" required value={customMovement} onChange={(e) => setCustomMovement(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Weight (kg)</label><input type="number" step="0.5" required value={logWeight} onChange={(e) => setLogWeight(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Set Number</label><input type="number" placeholder="e.g. 1" required value={logSets} onChange={(e) => setLogSets(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Reps</label><input type="number" required value={logReps} onChange={(e) => setLogReps(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">RPE</label><input type="number" step="0.5" min="1" max="10" required value={logRpe} onChange={(e) => setLogRpe(e.target.value)} placeholder="e.g. 8.5" className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                </div>
                <button type="submit" className="w-full font-bold py-2.5 rounded-lg border mt-2" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--accent-text)', borderColor: 'var(--border-color)' }}>Save Workout</button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold tracking-tight">Recent Logs</h3>
              {Object.keys(userPersonalLogs).length === 0 ? (<div className="border border-dashed rounded-xl p-8 text-center italic" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>No workouts logged yet.</div>) : (
                Object.keys(userPersonalLogs).map((dateKey) => (
                  <div key={dateKey} className="border rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <button onClick={() => toggleDateGroup(dateKey)} className="w-full px-6 py-4 flex justify-between items-center font-bold text-left hover:bg-slate-500/5">
                      <span style={{ color: 'var(--accent-color)' }}>{new Date(dateKey).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span className="text-xs font-semibold border rounded-full px-2.5 py-0.5" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>{Object.keys(userPersonalLogs[dateKey]).length} Distinct Lifts</span>
                    </button>
                    {expandedDates[dateKey] && (
                      <div className="border-t p-4 space-y-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)20' }}>
                        {Object.keys(userPersonalLogs[dateKey]).map((mKey) => (
                          <div key={mKey} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                            <button onClick={() => toggleExerciseGroup(dateKey, mKey)} className="w-full px-4 py-3 flex justify-between items-center text-sm font-bold text-left hover:bg-slate-500/5">
                              <span>{mKey}</span><span className="text-xs font-normal underline" style={{ color: 'var(--text-muted)' }}>{expandedExercises[`${dateKey}-${mKey}`] ? 'Hide Sets' : 'View Sets'}</span>
                            </button>
                            {expandedExercises[`${dateKey}-${mKey}`] && (
                              <div className="border-t p-2 overflow-x-auto" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)10' }}>
                                <table className="w-full text-left text-xs whitespace-nowrap min-w-max">
                                  <thead><tr className="border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}><th className="px-4 py-2">Set</th><th className="px-4 py-2">Weight</th><th className="px-4 py-2">Reps</th><th className="px-4 py-2">RPE</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
                                  <tbody>
                                    {userPersonalLogs[dateKey][mKey].map((log) => (
                                      <tr key={log.id} className="border-b last:border-0 hover:bg-slate-500/5" style={{ borderColor: 'var(--border-color)' }}>
                                        <td className="px-4 py-3">{editingLogId === log.id ? <input type="number" className="w-16 border rounded p-1 text-center" value={editSets} onChange={(e) => setEditSets(e.target.value)} /> : <span className="font-semibold">Set {log.sets}</span>}</td>
                                        <td className="px-4 py-3">{editingLogId === log.id ? <input type="number" step="0.5" className="w-20 border rounded p-1 text-center" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} /> : <span style={{ color: 'var(--accent-color)' }}>{log.weight_kg} kg</span>}</td>
                                        <td className="px-4 py-3">{editingLogId === log.id ? <input type="number" className="w-16 border rounded p-1 text-center" value={editReps} onChange={(e) => setEditReps(e.target.value)} /> : <span>{log.reps} reps</span>}</td>
                                        <td className="px-4 py-3">{editingLogId === log.id ? <input type="number" step="0.5" className="w-16 border rounded p-1 text-center" value={editRpe} onChange={(e) => setEditRpe(e.target.value)} /> : <span className="px-1.5 py-0.5 font-bold rounded" style={{ backgroundColor: 'var(--bg-main)' }}>@{log.rpe}</span>}</td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                          {editingLogId === log.id ? (<><button onClick={() => handleUpdateLog(log.id)} className="px-2 py-1 bg-emerald-600 text-white rounded">Save</button><button onClick={() => setEditingLogId(null)} className="px-2 py-1 bg-slate-500 text-white rounded ml-1">Cancel</button></>) : 
                                          (<><button onClick={() => startEditing(log)} className="text-blue-500 font-semibold">Edit</button><button onClick={() => handleDeleteLog(log.id)} className="text-rose-500 font-semibold ml-2">Delete</button></>)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TEAM DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div><h1 className="text-3xl font-extrabold tracking-tight">Team Dashboard</h1><p className="mt-1" style={{ color: 'var(--text-muted)' }}>Welcome back, <span className="font-bold" style={{ color: 'var(--accent-color)' }}>{finalWelcomeName}</span>.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[['Your Squat', profile?.best_squat, 'kg'], ['Your Bench', profile?.best_bench, 'kg'], ['Your Deadlift', profile?.best_deadlift, 'kg']].map(([label, val, unit]) => (
                <div key={label} className="border p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <div className="text-3xl font-black mt-2" style={{ color: 'var(--accent-color)' }}>{val || '0'} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{unit}</span></div>
                </div>
              ))}
              <div className="border p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Your IPF GL</span>
                <div className="text-3xl font-black mt-2">{profile ? calculateIPFGL(profile.best_squat, profile.best_bench, profile.best_deadlift, profile.current_bodyweight) : '0'} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>pts</span></div>
              </div>
            </div>

            <div className="border rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div><h2 className="text-xl font-bold">Strength Progression Tracker</h2><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Hover anchors to analyze training blocks curves.</p></div>
                <div className="flex gap-1.5 border rounded-lg p-1 text-xs font-bold" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                  {['total', 'squat', 'bench', 'deadlift'].map(m => (<button key={m} onClick={() => setChartMetric(m)} className="px-2.5 py-1.5 rounded-md capitalize transition-all" style={{ backgroundColor: chartMetric === m ? 'var(--accent-color)' : 'transparent', color: chartMetric === m ? 'var(--accent-text)' : 'var(--text-muted)' }}>{m}</button>))}
                </div>
              </div>
              {renderSvgLineGraph()}
              {liftHistory.length > 0 && (
                <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 text-xs">
                    {liftHistory.slice().reverse().map((h, idx, arr) => {
                      const prev = arr[idx + 1], diff = prev ? h.total - prev.total : 0;
                      return (
                        <div key={h.id} className="flex justify-between items-center p-2.5 rounded-lg border relative group/item" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)20' }}>
                          <div>
                            <span className="font-bold" style={{ color: 'var(--accent-color)' }}>{new Date(h.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span className="mx-2 text-slate-500">|</span>
                            <span>S: {h.squat}</span> · <span>B: {h.bench}</span> · <span>D: {h.deadlift}</span>
                          </div>
                          <div className="font-black flex items-center gap-3">
                            <span>Total: {h.total} kg</span>
                            {diff !== 0 && (<span className="font-bold text-[10px]" style={{ color: diff > 0 ? '#10b981' : '#f43f5e' }}>{diff > 0 ? `(+${diff}kg)` : `(${diff}kg)`}</span>)}
                            <button onClick={() => handleDeleteMilestone(h.id)} className="text-[10px] font-bold text-rose-500 hover:underline border border-rose-500/20 rounded px-1.5 py-0.5 bg-rose-500/5 transition-opacity opacity-100 sm:opacity-0 group-hover/item:opacity-100">Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-xl p-6 mt-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-bold mb-4">Update Current Maxes & Details</h2>
              <form onSubmit={handleUpdateStats} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Full Name / Display Name</label>
                    <input type="text" placeholder="e.g. Sidhant Bhutani" value={displayNameInput} onChange={(e) => setDisplayNameInput(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                  </div>
                  <div><label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Log Date</label><input type="date" required value={updateDate} onChange={(e) => setUpdateDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>BW (kg)</label><input type="number" step="0.1" required value={bodyweight} onChange={(e) => setBodyweight(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Squat (kg)</label><input type="number" step="2.5" required value={squat} onChange={(e) => setSquat(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Bench (kg)</label><input type="number" step="2.5" required value={bench} onChange={(e) => setBench(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Deadlift (kg)</label><input type="number" step="2.5" required value={deadlift} onChange={(e) => setDeadlift(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                </div>
                <button type="submit" className="w-full font-bold py-2.5 rounded-lg border mt-2" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--accent-text)', borderColor: 'var(--border-color)' }}>Save Profile Parameters & Lifts</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div><h1 className="text-3xl font-extrabold tracking-tight">Team Rankings</h1></div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded-lg px-4 py-2 outline-none" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}>
                <option value="ipf">IPF GL Score</option><option value="dots">DOTS Score</option><option value="ratio">Bodyweight Ratio</option>
                <option value="squat">Max Squat</option><option value="bench">Max Bench</option><option value="deadlift">Max Deadlift</option><option value="total">Max Total</option>
              </select>
            </div>
            <div className="border rounded-xl overflow-x-auto shadow-inner" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
                <thead className="text-xs uppercase font-bold border-b" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                  <tr>
                    <th className="px-4 py-4">Rank</th><th className="px-4 py-4">Athlete</th><th className="px-4 py-4" style={headingStyle('ratio')}>BW</th><th className="px-4 py-4" style={headingStyle('squat')}>Squat</th><th className="px-4 py-4" style={headingStyle('bench')}>Bench</th><th className="px-4 py-4" style={headingStyle('deadlift')}>Deadlift</th><th className="px-4 py-4" style={headingStyle('total')}>Total</th><th className="px-4 py-4" style={headingStyle('ipf')}>IPF GL</th><th className="px-4 py-4" style={headingStyle('dots')}>DOTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {getSortedLeaderboard().map((athlete, index) => (
                    <tr key={athlete.id} className="hover:bg-slate-500/5">
                      <td className="px-4 py-4 font-bold">#{index + 1}</td><td className="px-4 py-4 font-medium">{athlete.full_name || 'Athlete'}</td><td className="px-4 py-4 text-xs">{athlete.bw} kg</td><td className="px-4 py-4 text-xs font-semibold">{athlete.squat} kg</td><td className="px-4 py-4 text-xs font-semibold">{athlete.bench} kg</td><td className="px-4 py-4 text-xs font-semibold">{athlete.deadlift} kg</td><td className="px-4 py-4 text-xs font-bold">{athlete.total} kg</td><td className="px-4 py-4 text-xs">{athlete.glScore}</td><td className="px-4 py-4 text-xs">{athlete.dotsScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CALORIE & MACRO TRACKER */}
        {activeTab === 'calories' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div><h1 className="text-3xl font-extrabold tracking-tight">Nutrition Tracker</h1><p className="mt-1" style={{ color: 'var(--text-muted)' }}>Manage caloric density limits and complete macronutrient targets.</p></div>
              <button onClick={clearCalories} className="px-4 py-2 text-xs font-bold border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-500/10">Reset Day</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border p-5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Calorie Target Goal</span>
                <input type="number" value={targetCalories} onChange={(e) => setTargetCalories(parseInt(e.target.value) || 0)} className="text-2xl font-black mt-2 w-full bg-transparent outline-none border-b border-dashed focus:border-blue-500" style={{ color: 'var(--text-main)' }} />
              </div>
              <div className="border p-5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Consumed</span>
                <div className="text-2xl font-black mt-2" style={{ color: currentCalories > targetCalories ? 'var(--accent-color)' : 'var(--text-main)' }}>{currentCalories} <span className="text-xs font-normal text-slate-500">kcal</span></div>
              </div>
              <div className="border p-5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Remaining</span>
                <div className="text-2xl font-black mt-2" style={{ color: targetCalories - currentCalories < 0 ? '#f43f5e' : '#10b981' }}>{targetCalories - currentCalories} <span className="text-xs font-normal text-slate-500">kcal</span></div>
              </div>
            </div>
            <div className="border rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold mb-4">Daily Macronutrient Targets & Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2 border-r pr-4 last:border-0" style={{ borderColor: 'var(--border-color)' }}><div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-amber-500">🍖 Protein</span><div className="text-xs text-slate-400">Target: <input type="number" className="w-12 bg-transparent border-b text-center font-bold" value={targetProtein} onChange={(e)=>setTargetProtein(parseInt(e.target.value)||0)} />g</div></div><div className="text-xl font-black">{currentProtein}g</div><div className="text-xs font-medium" style={{ color: targetProtein - currentProtein <= 0 ? '#10b981' : 'var(--text-muted)' }}>{targetProtein - currentProtein <= 0 ? '✓ Target Hit!' : `${targetProtein - currentProtein}g remaining`}</div></div>
                <div className="space-y-2 border-r pr-4 last:border-0" style={{ borderColor: 'var(--border-color)' }}><div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-blue-400">🍞 Carbohydrates</span><div className="text-xs text-slate-400">Target: <input type="number" className="w-12 bg-transparent border-b text-center font-bold" value={targetCarbs} onChange={(e)=>setTargetCarbs(parseInt(e.target.value)||0)} />g</div></div><div className="text-xl font-black">{currentCarbs}g</div><div className="text-xs font-medium" style={{ color: targetCarbs - currentCarbs <= 0 ? '#10b981' : 'var(--text-muted)' }}>{targetCarbs - currentCarbs <= 0 ? '✓ Target Hit!' : `${targetCarbs - currentCarbs}g remaining`}</div></div>
                <div className="space-y-2"><div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-rose-400">🥑 Fats</span><div className="text-xs text-slate-400">Target: <input type="number" className="w-12 bg-transparent border-b text-center font-bold" value={targetFats} onChange={(e)=>setTargetFats(parseInt(e.target.value)||0)} />g</div></div><div className="text-xl font-black">{currentFats}g</div><div className="text-xs font-medium" style={{ color: targetFats - currentFats <= 0 ? '#10b981' : 'var(--text-muted)' }}>{targetFats - currentFats <= 0 ? '✓ Target Hit!' : `${targetFats - currentFats}g remaining`}</div></div>
              </div>
            </div>
            <div className="border rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold mb-4">Quick Add Food Logs</h2>
              <form onSubmit={handleAddCalories} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Food Item / Meal</label><input type="text" placeholder="e.g., Chicken Breast" required value={foodName} onChange={(e) => setFoodName(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Calories (kcal)</label><input type="number" placeholder="650" required value={foodCalories} onChange={(e) => setFoodCalories(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Protein (g)</label><input type="number" placeholder="g" value={foodProtein} onChange={(e)=>setFoodProtein(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none text-center" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Carbs (g)</label><input type="number" placeholder="g" value={foodCarbs} onChange={(e)=>setFoodCarbs(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none text-center" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                  <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Fats (g)</label><input type="number" placeholder="g" value={foodFats} onChange={(e)=>setFoodFats(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none text-center" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                </div>
                <button type="submit" className="w-full font-bold py-2.5 rounded-lg border mt-2" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--accent-text)', borderColor: 'var(--border-color)' }}>Add to Log</button>
              </form>
            </div>
            <div className="border rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="p-4 border-b font-bold" style={{ borderColor: 'var(--border-color)' }}>Meals Logged Today</div>
              <ul className="divide-y text-sm" style={{ borderColor: 'var(--border-color)' }}>
                {dailyFoods.length === 0 ? (
                  <li className="p-6 text-center italic text-slate-500">No macro items tracked yet today. Feed the muscles!</li>
                ) : (
                  dailyFoods.map(item => (
                    <li key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-500/5">
                      <div>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">P: {item.protein}g | C: {item.carbs}g | F: {item.fats}g</div>
                      </div>
                      <span className="font-black text-md" style={{ color: 'var(--accent-color)' }}>+{item.calories} kcal</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 5: TEAM GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <div><h1 className="text-3xl font-extrabold tracking-tight">Team Gallery</h1><p className="mt-1" style={{ color: 'var(--text-muted)' }}>Upload photos directly from your smartphone or laptop gallery stream.</p></div>
            <div className="border rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold mb-4">Upload Picture From Device</h2>
              <form onSubmit={handleAddImage} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2"><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Select Image File</label><input id="gallery-file-input" type="file" accept="image/*" required onChange={handleFileChange} className="w-full border rounded-lg px-3 py-1.5 outline-none text-xs" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                <div><label className="block text-xs font-bold uppercase mb-1 text-slate-400">Photo Caption</label><input type="text" placeholder="Add context..." value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} /></div>
                <button type="submit" className="w-full font-bold py-2.5 rounded-lg border md:col-span-3 mt-2" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--accent-text)', borderColor: 'var(--border-color)' }}>Publish to Grid</button>
              </form>
            </div>
            {galleryImages.length === 0 ? (<div className="border border-dashed rounded-xl p-12 text-center italic" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>The stream is blank. Upload photos above!</div>) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {galleryImages.map(img => (
                  <div key={img.id} className="break-inside-avoid border rounded-xl overflow-hidden shadow-sm transition-transform relative group" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <button onClick={() => handleDeleteImage(img.id)} className="absolute top-2 right-2 bg-black/70 hover:bg-rose-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-md backdrop-blur transition-all opacity-90 sm:opacity-0 group-hover:opacity-100 z-10">🗑️ Delete</button>
                    <img src={img.url} alt={img.caption} className="w-full h-auto object-cover max-h-[500px]" />
                    <div className="p-4 text-xs font-bold tracking-wide border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>{img.caption}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ROSTER MONITOR */}
        {activeTab === 'monitor' && isViceCaptain && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">🛡️ Leadership Monitoring Panel</h1>
              <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Select an athlete below to audit their full gym diaries and volume progressions.</p>
            </div>
            <div className="border rounded-xl p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Choose Athlete Roster Target</label>
              <select value={selectedAthleteId} onChange={(e) => { setSelectedAthleteId(e.target.value); setExpandedMonitorDates({}); }} className="w-full sm:max-w-md border rounded-lg px-4 py-2.5 outline-none font-medium" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
                <option value="">-- Select an Athlete --</option>
                {allProfiles.map(p => (<option key={p.id} value={p.id}>{p.full_name || 'Unnamed Athlete'}</option>))}
              </select>
            </div>
            {selectedAthleteId && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold tracking-tight">Athlete Workout History Feed</h3>
                {Object.keys(targetAthleteLogs).length === 0 ? (<div className="border border-dashed rounded-xl p-12 text-center italic" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>This athlete has not written any entries inside their log diaries yet.</div>) : (
                  Object.keys(targetAthleteLogs).map((dateKey) => (
                    <div key={dateKey} className="border rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                      <button onClick={() => setExpandedMonitorDates(p => ({ ...p, [dateKey]: !p[dateKey] }))} className="w-full px-6 py-4 flex justify-between items-center font-bold text-left hover:bg-slate-500/5">
                        <span style={{ color: 'var(--accent-color)' }}>{new Date(dateKey).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="text-xs font-semibold border rounded-full px-2.5 py-0.5" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>{Object.keys(targetAthleteLogs[dateKey]).length} Movements Performed</span>
                      </button>
                      {expandedMonitorDates[dateKey] && (
                        <div className="border-t p-4 space-y-4 transition-all" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)20' }}>
                          {Object.keys(targetAthleteLogs[dateKey]).map((mKey) => (
                            <div key={mKey} className="border rounded-lg p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                              <h4 className="font-extrabold text-sm mb-2 border-b pb-1" style={{ borderColor: 'var(--border-color)' }}>{mKey}</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                {targetAthleteLogs[dateKey][mKey].map((setRow) => (
                                  <div key={setRow.id} className="p-2.5 rounded border flex flex-col justify-between" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)10' }}>
                                    <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-muted)' }}>Set {setRow.sets}</span>
                                    <div className="text-sm font-black mt-1" style={{ color: 'var(--accent-color)' }}>{setRow.weight_kg} kg</div>
                                    <div className="mt-1 font-medium">{setRow.reps} Reps <span className="font-bold ml-1" style={{ color: 'var(--text-muted)' }}>@{setRow.rpe}</span></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}