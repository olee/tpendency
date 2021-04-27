// typings and utilities for chrome devtools formatters

export type JsonMLElementType = 'object' | 'div' | 'span' | 'ol' | 'li' | 'table' | 'tr' | 'td';
export type JsonMLElement = [JsonMLElementType, object, ...JsonMLChild[]] | [JsonMLElementType, ...JsonMLChild[]];
export type JsonMLChild = JsonMLElement | string;

export interface DevToolsFormatter<TConfig = any> {
    header: (obj: any, config?: TConfig) => JsonMLElement | null;
    hasBody?: (obj: any, config?: TConfig) => boolean;
    body?: (obj: any, config?: TConfig) => JsonMLElement;
}

declare global {
    interface Window {
        devtoolsFormatters?: DevToolsFormatter[];
    }
}

/** Registers a new devtools formatter */
export function addDevtoolsFormatter(formatter: DevToolsFormatter) {
    if (typeof window === 'undefined') {
        return;
    }
    (window.devtoolsFormatters || (window.devtoolsFormatters = [])).push(formatter);
}
