// Type declarations for Google APIs

declare namespace google.accounts.oauth2 {
  interface TokenClient {
    callback: (response: TokenResponse) => void;
    requestAccessToken: (options?: { prompt?: string }) => void;
  }

  interface TokenResponse {
    access_token?: string;
    error?: string;
    error_description?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  }

  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;
  function revoke(token: string, callback: () => void): void;
}

declare namespace google.picker {
  enum ViewId {
    DOCS = "all",
    DOCS_IMAGES = "docs-images",
    DOCS_VIDEOS = "docs-videos",
    FOLDERS = "folders",
  }

  enum Action {
    PICKED = "picked",
    CANCEL = "cancel",
  }

  interface DocumentObject {
    id: string;
    name: string;
    mimeType: string;
    url: string;
  }

  interface ResponseObject {
    action: Action;
    docs: DocumentObject[];
  }

  class DocsView {
    constructor(viewId?: ViewId);
    setIncludeFolders(include: boolean): DocsView;
    setSelectFolderEnabled(enabled: boolean): DocsView;
    setMimeTypes(mimeTypes: string): DocsView;
    setParent(folderId: string): DocsView;
  }

  class DocsUploadView {
    constructor();
    setIncludeFolders(include: boolean): DocsUploadView;
    setParent(folderId: string): DocsUploadView;
  }

  class PickerBuilder {
    setAppId(appId: string): PickerBuilder;
    setOAuthToken(token: string): PickerBuilder;
    setDeveloperKey(key: string): PickerBuilder;
    addView(view: DocsView | DocsUploadView): PickerBuilder;
    setCallback(callback: (data: ResponseObject) => void): PickerBuilder;
    build(): Picker;
  }

  interface Picker {
    setVisible(visible: boolean): void;
  }
}

declare namespace gapi {
  function load(api: string, options: { callback: () => void; onerror: () => void }): void;

  namespace client {
    function init(options: { apiKey?: string; discoveryDocs: string[] }): Promise<void>;

    namespace drive {
      namespace files {
        function list(params: {
          q?: string;
          fields?: string;
          orderBy?: string;
        }): Promise<{
          result: {
            files?: Array<{
              id?: string;
              name?: string;
              modifiedTime?: string;
            }>;
          };
        }>;

        function create(params: {
          resource: {
            name: string;
            mimeType: string;
            parents?: string[];
          };
          fields?: string;
        }): Promise<{
          result: {
            id?: string;
          };
        }>;
      }
    }
  }
}
