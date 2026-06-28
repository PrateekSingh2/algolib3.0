import React, { createContext, useContext } from 'react';
import { useCollaborationRoom, RoomState } from '../pages/visualizer-code/hooks/useCollaborationRoom';

interface CollaborationContextType {
  roomId: string | null;
  role: 'host' | 'viewer' | null;
  roomState: RoomState | null;
  createRoom: (initialState: RoomState) => Promise<string | null>;
  joinRoom: (roomId: string) => Promise<RoomState | false>;
  leaveRoom: () => void;
  broadcastState: (partialState: Partial<RoomState>) => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

const InternalProvider = ({ children }: { children: React.ReactNode }) => {
  const collab = useCollaborationRoom();
  return <CollaborationContext.Provider value={collab}>{children}</CollaborationContext.Provider>;
};

export const CollaborationProvider: React.FC<{ children: React.ReactNode; value?: CollaborationContextType }> = ({ children, value }) => {
  if (value) {
    return <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>;
  }
  return <InternalProvider>{children}</InternalProvider>;
};

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};
