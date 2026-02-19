// Google Drive API service for saving/loading story files
// Requires a Google Cloud project with Drive API enabled and OAuth credentials

// drive.file = only files created by app, drive = full access to all files
const SCOPES = "https://www.googleapis.com/auth/drive";
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const FOLDER_NAME = "Vodnik Stories";

// You'll need to set these in your .env file
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;
let gapiInited = false;
let gisInited = false;
let pickerInited = false;

export type DriveFile = {
  id: string;
  name: string;
  modifiedTime: string;
};

// Load the Google API client library
export async function initGoogleApi(): Promise<void> {
  if (gapiInited && gisInited) return;

  // Load gapi
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google API"));
    document.head.appendChild(script);
  });

  await new Promise<void>((resolve, reject) => {
    gapi.load("client:picker", {
      callback: resolve,
      onerror: () => reject(new Error("Failed to load gapi client")),
    });
  });

  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  pickerInited = true;

  // Load GIS (Google Identity Services)
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.access_token) {
        accessToken = response.access_token;
      }
    },
  });
  gisInited = true;
}

// Sign in to Google
export function signIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("Google API not initialized"));
      return;
    }

    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      if (response.access_token) {
        accessToken = response.access_token;
        resolve(accessToken);
      }
    };

    if (accessToken === null) {
      // First time - prompt for consent
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      // Already have token - just refresh
      tokenClient.requestAccessToken({ prompt: "" });
    }
  });
}

// Sign out
export function signOut(): void {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
    });
  }
}

// Check if signed in
export function isSignedIn(): boolean {
  return accessToken !== null;
}

// Get current access token
export function getAccessToken(): string | null {
  return accessToken;
}

// Open native Google Drive picker
export function openPicker(onSelect: (fileId: string, fileName: string) => void): void {
  if (!pickerInited || !accessToken) {
    throw new Error("Picker not initialized or not signed in");
  }

  const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(false)
    .setMimeTypes("application/zip");

  const picker = new google.picker.PickerBuilder()
    .setAppId(CLIENT_ID.split("-")[0]) // Extract app ID from client ID
    .setOAuthToken(accessToken)
    .setDeveloperKey(API_KEY)
    .addView(view)
    .addView(new google.picker.DocsUploadView())
    .setCallback((data: google.picker.ResponseObject) => {
      if (data.action === google.picker.Action.PICKED) {
        const doc = data.docs[0];
        onSelect(doc.id, doc.name);
      }
    })
    .build();

  picker.setVisible(true);
}

// Get or create the Vodnik Stories folder
async function getOrCreateFolder(): Promise<string> {
  // Search for existing folder
  const response = await gapi.client.drive.files.list({
    q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  const files = response.result.files;
  if (files && files.length > 0) {
    return files[0].id!;
  }

  // Create folder if it doesn't exist
  const folderMetadata = {
    name: FOLDER_NAME,
    mimeType: "application/vnd.google-apps.folder",
  };

  const createResponse = await gapi.client.drive.files.create({
    resource: folderMetadata,
    fields: "id",
  });

  return createResponse.result.id!;
}

// Save a zip file to Google Drive
export async function saveToGoogleDrive(
  blob: Blob,
  filename: string
): Promise<string> {
  if (!accessToken) {
    throw new Error("Not signed in to Google");
  }

  const folderId = await getOrCreateFolder();

  // Check if file already exists
  const existingResponse = await gapi.client.drive.files.list({
    q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
    fields: "files(id)",
  });

  const existingFiles = existingResponse.result.files;
  const existingFileId = existingFiles && existingFiles.length > 0 ? existingFiles[0].id : null;

  // Use multipart upload
  const metadata = {
    name: filename,
    mimeType: "application/zip",
    parents: existingFileId ? undefined : [folderId],
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", blob);

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const response = await fetch(url, {
    method: existingFileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
}

// Load a zip file from Google Drive
export async function loadFromGoogleDrive(fileId: string): Promise<Blob> {
  if (!accessToken) {
    throw new Error("Not signed in to Google");
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  return response.blob();
}
