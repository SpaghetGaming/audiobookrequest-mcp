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
    auto_download?: boolean;
    flac_range?: { from_kbits?: number; to_kbits?: number };
    m4b_range?: { from_kbits?: number; to_kbits?: number };
    mp3_range?: { from_kbits?: number; to_kbits?: number };
    unknown_audio_range?: { from_kbits?: number; to_kbits?: number };
    unknown_range?: { from_kbits?: number; to_kbits?: number };
    min_seeders?: number;
    name_ratio?: number;
    title_ratio?: number;
    indexer_flags?: any[];
}

export interface InstanceSettings {
    instance_name?: string;
    instance_description?: string;
}

export interface AudiobookshelfSettings {
    abs_base_url?: string;
    abs_api_token?: string;
    abs_library_id?: string;
    abs_check_downloaded?: boolean;
    abs_libraries?: any[];
}

export interface SecuritySettings {
    login_type?: 'local' | 'oidc';
    access_token_expiry?: number;
    min_password_length?: number;
    oidc_endpoint?: string;
    oidc_client_id?: string;
    oidc_client_secret?: string;
    oidc_scope?: string;
    oidc_username_claim?: string;
    oidc_group_claim?: string;
    oidc_redirect_scheme?: string;
    oidc_logout_url?: string;
    force_login_type?: string | null;
}

export interface ProwlarrSettings {
    base_url?: string;
    api_key?: string;
    selected_categories?: any[];
    selected_indexers?: any[];
    all_categories?: Record<string, string>;
    indexers?: any;
}
