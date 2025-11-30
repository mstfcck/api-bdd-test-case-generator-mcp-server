export interface IFileSystem {
    /**
     * Read file content
     */
    readFile(filePath: string): Promise<string>;

    /**
     * Write file content
     */
    writeFile(filePath: string, content: string): Promise<void>;

    /**
     * Check if file exists
     */
    exists(filePath: string): Promise<boolean>;

    /**
     * Create directory if it doesn't exist
     */
    ensureDir(dirPath: string): Promise<void>;
}
