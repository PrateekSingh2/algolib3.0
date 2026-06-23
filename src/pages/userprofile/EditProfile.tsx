import { FormEvent, useEffect, useState, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, ChevronDown, User, AtSign, MapPin, 
  Map, Globe2, Github, Calendar, Hash, Loader2, 
  GraduationCap, Search, CheckCircle2, ShieldAlert,
  Linkedin, Eye, EyeOff, Lock, Camera, Image as ImageIcon
} from "lucide-react";
import { Country, State, City } from "country-state-city";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalRibbon from "@/components/GlobalRibbon";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileFormState {
  username: string;
  full_name: string;
  display_name: string;
  college: string;
  age: string;
  gender: string;
  city: string;
  state: string;
  country: string;
  github_url: string;
  linkedin_url: string;
  bio: string;
  email_public: boolean;
  age_public: boolean;
  location_public: boolean;
  gender_public: boolean;
  avatar_url: string;
  banner_url: string;
}

const emptyState: ProfileFormState = {
  username: "", full_name: "", display_name: "", college: "", age: "", gender: "", 
  city: "", state: "", country: "", github_url: "", linkedin_url: "", bio: "",
  email_public: false, age_public: false, location_public: false, gender_public: false,
  avatar_url: "", banner_url: ""
};

// --- HIGH GLASSMORPHISM SECTION CARD ---
const SectionCard = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
  <div className="relative bg-sky-50 dark:bg-white/[0.02] backdrop-blur-3xl border border-blue-200 dark:border-white/[0.08] dark:border-t-white/[0.2] dark:border-l-white/[0.15] rounded-[2rem] p-6 sm:p-10 shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] mb-8 overflow-hidden group">
    {/* Diagonal Glossy Overlay */}
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-100/50 dark:via-white/[0.03] to-blue-200/50 dark:to-white/[0.08] pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700 z-0" />
    
    <div className="relative z-10 mb-8 pb-6 border-b border-slate-200 dark:border-white/[0.08] shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(0,0,0,0.3)]">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-md">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5 drop-shadow-sm">{description}</p>
    </div>
    <div className="relative z-10 grid grid-cols-1 gap-7 sm:grid-cols-2">{children}</div>
  </div>
);

// --- PREMIUM INPUT WRAPPER ---
const InputWrapper = ({ label, icon: Icon, children, fullWidth = false, togglePublic, isPublic, onToggle }: any) => (
  <div className={`flex flex-col gap-2.5 ${fullWidth ? 'sm:col-span-2' : ''}`}>
    <div className="flex items-center justify-between ml-1">
      <label className="text-xs font-bold tracking-widest text-slate-500 dark:text-zinc-400 uppercase drop-shadow-sm">{label}</label>
      {togglePublic && (
        <button type="button" onClick={onToggle} className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest bg-blue-100/50 dark:bg-white/5 border border-blue-200 dark:border-white/10 px-2 py-1 rounded-md transition-colors hover:bg-blue-200/50 dark:hover:bg-white/10 group/toggle">
          {isPublic ? <Eye size={12} className="text-sky-500" /> : <EyeOff size={12} className="text-slate-400 dark:text-zinc-500" />}
          <span className={isPublic ? "text-sky-600 dark:text-sky-400" : "text-slate-500 dark:text-zinc-400"}>{isPublic ? 'Public' : 'Private'}</span>
        </button>
      )}
    </div>
    <div className="relative group/input">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within/input:text-sky-500 dark:group-focus-within/input:text-sky-400 transition-colors pointer-events-none z-10">
        <Icon size={18} />
      </div>
      {children}
    </div>
  </div>
);

const EditProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isFirstTime = location.state?.isFirstTime || false;

  const [form, setForm] = useState<ProfileFormState>(emptyState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // College Autocomplete State
  const [collegeSuggestions, setCollegeSuggestions] = useState<string[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load initial profile data
  useEffect(() => {
    if (!profile) return;
    setForm({
      username: profile.username || "",
      full_name: profile.full_name || "", display_name: profile.display_name || "",
      college: profile.college || "", age: profile.age ? String(profile.age) : "",
      gender: profile.gender || "", city: profile.city || "", state: profile.state || "",
      country: profile.country || "", github_url: profile.github_url || "", 
      linkedin_url: profile.linkedin_url || "", bio: profile.bio || "",
      email_public: profile.email_public ?? false,
      age_public: profile.age_public ?? false,
      location_public: profile.location_public ?? false,
      gender_public: profile.gender_public ?? false,
      avatar_url: profile.avatar_url || "",
      banner_url: profile.banner_url || ""
    });
    if (profile.username) setUsernameAvailable(true); // Treat existing as available
  }, [profile]);

  // --- USERNAME AVAILABILITY CHECK ---
  useEffect(() => {
    if (!form.username || form.username === profile?.username) {
      if (form.username === profile?.username) setUsernameAvailable(true);
      else setUsernameAvailable(null);
      return;
    }
    
    // Check rules: alphanumeric, length > 4, must contain at least one number
    const validRegex = /^[a-zA-Z0-9_]+$/;
    const hasNumber = /\d/;
    if (form.username.length <= 4 || !validRegex.test(form.username) || !hasNumber.test(form.username)) {
      setUsernameAvailable(false);
      return;
    }

    const checkUsername = async () => {
      setIsCheckingUsername(true);
      try {
        const res = await fetch(`/.netlify/functions/check-username?username=${encodeURIComponent(form.username)}`);
        if (res.ok) {
          const data = await res.json();
          setUsernameAvailable(data.available);
        }
      } catch (err) {
        console.error("Username check error", err);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [form.username, profile?.username]);

  // --- COLLEGE AUTOCOMPLETE LOGIC ---
  useEffect(() => {
    if (!showCollegeDropdown || form.college.trim().length < 3) {
      setCollegeSuggestions([]);
      return;
    }
    
    const fetchColleges = async () => {
      setIsSearchingColleges(true);
      try {
        const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(form.college)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const uniqueColleges = Array.from(new Set(data.map((item: any) => item.name))) as string[];
        setCollegeSuggestions(uniqueColleges.slice(0, 8)); // Top 8 results
      } catch (err) {
        console.error("College search error:", err);
      } finally {
        setIsSearchingColleges(false);
      }
    };

    const debounceTimer = setTimeout(fetchColleges, 400); // 400ms debounce
    return () => clearTimeout(debounceTimer);
  }, [form.college, showCollegeDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowCollegeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOCATION CASCADING LOGIC ---
  const countries = useMemo(() => Country.getAllCountries(), []);
  const selectedCountryCode = useMemo(() => countries.find(c => c.name === form.country)?.isoCode, [form.country, countries]);
  const states = useMemo(() => selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : [], [selectedCountryCode]);
  const selectedStateCode = useMemo(() => states.find(s => s.name === form.state)?.isoCode, [form.state, states]);
  const cities = useMemo(() => (selectedCountryCode && selectedStateCode) ? City.getCitiesOfState(selectedCountryCode, selectedStateCode) : [], [selectedCountryCode, selectedStateCode]);

  const handleChange = (key: keyof ProfileFormState, value: string | boolean) => {
    let finalValue = value;
    if (typeof finalValue === "string") {
        finalValue = finalValue.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    }
    setForm((prev) => ({ ...prev, [key]: finalValue }));
    setMessage({ text: "", type: "" }); 
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'avatar') setUploadingAvatar(true);
    if (type === 'banner') setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ffjmgu1h"); 
      formData.append("cloud_name", "dmmv8phgq"); 
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/dmmv8phgq/image/upload`, { 
        method: "POST", 
        body: formData 
      });
      const data = await res.json();
      
      if (data.secure_url) {
        setForm(prev => ({ ...prev, [type === 'avatar' ? 'avatar_url' : 'banner_url']: data.secure_url }));
        setMessage({ text: `${type === 'avatar' ? 'Profile picture' : 'Banner'} uploaded successfully. Don't forget to save!`, type: "success" });
      } else {
        throw new Error("Failed to get secure URL from Cloudinary");
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Failed to upload ${type}.`, type: "error" });
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      if (type === 'banner') setUploadingBanner(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    
    if (!form.username || form.username.trim() === "") {
      setMessage({ text: "Username is required.", type: "error" });
      return;
    }
    
    if (usernameAvailable === false) {
      setMessage({ text: "Username is not available or invalid.", type: "error" });
      return;
    }
    
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const token = await user.getIdToken();
      const response = await fetch('/.netlify/functions/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: form.username.toLowerCase().trim() || null,
          full_name: form.full_name.trim() || null, 
          display_name: form.display_name.trim() || null,
          college: form.college.trim() || null, 
          age: form.age ? Number(form.age) : null,
          gender: form.gender.trim() || null, 
          city: form.city.trim() || null,
          state: form.state.trim() || null, 
          country: form.country.trim() || null,
          github_url: form.github_url.trim() || null, 
          linkedin_url: form.linkedin_url.trim() || null,
          bio: form.bio.trim() || null,
          email_public: form.email_public,
          age_public: form.age_public,
          location_public: form.location_public,
          gender_public: form.gender_public,
          avatar_url: form.avatar_url || null,
          banner_url: form.banner_url || null,
          is_profile_complete: true
        })
      });
      
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Username is already taken. Please choose another.");
        }
        throw new Error("Update failed");
      }
      
      await refreshProfile();
      
      if (isFirstTime) {
        navigate('/');
      } else {
        setMessage({ text: "Profile updated successfully.", type: "success" });
      }
    } catch (error: any) {
      setMessage({ text: error.message || "Failed to update profile.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Back button
  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Shared input styling
  const inputGlossyClasses = "h-12 w-full rounded-2xl border border-blue-200 dark:border-white/[0.1] dark:border-t-white/[0.2] bg-blue-100/50 dark:bg-black/40 backdrop-blur-md pl-12 pr-4 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all placeholder-slate-400 dark:placeholder-zinc-600 text-slate-900 dark:text-white shadow-inner dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] hover:bg-blue-200/50 dark:hover:bg-black/60 relative z-0";

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-[#020202] text-slate-900 dark:text-white flex flex-col relative pb-28 selection:bg-sky-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)] dark:[mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)]" />
      <div className="fixed top-[-10%] right-[5%] w-[50vw] h-[50vh] bg-sky-500 rounded-full blur-[200px] mix-blend-screen opacity-[0.05] dark:opacity-[0.08] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[60vw] h-[60vh] bg-indigo-600 rounded-full blur-[200px] mix-blend-screen opacity-[0.05] dark:opacity-[0.08] pointer-events-none" />

      <div className="relative z-50">
        <Navbar />
        <GlobalRibbon />
      </div>
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-32 sm:px-6 relative z-10">
        <div className="mb-10">
          {!isFirstTime && (
            <button 
              onClick={handleBack} 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-50 dark:bg-white/[0.03] border border-blue-200 dark:border-white/[0.1] dark:border-t-white/[0.25] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-blue-100/50 dark:hover:bg-white/[0.08] transition-all duration-300 text-sm font-medium group shadow-sm dark:shadow-lg backdrop-blur-xl dark:hover:shadow-[0_8px_24px_rgba(255,255,255,0.05)] mb-6"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          )}
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mt-2 leading-tight">
            {isFirstTime ? (
              <>Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 dark:from-sky-400 dark:via-indigo-400 dark:to-purple-500 drop-shadow-[0_0_40px_rgba(56,189,248,0.2)]">AlgoLib!</span></>
            ) : (
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500 dark:from-white dark:via-white dark:to-zinc-500">System Settings</span>
            )}
          </h1>
          <p className="mt-3 text-lg text-slate-500 dark:text-zinc-400 font-light max-w-2xl">
            {isFirstTime 
              ? "Please complete your developer profile to initialize your matrix and access global features." 
              : "Manage your system parameters, public profile, and privacy controls."}
          </p>
        </div>        

        {/* --- VISUALS UPLOAD SECTION --- */}
        <SectionCard title="Profile Visuals" description="Personalize your public profile with a custom banner and avatar.">
          <div className="sm:col-span-2 flex flex-col gap-6">
            
            {/* Banner Upload */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold tracking-widest text-slate-500 dark:text-zinc-400 uppercase drop-shadow-sm">Profile Banner</label>
              <div className="relative w-full h-32 md:h-40 rounded-2xl bg-slate-100 dark:bg-black/40 border-2 border-dashed border-slate-300 dark:border-white/[0.1] overflow-hidden group/banner flex items-center justify-center transition-all hover:bg-slate-200 dark:hover:bg-black/60">
                {form.banner_url ? (
                  <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover/banner:opacity-50 transition-opacity" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 dark:text-zinc-500">
                    <ImageIcon size={32} className="mb-2 opacity-50" />
                    <span className="text-sm font-medium">Upload Banner Image</span>
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'banner')}
                  disabled={uploadingBanner}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
                />
                
                {uploadingBanner && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                
                {form.banner_url && !uploadingBanner && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity pointer-events-none z-0">
                    <span className="bg-slate-900/80 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-md flex items-center gap-2">
                      <Camera size={16} /> Change Banner
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Upload */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold tracking-widest text-slate-500 dark:text-zinc-400 uppercase drop-shadow-sm">Profile Picture</label>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-black/40 border-2 border-dashed border-slate-300 dark:border-white/[0.1] overflow-hidden group/avatar flex items-center justify-center transition-all hover:bg-slate-200 dark:hover:bg-black/60 shrink-0">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover opacity-80 group-hover/avatar:opacity-50 transition-opacity" />
                  ) : (
                    <User size={32} className="text-slate-400 dark:text-zinc-500 opacity-50" />
                  )}
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
                  />

                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}

                  {!uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-0">
                      <Camera size={24} className="text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Profile Picture</span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Recommended 256x256px.<br/>Click the circle to upload a new image.</span>
                </div>
              </div>
            </div>

          </div>
        </SectionCard>
        
        <form onSubmit={handleSubmit} className="flex flex-col relative z-10">
          
          {/* --- SECTION 1: IDENTITY --- */}
          <SectionCard title="Identity Matrix" description="Your core personal identifiers used across the platform.">
            
            <div className="sm:col-span-2 flex flex-col gap-2.5">
              <label className="text-xs font-bold tracking-widest text-slate-500 dark:text-zinc-400 uppercase ml-1 drop-shadow-sm flex items-center gap-2">
                Public Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within/input:text-sky-500 dark:group-focus-within/input:text-sky-400 transition-colors pointer-events-none z-10">
                  <AtSign size={18} />
                </div>
                <input 
                  required
                  value={form.username} 
                  onChange={(e) => handleChange("username", e.target.value)} 
                  readOnly={!!profile?.username}
                  className={`${inputGlossyClasses} ${usernameAvailable === false ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : ''} ${!!profile?.username ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-white/[0.02] focus:ring-0 focus:border-blue-200 dark:focus:border-white/[0.1]' : ''}`} 
                  placeholder="johndoe99"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center z-10">
                  {!!profile?.username ? (
                    <Lock size={16} className="text-slate-400 dark:text-zinc-500" />
                  ) : isCheckingUsername ? (
                    <Loader2 size={18} className="animate-spin text-sky-500" />
                  ) : form.username && form.username !== profile?.username ? (
                    usernameAvailable ? <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> : <ShieldAlert size={18} className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  ) : null}
                </div>
              </div>
              {usernameAvailable === false && !profile?.username && <p className="text-[10px] uppercase font-bold tracking-widest text-rose-500 ml-2 mt-1">Taken or invalid (&gt;4 chars, min 1 number)</p>}
              {!!profile?.username && <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-zinc-500 ml-2 mt-1 flex items-center gap-1.5"><Lock size={10} /> Username is permanently locked</p>}
            </div>

            <InputWrapper label="Legal Name" icon={User}>
              <input 
                value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} 
                className={inputGlossyClasses} 
                placeholder="John Doe"
              />
            </InputWrapper>
            
            <InputWrapper label="Display Name" icon={User}>
              <input 
                value={form.display_name} onChange={(e) => handleChange("display_name", e.target.value)} 
                className={inputGlossyClasses} 
                placeholder="John D."
              />
            </InputWrapper>

            <InputWrapper 
              label="Age" 
              icon={Calendar} 
              togglePublic 
              isPublic={form.age_public} 
              onToggle={() => handleChange("age_public", !form.age_public)}
            >
              <input 
                type="number" min={0} value={form.age} onChange={(e) => handleChange("age", e.target.value)} 
                className={inputGlossyClasses} 
                placeholder="21"
              />
            </InputWrapper>

            <InputWrapper 
              label="Gender" 
              icon={Hash}
              togglePublic 
              isPublic={form.gender_public} 
              onToggle={() => handleChange("gender_public", !form.gender_public)}
            >
              <select 
                value={form.gender} onChange={(e) => handleChange("gender", e.target.value)}
                className={`${inputGlossyClasses} appearance-none pr-10 cursor-pointer`}
              >
                <option value="" disabled className="text-slate-400 dark:text-zinc-500">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none z-10" />
            </InputWrapper>
          </SectionCard>

          {/* --- SECTION 2: EDUCATION & LINKS --- */}
          <SectionCard title="Education & Links" description="Your academic background and professional profiles.">
            
            {/* COLLEGE RECOMMENDER */}
            <div className="sm:col-span-2 flex flex-col gap-2.5" ref={wrapperRef}>
              <label className="text-xs font-bold tracking-widest text-slate-500 dark:text-zinc-400 uppercase ml-1 drop-shadow-sm">College / Institute</label>
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within/input:text-sky-500 dark:group-focus-within/input:text-sky-400 transition-colors pointer-events-none z-10">
                  <GraduationCap size={18} />
                </div>
                <input 
                  value={form.college} 
                  onChange={(e) => {
                    handleChange("college", e.target.value);
                    setShowCollegeDropdown(true);
                  }} 
                  onFocus={() => setShowCollegeDropdown(true)}
                  className={`${inputGlossyClasses} pr-10`} 
                  placeholder="Search globally or type your specific institute..."
                  autoComplete="off"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none z-10">
                  {isSearchingColleges ? <Loader2 size={16} className="animate-spin text-sky-500 dark:text-sky-400" /> : <Search size={16} />}
                </div>

                {/* Glassy Dropdown Menu */}
                {showCollegeDropdown && form.college.trim().length > 0 && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 py-2 bg-blue-100/50 dark:bg-black/60 backdrop-blur-3xl border border-blue-200 dark:border-white/[0.15] dark:border-t-white/[0.3] rounded-2xl shadow-lg dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] z-50 max-h-60 overflow-y-auto ring-1 ring-blue-200 dark:ring-black">
                    {isSearchingColleges ? (
                      <div className="px-4 py-4 text-sm text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-sky-500 dark:text-sky-400" />
                        Scanning databases...
                      </div>
                    ) : (
                      <>
                        {collegeSuggestions.length > 0 ? (
                          <>
                            <div className="px-4 py-1.5 text-[10px] font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">Suggestions</div>
                            {collegeSuggestions.map((college, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  handleChange("college", college);
                                  setShowCollegeDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-blue-200/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                              >
                                {college}
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-500">
                            No global university match found.
                          </div>
                        )}
                        
                        <div className="mt-1 border-t border-slate-200 dark:border-white/[0.08] pt-1">
                          <button
                            type="button"
                            onClick={() => setShowCollegeDropdown(false)}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-sky-500 dark:text-sky-400 hover:bg-sky-500/10 dark:hover:bg-sky-400/10 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle2 size={16} />
                            Set as "{form.college}"
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <InputWrapper label="GitHub URL" icon={Github} fullWidth>
              <input 
                type="url" value={form.github_url} onChange={(e) => handleChange("github_url", e.target.value)} 
                className={inputGlossyClasses} 
                placeholder="https://github.com/username"
              />
            </InputWrapper>

            <InputWrapper label="LinkedIn URL" icon={Linkedin} fullWidth>
              <input 
                type="url" value={form.linkedin_url} onChange={(e) => handleChange("linkedin_url", e.target.value)} 
                className={inputGlossyClasses} 
                placeholder="https://linkedin.com/in/username"
              />
            </InputWrapper>

            <div className="sm:col-span-2 flex flex-col gap-2.5">
              <label className="text-xs font-bold tracking-widest text-slate-500 dark:text-zinc-400 uppercase ml-1 drop-shadow-sm">Terminal Bio</label>
              <textarea 
                rows={4} value={form.bio} onChange={(e) => handleChange("bio", e.target.value)} 
                className="w-full rounded-2xl border border-blue-200 dark:border-white/[0.1] dark:border-t-white/[0.2] bg-blue-100/50 dark:bg-black/40 backdrop-blur-md p-4 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all placeholder-slate-400 dark:placeholder-zinc-600 text-slate-900 dark:text-white shadow-inner dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] hover:bg-blue-200/50 dark:hover:bg-black/60 resize-y min-h-[120px] relative z-0" 
                placeholder="Tell us about your stack and current projects..."
              />
            </div>
          </SectionCard>

          {/* --- SECTION 3: TELEMETRY --- */}
          <SectionCard title="Telemetry Config" description="Your geographical coordinates.">
            
            <div className="sm:col-span-2 flex justify-end">
                <button type="button" onClick={() => handleChange("location_public", !form.location_public)} className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest bg-blue-100/50 dark:bg-white/5 border border-blue-200 dark:border-white/10 px-2 py-1 rounded-md transition-colors hover:bg-blue-200/50 dark:hover:bg-white/10 group/toggle">
                  {form.location_public ? <Eye size={12} className="text-sky-500" /> : <EyeOff size={12} className="text-slate-400 dark:text-zinc-500" />}
                  <span className={form.location_public ? "text-sky-600 dark:text-sky-400" : "text-slate-500 dark:text-zinc-400"}>{form.location_public ? 'Public Location' : 'Private Location'}</span>
                </button>
            </div>

            <InputWrapper label="Country" icon={Globe2}>
              <select 
                value={form.country} onChange={(e) => { handleChange("country", e.target.value); handleChange("state", ""); handleChange("city", ""); }}
                className={`${inputGlossyClasses} appearance-none pr-10 cursor-pointer`}
              >
                <option value="" disabled className="text-slate-400 dark:text-zinc-500">Select Country</option>
                {countries.map((country) => <option key={country.isoCode} value={country.name}>{country.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none z-10" />
            </InputWrapper>

            <InputWrapper label="State / Province" icon={Map}>
              <select 
                value={form.state} onChange={(e) => { handleChange("state", e.target.value); handleChange("city", ""); }} disabled={!form.country}
                className={`${inputGlossyClasses} appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="" disabled className="text-slate-400 dark:text-zinc-500">{form.country ? "Select State" : "Select Country first"}</option>
                {states.map((state) => <option key={state.isoCode} value={state.name}>{state.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none z-10" />
            </InputWrapper>

            <InputWrapper label="City" icon={MapPin}>
              <select 
                value={form.city} onChange={(e) => handleChange("city", e.target.value)} disabled={!form.state}
                className={`${inputGlossyClasses} appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="" disabled className="text-slate-400 dark:text-zinc-500">{form.state ? "Select City" : "Select State first"}</option>
                {cities.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none z-10" />
            </InputWrapper>
          </SectionCard>

        </form>
      </main>

      {/* --- PREMIUM STICKY ACTION BAR --- */}
      <div className="fixed bottom-0 left-0 w-full bg-blue-50/80 dark:bg-black/40 backdrop-blur-3xl border-t border-blue-200 dark:border-white/[0.15] shadow-[0_-8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.5)] z-50 py-4 px-6 before:absolute before:inset-0 before:bg-gradient-to-t before:from-blue-50/80 dark:before:from-black/40 before:to-transparent before:-z-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          
          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 dark:bg-black/40 border border-blue-200 dark:border-white/[0.1] dark:border-t-white/[0.2] shadow-inner text-slate-600 dark:text-zinc-300 backdrop-blur-md cursor-pointer hover:bg-blue-200/50 transition-colors" onClick={() => handleChange("email_public", !form.email_public)}>
                <button type="button" className="flex items-center justify-center p-1 hover:bg-white/10 rounded-full transition-colors">
                    {form.email_public ? <Eye size={12} className="text-sky-500" /> : <EyeOff size={12} className="text-slate-400 dark:text-zinc-500" />}
                </button>
                <span className="text-xs font-mono">UID: <span className="text-slate-900 dark:text-white">{user.email}</span></span>
              </div>
            ) : (
              <span className="text-xs text-rose-500 dark:text-rose-400 font-mono flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                <ShieldAlert size={14} /> Unauthorized access
              </span>
            )}
            
            {message.text && (
              <span className={`flex items-center gap-1.5 text-sm font-medium animate-in slide-in-from-bottom-2 opacity-100 ${message.type === 'success' ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}>
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                {message.text}
              </span>
            )}
          </div>

          <button 
            onClick={handleSubmit}
            disabled={!user || saving || usernameAvailable === false} 
            className="w-full sm:w-auto h-12 px-8 rounded-full bg-gradient-to-b from-sky-400 to-sky-600 border border-sky-300/50 border-t-sky-200 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] text-sm font-bold hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {saving ? "Syncing Config..." : (isFirstTime ? "Complete Setup" : "Save Changes")}
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default EditProfile;