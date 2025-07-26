export interface I18nConfig {
    i18nFilePath: string;
    autoImportI18n: boolean;
    i18nImportPath: string;
    templateI18nCall: string;
    scriptI18nCall: string;
    keyFilePathLevel: number;
    excludedExtensions: string[];
    excludedStrings: string[];
    debug: boolean;
    freeGoogle: boolean;
    baidu: {
        appid: string;
        secretKey: string;
    };
    deepl: {
        authKey: string;
        isPro: boolean;
    };
}
export declare const defaultConfig: I18nConfig;
export declare function getRootPath(): string;
export declare function getConfigPath(): string;
export declare function readConfig(): I18nConfig;
export declare function writeConfig(config: I18nConfig): void;
export declare function ensureConfigExists(): void;
//# sourceMappingURL=config.d.ts.map