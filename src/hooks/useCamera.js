import { createContext, useContext } from 'react';

export const CameraContext = createContext(null);
export const useCamera = () => useContext(CameraContext);
