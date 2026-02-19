import { useState, useEffect, useCallback } from "react";
import {
  initGoogleApi,
  signIn as googleSignIn,
  signOut as googleSignOut,
  isSignedIn as checkIsSignedIn,
  saveToGoogleDrive,
  loadFromGoogleDrive,
  openPicker as googleOpenPicker,
} from "../services/googleDrive";

type UseGoogleDriveReturn = {
  isInitialized: boolean;
  isSignedIn: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  saveStory: (blob: Blob, filename: string) => Promise<string>;
  loadStory: (fileId: string) => Promise<Blob>;
  openPicker: (onSelect: (fileId: string, fileName: string) => void) => Promise<void>;
};

export function useGoogleDrive(): UseGoogleDriveReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google API on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initGoogleApi();
        if (mounted) {
          setIsInitialized(true);
          setIsSignedIn(checkIsSignedIn());
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize Google API");
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSignIn();
      setIsSignedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    googleSignOut();
    setIsSignedIn(false);
  }, []);

  const saveStory = useCallback(
    async (blob: Blob, filename: string) => {
      if (!isSignedIn) {
        await signIn();
      }
      setIsLoading(true);
      setError(null);
      try {
        const fileId = await saveToGoogleDrive(blob, filename);
        return fileId;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save to Google Drive";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isSignedIn, signIn]
  );

  const loadStory = useCallback(
    async (fileId: string) => {
      if (!isSignedIn) {
        await signIn();
      }
      setIsLoading(true);
      setError(null);
      try {
        const blob = await loadFromGoogleDrive(fileId);
        return blob;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load from Google Drive";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isSignedIn, signIn]
  );

  const openPicker = useCallback(
    async (onSelect: (fileId: string, fileName: string) => void) => {
      if (!isSignedIn) {
        await signIn();
      }
      setError(null);
      try {
        googleOpenPicker(onSelect);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to open picker";
        setError(message);
        throw err;
      }
    },
    [isSignedIn, signIn]
  );

  return {
    isInitialized,
    isSignedIn,
    isLoading,
    error,
    signIn,
    signOut,
    saveStory,
    loadStory,
    openPicker,
  };
}
