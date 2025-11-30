import { injectable } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IFileSystem } from '../../application/ports/index.js';

@injectable()
export class NodeFileSystem implements IFileSystem {
    async readFile(filePath: string): Promise<string> {
        return await fs.readFile(filePath, 'utf-8');
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await this.ensureDir(dir);

        await fs.writeFile(filePath, content, 'utf-8');
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async ensureDir(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            // Ignore if directory already exists
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
                throw error;
            }
        }
    }
}
