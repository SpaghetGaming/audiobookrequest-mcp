export interface SearchResult {
    book: {
        title: string;
        subtitle?: string;
        asin: string;
        authors: string[];
        narrators: string[];
        runtime_length_min: number;
        release_date?: string;
        cover_image?: string;
        downloaded?: boolean;
    };
    requests: { user_username: string }[];
}

export interface RequestItem {
    book: {
        title: string;
        asin: string;
        authors: string[];
        downloaded?: boolean;
    };
    requests: { user_username: string }[];
    download_error?: string;
}

export interface ManualRequest {
    id: string;
    title: string;
    author: string;
    narrator?: string;
    subtitle?: string;
    publish_date?: string;
    info?: string;
    downloaded?: boolean;
}

export interface User {
    username: string;
    group?: string;
    root?: boolean;
}

export interface IndexerConfiguration {
    indexer: string;
    config: Record<string, string>;
}

export interface Recommendation {
    book: {
        title: string;
        asin: string;
        authors: string[];
    };
    based_on: string;
}

export interface NotificationSettings {
    notification_enabled: boolean;
    notification_service?: string;
    notification_config?: Record<string, string>;
}

export interface DownloadSettings {
    auto_download_enabled: boolean;
    quality_heuristics?: Record<string, string>;
}

export interface InstanceSettings {
    instance_name?: string;
    instance_description?: string;
}

export interface AudiobookshelfSettings {
    abs_enabled: boolean;
    abs_url?: string;
    abs_token?: string;
    abs_library?: string;
}

export interface OIDCSettings {
    oidc_enabled: boolean;
    oidc_issuer?: string;
    oidc_client_id?: string;
    oidc_client_secret?: string;
}

export interface ProwlarrSettings {
    prowlarr_enabled: boolean;
    prowlarr_url?: string;
    prowlarr_api_key?: string;
}

export interface LoginType {
    login_type: string;
}
