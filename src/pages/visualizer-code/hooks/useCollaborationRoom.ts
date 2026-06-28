import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, update, remove, onDisconnect, push } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TraceData } from './useTraceEngine';

export type Role = 'host' | 'viewer' | null;

export interface RoomState {
  code?: string;
  languageId?: string;
  customInput?: string;
  traceData?: TraceData | null;
  currentStep?: number;
  cursorPosition?: { lineNumber: number; column: number; color?: string; userId?: string };
  allowViewerEdits?: boolean;
  hostId?: string;
  [key: string]: any; // Allow arbitrary state for DSA visualizers
}

export interface Participant {
  connId: string;
  userId: string;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean;
  joinedAt: number;
}

export interface UseCollaborationRoomOptions {
  namespace?: string;
  allowUnauthJoin?: boolean;
}

export function useCollaborationRoom(options?: UseCollaborationRoomOptions) {
  const { namespace = 'rooms', allowUnauthJoin = false } = options || {};

  const { user, profile } = useAuth();
  
  // Initialize state from sessionStorage if available
  const [roomId, setRoomId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('algolib_collab_roomId');
    }
    return null;
  });
  
  const [role, setRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('algolib_collab_role') as Role;
    }
    return null;
  });
  
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Keep track of the latest room state to avoid echoing updates back to ourselves
  const localStateRef = useRef<RoomState | null>(null);

  // Sync state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (roomId && role) {
            sessionStorage.setItem('algolib_collab_roomId', roomId);
            sessionStorage.setItem('algolib_collab_role', role);
        } else {
            sessionStorage.removeItem('algolib_collab_roomId');
            sessionStorage.removeItem('algolib_collab_role');
        }
    }
  }, [roomId, role]);

  const leaveRoom = useCallback(async () => {
    if (roomId && role === 'host') {
      try {
        const roomRef = ref(rtdb, `${namespace}/${roomId}`);
        await remove(roomRef);
      } catch (err) {
        console.error("Error deleting room", err);
      }
    }
    setRoomId(null);
    setRole(null);
    setRoomState(null);
    localStateRef.current = null;
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('algolib_collab_roomId');
        sessionStorage.removeItem('algolib_collab_role');
    }
  }, [roomId, role]);

  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(rtdb, `${namespace}/${roomId}`);
    
    // Presence tracking
    const connectionsRef = ref(rtdb, `${namespace}/${roomId}/connections`);
    const myConnectionRef = push(connectionsRef);
    onDisconnect(myConnectionRef).remove();
    
    // Store user data in the connection payload
    set(myConnectionRef, {
      userId: user?.uid || 'anonymous',
      name: user ? (user.displayName || 'Anonymous') : 'Anonymous',
      username: profile?.username || null,
      avatar_url: profile?.avatar_url || user?.photoURL || null,
      is_verified: profile?.is_verified || false,
      joinedAt: Date.now()
    });

    // Listen for being kicked
    const unsubMyConn = onValue(myConnectionRef, (snap) => {
      // If our connection node is deleted and we didn't voluntarily leave
      if (!snap.exists() && roomId && role === 'viewer') {
         toast.error("You have been removed from the session.");
         leaveRoom();
      }
    });

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomState(data.state ? { ...data.state, hostId: data.hostId } : { hostId: data.hostId });
        const conns = data.connections || {};
        setViewerCount(Object.keys(conns).length);
        
        // Parse participants list
        const parts = Object.entries(conns).map(([connId, pData]: [string, any]) => ({
          connId,
          ...pData
        })) as Participant[];
        
        // Sort by joined time
        parts.sort((a, b) => a.joinedAt - b.joinedAt);
        setParticipants(parts);

      } else {
        // Room was deleted
        if (role === 'viewer') {
          toast.info("The host has ended this session.");
          leaveRoom();
        }
      }
    });

    return () => {
      unsubscribe();
      unsubMyConn();
      remove(myConnectionRef).catch(() => {});
      onDisconnect(myConnectionRef).cancel();
    };
  }, [roomId, role, leaveRoom]);


  const createRoom = useCallback(async (initialState: RoomState) => {
    if (!user) {
      toast.error("You must be logged in to create a room.");
      return null;
    }

    const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const roomRef = ref(rtdb, `${namespace}/${newRoomId}`);
    
    try {
      await set(roomRef, {
        hostId: user.uid,
        hostName: user.displayName || 'Unknown',
        createdAt: Date.now(),
        state: initialState
      });
      setRoomId(newRoomId);
      setRole('host');
      const stateWithHost = { ...initialState, hostId: user.uid };
      setRoomState(stateWithHost);
      localStateRef.current = stateWithHost;
      toast.success(`Room created! Code: ${newRoomId}`);
      return newRoomId;
    } catch (err: any) {
      console.error("Error creating room:", err);
      toast.error("Failed to create room.");
      return null;
    }
  }, [user]);

  const joinRoom = useCallback(async (code: string, silent: boolean = false) => {
    if (!user && !allowUnauthJoin) {
      if (!silent) toast.error("You must be logged in to join a room.");
      return false;
    }

    const normalizedCode = code.trim().toUpperCase();
    const roomRef = ref(rtdb, `${namespace}/${normalizedCode}`);
    
    return new Promise<RoomState | false>((resolve) => {
      onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoomId(normalizedCode);
          setRole('viewer');
          const stateWithHost = data.state ? { ...data.state, hostId: data.hostId } : { hostId: data.hostId };
          setRoomState(stateWithHost);
          toast.success("Joined room successfully!");
          resolve(stateWithHost);
        } else {
          if (!silent) toast.error("Room not found. Check the code.");
          resolve(false);
        }
      }, { onlyOnce: true }); // We only need it once to check existence, the main useEffect handles updates
    });
  }, [user]);

  const broadcastState = useCallback((partialState: Partial<RoomState>) => {
    if (!roomId) return;
    
    // Optimistically update local ref to prevent loops
    localStateRef.current = { ...localStateRef.current, ...partialState } as RoomState;
    
    const stateRef = ref(rtdb, `${namespace}/${roomId}/state`);
    update(stateRef, partialState).catch(err => {
      console.error("Failed to broadcast state", err);
    });
  }, [role, roomId]);

  const kickParticipant = useCallback((connId: string) => {
    if (role === 'host' && roomId) {
      remove(ref(rtdb, `${namespace}/${roomId}/connections/${connId}`));
      toast.success("User removed from the session.");
    }
  }, [role, roomId, namespace]);

  return {
    roomId,
    role,
    roomState,
    viewerCount,
    participants,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastState,
    kickParticipant
  };
}
