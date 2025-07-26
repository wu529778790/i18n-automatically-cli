export interface ProcessResult {
    success: boolean;
    changes: number;
    errors: string[];
}
export declare function processFile(filePath: string): Promise<ProcessResult>;
//# sourceMappingURL=processor.d.ts.map