import { createSignal, createEffect, onCleanup, Show, For, onMount } from 'solid-js';
import { supabase } from '../lib/supabase';
import { MapPin, Navigation, XCircle, CheckCircle, Navigation2 } from 'lucide-solid';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Capacitor, registerPlugin } from '@capacitor/core';

const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');

interface LiveTrackerProps {
  eventId: string;
  groupId: string;
  currentUserId: string;
  isAdmin?: boolean;
}

export default function LiveTracker(props: LiveTrackerProps) {
  const [isOptedIn, setIsOptedIn] = createSignal(false);
  const [isArrived, setIsArrived] = createSignal(false);
  const [locations, setLocations] = createSignal<any[]>([]);
  const [profileMap, setProfileMap] = createSignal<Record<string, { full_name: string, avatar_url: string | null }>>({});
  
  let mapContainer: HTMLDivElement | undefined;
  let map: L.Map | null = null;
  let markers: Record<string, L.Marker> = {};
  let watchId: string | number | null = null;
  let channel: any = null;

  // Load profiles for the group
  createEffect(() => {
    const fetchProfiles = async () => {
      const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', props.groupId);
      if (members) {
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
        const mapData = profiles?.reduce((acc: any, p: any) => ({ ...acc, [p.id]: { full_name: p.full_name, avatar_url: p.avatar_url } }), {}) || {};
        setProfileMap(mapData);
      }
    };
    fetchProfiles();
  });

  let isInitialLoad = true;

  // Fetch initial locations and subscribe
  createEffect(() => {
    if (!isOptedIn() && !props.isAdmin) return;

    const fetchLocations = async () => {
      const { data } = await supabase.from('event_locations').select('*').eq('event_id', props.eventId);
      if (data) {
        setLocations(data);
        updateMapMarkers(data);
        
        // Check my own status
        const myLoc = data.find(l => l.user_id === props.currentUserId);
        if (myLoc && myLoc.is_arrived) {
          setIsArrived(true);
          stopTracking();
        }
      }
    };

    fetchLocations();

    channel = supabase.channel(`event_locations_${props.eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_locations', filter: `event_id=eq.${props.eventId}` },
        (payload) => {
          setLocations((prev) => {
            let next = [...prev];
            const idx = next.findIndex(l => l.user_id === (payload.new as any).user_id);
            if (payload.eventType === 'DELETE') {
               next = next.filter(l => l.user_id !== (payload.old as any).user_id);
            } else if (idx > -1) {
               next[idx] = payload.new;
            } else {
               next.push(payload.new);
            }
            updateMapMarkers(next);
            return next;
          });
        }
      )
      .subscribe();

    onCleanup(() => {
      if (channel) supabase.removeChannel(channel);
    });
  });

  // Init Leaflet map
  createEffect(() => {
    if ((isOptedIn() || props.isAdmin) && mapContainer && !map) {
      map = L.map(mapContainer).setView([0, 0], 2);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);
    }
  });

  const getCustomIcon = (userId: string) => {
    const profile = profileMap()[userId];
    const avatarUrl = profile?.avatar_url || `https://i.pravatar.cc/150?u=${userId}`;
    
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `
        <div style="
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          border: 3px solid ${userId === props.currentUserId ? '#4f46e5' : '#10b981'};
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          background-color: white;
          position: relative;
        ">
          <img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const updateMapMarkers = (locs: any[]) => {
    if (!map) return;
    
    // Clear old markers that no longer exist
    const userIds = locs.map(l => l.user_id);
    Object.keys(markers).forEach(uid => {
      if (!userIds.includes(uid) || locs.find(l => l.user_id === uid)?.is_arrived) {
        map!.removeLayer(markers[uid]);
        delete markers[uid];
      }
    });

    const bounds = L.latLngBounds([]);
    let hasValidPoints = false;
    const now = new Date().getTime();

    locs.forEach(loc => {
      if (loc.is_arrived) return; // Don't show arrived people on map
      
      // Ignore stale locations (older than 5 minutes)
      const locTime = new Date(loc.updated_at || loc.created_at || Date.now()).getTime();
      if (now - locTime > 5 * 60 * 1000) return;
      
      const { user_id, lat, lng } = loc;
      bounds.extend([lat, lng]);
      hasValidPoints = true;

      if (markers[user_id]) {
        markers[user_id].setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: getCustomIcon(user_id) }).addTo(map!);
        const profile = profileMap()[user_id];
        if (profile) {
          marker.bindPopup(`<b>${profile.full_name}</b>`);
        }
        markers[user_id] = marker;
      }
    });

    if (hasValidPoints && Object.keys(markers).length > 0) {
      if (isInitialLoad) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        isInitialLoad = false;
      }
    }
  };

  const handleRecenter = () => {
    if (!map) return;
    const bounds = L.latLngBounds([]);
    let hasValidPoints = false;
    Object.values(markers).forEach(marker => {
      bounds.extend(marker.getLatLng());
      hasValidPoints = true;
    });
    if (hasValidPoints) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  };

  const broadcastMessage = async (text: string) => {
    try {
      await supabase.from('messages').insert({
        group_id: props.groupId,
        user_id: props.currentUserId,
        content: text
      });
    } catch(e) { console.error(e); }
  };

  const startTracking = async () => {
    setIsOptedIn(true);
    broadcastMessage(`📍 I've just started sharing my live location! See you soon.`);
    
    if (Capacitor.isNativePlatform()) {
      try {
        const watcher_id = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: "Tracking your location for the group event.",
            backgroundTitle: "Jemaw Event Tracking",
            requestPermissions: true,
            stale: false,
            distanceFilter: 10
          },
          function callback(location: any, error: any) {
            if (error) {
              console.error(error);
              return;
            }
            if (location) {
              updateLocation({
                coords: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy
                }
              } as GeolocationPosition);
            }
          }
        );
        watchId = watcher_id;
      } catch (err) {
        console.error("Failed to start background tracking", err);
        setIsOptedIn(false);
      }
    } else {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        setIsOptedIn(false);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(updateLocation, (err) => {
        alert("Please allow location access to use this feature.");
        setIsOptedIn(false);
      }, { enableHighAccuracy: true });

      watchId = navigator.geolocation.watchPosition(updateLocation, console.error, {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      });
    }
  };

  const updateLocation = async (position: GeolocationPosition) => {
    if (isArrived()) return;
    const { latitude, longitude, accuracy } = position.coords;
    
    // Ignore highly inaccurate points to prevent map jumping
    if (accuracy && accuracy > 100) return;
    
    await supabase.from('event_locations').upsert({
      event_id: props.eventId,
      user_id: props.currentUserId,
      lat: latitude,
      lng: longitude,
      is_arrived: false,
      updated_at: new Date().toISOString()
    }, { onConflict: 'event_id,user_id' });
  };

  const markArrived = async () => {
    setIsArrived(true);
    stopTracking();
    
    // Keep them in DB as arrived, so others know they arrived, but remove their pin
    await supabase.from('event_locations').upsert({
      event_id: props.eventId,
      user_id: props.currentUserId,
      lat: 0,
      lng: 0, // Zero out coordinates for privacy
      is_arrived: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'event_id,user_id' });

    await broadcastMessage(`✅ I've arrived at the meetup location!`);

    // Check for latecomers
    try {
      const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', props.groupId);
      if (!members || members.length < 2) return;
      
      const { data: arrived } = await supabase.from('event_locations')
        .select('user_id')
        .eq('event_id', props.eventId)
        .eq('is_arrived', true);
        
      const arrivedIds = (arrived || []).map(a => a.user_id);
      
      // If exactly 1 person hasn't arrived
      if (arrivedIds.length === members.length - 1) {
        const lateComerId = members.find(m => !arrivedIds.includes(m.user_id))?.user_id;
        if (lateComerId) {
          const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', lateComerId).single();
          if (profile) {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            let roast = `Everyone's waiting on you! Did you get lost on the way, or are you just naturally this slow?`;
            
            if (apiKey) {
              try {
                const prompt = `Write a very short, funny, 1-sentence roast for a friend named "${profile.full_name}" who is the absolute LAST person to arrive at our group meetup. Be sarcastic but friendly. Do not use quotes.`;
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                if (response.ok) {
                  const data = await response.json();
                  if (data.candidates && data.candidates[0].content) {
                    roast = data.candidates[0].content.parts[0].text;
                  }
                }
              } catch (err) {
                console.error("AI Roast generation failed, using fallback.", err);
              }
            }
            
            const avatarImage = profile.avatar_url ? `![Avatar](${profile.avatar_url})` : '🐌';
            
            await supabase.from('messages').insert({
              group_id: props.groupId,
              user_id: props.currentUserId,
              content: `🚨 **[LAST TO ARRIVE ALERT: ${profile.full_name}]** 🚨\n\n${roast}\n\n${avatarImage}`
            });
            
            alert(`Everyone has arrived except ${profile.full_name}! A latecomer alert has been sent to the group chat.`);
          }
        }
      }
    } catch(e) { console.error(e); }
  };

  const stopTracking = () => {
    if (watchId !== null) {
      if (Capacitor.isNativePlatform() && typeof watchId === 'string') {
        BackgroundGeolocation.removeWatcher({ id: watchId });
      } else {
        navigator.geolocation.clearWatch(watchId as number);
      }
      watchId = null;
    }
  };

  onCleanup(() => {
    stopTracking();
  });

  return (
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg mb-8">
      <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
        <div>
          <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Navigation2 size={20} class="text-indigo-500" />
            Live Location Tracker
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            See who's on their way. Sharing stops automatically when you arrive.
          </p>
        </div>
      </div>

      <Show when={!isOptedIn() && !isArrived()}>
        <div class="p-10 text-center flex flex-col items-center justify-center">
          <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <MapPin size={32} />
          </div>
          <h4 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Share your live location</h4>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Help your group find you! Your location is only shared during the meeting day and stops when you arrive.
          </p>
          <button 
            onClick={startTracking}
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Navigation size={18} /> Share My Location
          </button>
        </div>
      </Show>

      <Show when={(isOptedIn() || props.isAdmin) && !isArrived()}>
        <div class="relative w-full h-[400px]">
          {/* Map Container */}
          <div ref={mapContainer!} class="absolute inset-0 z-0"></div>
          
          {/* Overlay Controls */}
          <div class="absolute bottom-4 left-0 right-0 z-[400] flex justify-center pointer-events-none px-4">
             <div class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl shadow-xl pointer-events-auto border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <button 
                  onClick={handleRecenter}
                  class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                >
                  <MapPin size={16} /> Recenter
                </button>
                <Show when={isOptedIn()}>
                  <div class="flex items-center gap-2">
                    <span class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                    <span class="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200">Sharing...</span>
                  </div>
                  <button 
                    onClick={markArrived}
                    class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> I've Arrived!
                  </button>
                </Show>
                <Show when={!isOptedIn() && props.isAdmin}>
                  <div class="flex items-center gap-2 px-2">
                    <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Admin View Only</span>
                  </div>
                </Show>
             </div>
          </div>
        </div>
      </Show>
      
      <Show when={isArrived()}>
        <div class="p-8 text-center bg-emerald-50 dark:bg-emerald-900/10">
          <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h4 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400">You've Arrived!</h4>
          <p class="text-sm text-emerald-600/80 dark:text-emerald-500/80 mt-1">
            Location sharing has been completely disabled.
          </p>
        </div>
      </Show>
    </div>
  );
}
