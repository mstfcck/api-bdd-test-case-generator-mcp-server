import { NodeFileSystem } from '../../../src/infrastructure/filesystem/NodeFileSystem';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');
jest.mock('path');

describe('NodeFileSystem Coverage', () => {
    let fileSystem: NodeFileSystem;

    beforeEach(() => {
        fileSystem = new NodeFileSystem();
        jest.clearAllMocks();
    });

    it('should rethrow error in ensureDir if code is not EEXIST', async () => {
        const error = new Error('Permission denied');
        (error as any).code = 'EACCES';
        (fs.mkdir as jest.Mock).mockRejectedValue(error);

        await expect(fileSystem.ensureDir('/test/dir')).rejects.toThrow('Permission denied');
    });

    it('should ignore EEXIST error in ensureDir', async () => {
        const error = new Error('File exists');
        (error as any).code = 'EEXIST';
        (fs.mkdir as jest.Mock).mockRejectedValue(error);

        await expect(fileSystem.ensureDir('/test/dir')).resolves.not.toThrow();
    });

    it('should return false if exists throws', async () => {
        (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));
        const exists = await fileSystem.exists('/test/file');
        expect(exists).toBe(false);
    });

    it('should return true if exists succeeds', async () => {
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        const exists = await fileSystem.exists('/test/file');
        expect(exists).toBe(true);
    });

    it('should read file', async () => {
        (fs.readFile as jest.Mock).mockResolvedValue('content');
        const content = await fileSystem.readFile('/test/file');
        expect(content).toBe('content');
        expect(fs.readFile).toHaveBeenCalledWith('/test/file', 'utf-8');
    });

    it('should write file ensuring directory exists', async () => {
        (path.dirname as jest.Mock).mockReturnValue('/test');
        (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

        await fileSystem.writeFile('/test/file', 'content');

        expect(path.dirname).toHaveBeenCalledWith('/test/file');
        expect(fs.mkdir).toHaveBeenCalledWith('/test', { recursive: true });
        expect(fs.writeFile).toHaveBeenCalledWith('/test/file', 'content', 'utf-8');
    });
});
