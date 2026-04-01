import { FormEvent, useEffect, useState, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, ChevronDown, User, AtSign, MapPin, 
  Map, Globe2, Github, Calendar, Hash, Loader2, 
  GraduationCap, Search, CheckCircle2, ShieldAlert
} from "lucide-react";
import { Country, State, City } from "country-state-city";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalRibbon from "@/components/GlobalRibbon";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseClient } from "@/lib/supabase";

interface ProfileFormState {
  full_name: string;
  display_name: string;
  college: string;
  age: string;
  gender: string;
  city: string;
  state: string;
  country: string;
  github_url: string;
  bio: string;
}

const emptyState: ProfileFormState = {
  full_name: "", display_name: "", college: "", age: "", gender: "", 
  city: "", state: "", country: "", github_url: "", bio: "",
};

// --- MOVED OUTSIDE TO PREVENT RE-RENDERING FOCUS LOSS ---
const SectionCard = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
  <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
    <div className="mb-6 pb-6 border-b border-white/[0.04]">
      <h2 className="text-xl font-semibold text-white tracking-tight">{title}</h2>
      <p className="text-sm text-zinc-400 mt-1">{description}</p>
    </div>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">{children}</div>
  </div>
);

const InputWrapper = ({ label, icon: Icon, children, fullWidth = false }: any) => (
  <div className={`flex flex-col gap-2 ${fullWidth ? 'sm:col-span-2' : ''}`}>
    <label className="text-sm font-medium text-zinc-300 ml-1">{label}</label>
    <div className="relative group/input">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-cyan-400 transition-colors pointer-events-none z-10">
        <Icon size={16} />
      </div>
      {children}
    </div>
  </div>
);
// ---------------------------------------------------------

const EditProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isFirstTime = location.state?.isFirstTime || false;

  const [form, setForm] = useState<ProfileFormState>(emptyState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

  // College Autocomplete State
  const [collegeSuggestions, setCollegeSuggestions] = useState<string[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load initial profile data
  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || "", display_name: profile.display_name || "",
      college: profile.college || "", age: profile.age ? String(profile.age) : "",
      gender: profile.gender || "", city: profile.city || "", state: profile.state || "",
      country: profile.country || "", github_url: profile.github_url || "", bio: profile.bio || "",
    });
  }, [profile]);

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

  // --- HANDLERS ---
  const handleChange = (key: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage({ text: "", type: "" }); // Clear messages on edit
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage({ text: "", type: "" });

    const profileFilter = profile?.id ? `id=eq.${encodeURIComponent(profile.id)}` : user.email ? `email=eq.${encodeURIComponent(user.email)}` : null;

    if (!profileFilter) {
      setSaving(false);
      setMessage({ text: "Unable to locate your profile record.", type: "error" });
      return;
    }

    try {
      await supabaseClient.update("users", profileFilter, {
        full_name: form.full_name.trim() || null, 
        display_name: form.display_name.trim() || null,
        college: form.college.trim() || null, 
        age: form.age ? Number(form.age) : null,
        gender: form.gender.trim() || null, 
        city: form.city.trim() || null,
        state: form.state.trim() || null, 
        country: form.country.trim() || null,
        github_url: form.github_url.trim() || null, 
        bio: form.bio.trim() || null,
        is_profile_complete: true // <-- CHANGED: Updates the correct new column
      });
      
      await refreshProfile();
      
      if (isFirstTime) {
        navigate('/');
      } else {
        setMessage({ text: "Profile updated successfully.", type: "success" });
      }
    } catch (error) {
      setMessage({ text: "Failed to update profile.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030308] text-white flex flex-col relative pb-24">
      <Navbar />
      <GlobalRibbon />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-28 sm:px-6">
        <div className="mb-8">
          {/* Hide the Back button if they are trapped in onboarding */}
          {!isFirstTime && (
            <Link to="/profile" className="inline-flex items-center gap-2 text-zinc-400 hover:text-cyan-400 transition-colors text-sm font-medium group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Profile
            </Link>
          )}
          
          <h1 className="text-3xl font-bold tracking-tight mt-6">
            {isFirstTime ? "Welcome to AlgoLib!" : "Settings"}
          </h1>
          <p className="mt-2 text-zinc-400">
            {isFirstTime 
              ? "Please complete your developer profile to initialize your matrix and access global features." 
              : "Manage your system parameters and personal data."}
          </p>
        </div>        
        
        <form onSubmit={handleSubmit} className="flex flex-col relative z-10">
          
          {/* --- SECTION 1: IDENTITY --- */}
          <SectionCard title="Identity Matrix" description="Your core personal identifiers used across the platform.">
            <InputWrapper label="Legal Name" icon={User}>
              <input 
                value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} 
                className="h-11 w-full rounded-xl border border-white/10 bg-[#111426] pl-10 pr-3 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all placeholder-zinc-600 text-white relative z-0" 
                placeholder="John Doe"
              />
            </InputWrapper>
            
            <InputWrapper label="Display Name" icon={AtSign}>
              <input 
                value={form.display_name} onChange={(e) => handleChange("display_name", e.target.value)} 
                className="h-11 w-full rounded-xl border border-white/10 bg-[#111426] pl-10 pr-3 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all placeholder-zinc-600 text-white relative z-0" 
                placeholder="johndoe99"
              />
            </InputWrapper>

            <InputWrapper label="Age" icon={Calendar}>
              <input 
                type="number" min={0} value={form.age} onChange={(e) => handleChange("age", e.target.value)} 
                className="h-11 w-full rounded-xl border border-white/10 bg-[#111426] pl-10 pr-3 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all placeholder-zinc-600 text-white relative z-0" 
                placeholder="21"
              />
            </InputWrapper>

            <InputWrapper label="Gender" icon={Hash}>
              <select 
                value={form.gender} onChange={(e) => handleChange("gender", e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#111426] pl-10 pr-10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all text-white relative z-0"
              >
                <option value="" disabled className="text-zinc-500">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none z-10" />
            </InputWrapper>
          </SectionCard>

          {/* --- SECTION 2: EDUCATION & LINKS --- */}
          <SectionCard title="Education & Links" description="Your academic background and professional profiles.">
            
            {/* COLLEGE RECOMMENDER */}
            <div className="sm:col-span-2 flex flex-col gap-2" ref={wrapperRef}>
              <label className="text-sm font-medium text-zinc-300 ml-1">College / Institute</label>
              <div className="relative group/input">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-cyan-400 transition-colors pointer-events-none z-10">
                  <GraduationCap size={16} />
                </div>
                <input 
                  value={form.college} 
                  onChange={(e) => {
                    handleChange("college", e.target.value);
                    setShowCollegeDropdown(true);
                  }} 
                  onFocus={() => setShowCollegeDropdown(true)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#111426] pl-10 pr-10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all placeholder-zinc-600 text-white relative z-0" 
                  placeholder="Search globally or type your specific institute..."
                  autoComplete="off"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none z-10">
                  {isSearchingColleges ? <Loader2 size={16} className="animate-spin text-cyan-400" /> : <Search size={16} />}
                </div>

                {/* Dropdown Menu */}
                {showCollegeDropdown && form.college.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-[#111426] border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                    {isSearchingColleges ? (
                      <div className="px-4 py-3 text-sm text-zinc-500 flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin text-zinc-500" />
                        Searching university databases...
                      </div>
                    ) : (
                      <>
                        {collegeSuggestions.length > 0 ? (
                          <>
                            <div className="px-4 py-1 text-[10px] font-mono tracking-wider text-zinc-500 uppercase">Suggestions</div>
                            {collegeSuggestions.map((college, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  handleChange("college", college);
                                  setShowCollegeDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                              >
                                {college}
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="px-4 py-3 text-sm text-zinc-500">
                            No global university match found.
                          </div>
                        )}
                        
                        {/* The Custom Fallback Option (Always available) */}
                        <div className="mt-1 border-t border-white/5 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowCollegeDropdown(false)}
                            className="w-full text-left px-4 py-2.5 text-sm text-cyan-400 hover:bg-cyan-400/10 transition-colors flex items-center gap-2"
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
                className="h-11 w-full rounded-xl border border-white/10 bg-[#111426] pl-10 pr-3 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all placeholder-zinc-600 text-white relative z-0" 
                placeholder="https://github.com/username"
              />
            </InputWrapper>

            <div className="sm:col-span-2 flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">Terminal Bio</label>
              <textarea 
                rows={4} value={form.bio} onChange={(e) => handleChange("bio", e.target.value)} 
                className="w-full rounded-xl border border-white/10 bg-[#111426] p-3 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all placeholder-zinc-600 text-white resize-y min-h-[100px] relative z-0" 
                placeholder="Tell us about your stack and current projects..."
              />
            </div>
          </SectionCard>

          {/* --- SECTION 3: TELEMETRY --- */}
          <SectionCard title="Telemetry Config" description="Your geographical coordinates.">
            <InputWrapper label="Country" icon={Globe2}>
              <select 
                value={form.country} onChange={(e) => { handleChange("country", e.target.value); handleChange("state", ""); handleChange("city", ""); }}
                className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#111426] pl-10 pr-10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all text-white relative z-0"
              >
                <option value="" disabled className="text-zinc-500">Select Country</option>
                {countries.map((country) => <option key={country.isoCode} value={country.name}>{country.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none z-10" />
            </InputWrapper>

            <InputWrapper label="State / Province" icon={Map}>
              <select 
                value={form.state} onChange={(e) => { handleChange("state", e.target.value); handleChange("city", ""); }} disabled={!form.country}
                className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#111426] pl-10 pr-10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed relative z-0"
              >
                <option value="" disabled className="text-zinc-500">{form.country ? "Select State" : "Select Country first"}</option>
                {states.map((state) => <option key={state.isoCode} value={state.name}>{state.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none z-10" />
            </InputWrapper>

            <InputWrapper label="City" icon={MapPin}>
              <select 
                value={form.city} onChange={(e) => handleChange("city", e.target.value)} disabled={!form.state}
                className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#111426] pl-10 pr-10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 focus:outline-none transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed relative z-0"
              >
                <option value="" disabled className="text-zinc-500">{form.state ? "Select City" : "Select State first"}</option>
                {cities.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none z-10" />
            </InputWrapper>
          </SectionCard>

        </form>
      </main>

      {/* --- STICKY ACTION BAR --- */}
      <div className="fixed bottom-0 left-0 w-full bg-[#030308]/80 backdrop-blur-xl border-t border-white/10 z-50 py-4 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            {user ? (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                UID: {user.email}
              </span>
            ) : (
              <span className="text-xs text-rose-400 font-mono">Unauthorized access</span>
            )}
            
            {message.text && (
              <span className={`flex items-center gap-1.5 text-sm font-medium ${message.type === 'success' ? 'text-cyan-400' : 'text-rose-400'}`}>
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                {message.text}
              </span>
            )}
          </div>

          <button 
            onClick={handleSubmit}
            disabled={!user || saving} 
            className="w-full sm:w-auto h-11 px-8 rounded-full bg-cyan-400 text-[#030308] text-sm font-bold hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Syncing Config..." : (isFirstTime ? "Complete Setup" : "Save Changes")}
          </button>
        </div>
      </div>
      
      {/* Invisible footer spacer so content isn't hidden behind sticky bar */}
      <div className="h-10"></div> 
    </div>
  );
};

export default EditProfile;