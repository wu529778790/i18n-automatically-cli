declare const fs: any;
declare const path: any;
declare const chalk: any;
declare const ora: any;
declare const processFile: any;
declare const ensureConfigExists: any, readConfig: any;
interface ScanBatchOptions {
    dir?: string;
    exclude?: string[];
}
declare function scanBatchCommand(options?: ScanBatchOptions): Promise<void>;
declare function getFilesToProcess(dir: string, excludedExtensions: string[], excludePatterns: string[]): string[];
declare function shouldSkipDirectory(dirName: string): boolean;
//# sourceMappingURL=scan-batch.d.ts.map