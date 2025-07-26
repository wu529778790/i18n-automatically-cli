declare const path: any;
declare const chalk: any;
declare const ora: any;
declare const processFile: any;
declare const ensureConfigExists: any;
interface ScanOptions {
    file?: string;
}
declare function scanCommand(filePath?: string, options?: ScanOptions): Promise<void>;
//# sourceMappingURL=scan.d.ts.map