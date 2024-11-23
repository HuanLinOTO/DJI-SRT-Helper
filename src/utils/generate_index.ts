// 定义接口
interface VideoTimeRange {
    videoPath: string;
    startTime: string;
    endTime: string;
    startTimestamp: number;
    endTimestamp: number;
    subtitlePath: string;
}


interface IndexResult {
    projectPath: string;
    videos: VideoTimeRange[];
    generatedAt: string;
}

// 解析时间字符串为时间戳
function parseTimeString(timeStr: string): number {
    const [datePart, timePart] = timeStr.split(' ');
    if (!datePart || !timePart) return 0;
    return new Date(`${datePart}T${timePart}`).getTime();
}

// 从字幕内容中提取时间戳
function extractTimestampFromSubtitle(content: string): string | null {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            // 匹配类似 "2024-11-23 09:58:17.237" 的时间格式
            const cur_time = new Date(nextLine.split(",")[0])
            // @ts-ignore
            if (!isNaN(cur_time)) {
                return cur_time.toISOString();
            }
        }
    }
    return null;
}

// 处理单个字幕文件
async function processSubtitleFile(fileHandle: FileSystemFileHandle): Promise<{ startTime: string; endTime: string }> {
    const file = await fileHandle.getFile();
    const content = await file.text();
    const subtitleBlocks = content.split('\n\n').filter(block => block.trim());
    let firstTimestamp: string | null = null;
    let lastTimestamp: string | null = null;

    // 获取第一个时间戳
    if (subtitleBlocks.length > 0) {
        firstTimestamp = extractTimestampFromSubtitle(subtitleBlocks[0]);
    }

    // 获取最后一个时间戳
    if (subtitleBlocks.length > 0) {
        for (let i = subtitleBlocks.length - 1; i >= 0; i--) {
            lastTimestamp = extractTimestampFromSubtitle(subtitleBlocks[i]);
            if (lastTimestamp) {
                break;
            }
        }
    }

    if (!firstTimestamp || !lastTimestamp) {
        throw new Error('无法从字幕文件中提取时间戳');
    }

    return {
        startTime: firstTimestamp,
        endTime: lastTimestamp
    };
}

// 检查是否是字幕文件
function isSubtitleFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.srt');
}

// 检查是否是视频文件
function isVideoFile(filename: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

// 查找匹配的视频文件
async function findMatchingVideoFile(subtitlePath: string, dirHandle: any): Promise<FileSystemFileHandle | null> {
    const subtitleBaseName = subtitlePath.slice(0, subtitlePath.lastIndexOf('.'));

    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && isVideoFile(entry.name)) {
            const videoBaseName = entry.name.slice(0, entry.name.lastIndexOf('.'));
            if (videoBaseName === subtitleBaseName) {
                return entry;
            }
        }
    }
    return null;
}

// 主处理函数
async function processDirectory(dirHandle: any): Promise<IndexResult> {
    try {
        // 请求用户选择目录
        // @ts-ignore
        // const dirHandle = await window.showDirectoryPicker();
        const projectPath = dirHandle.name;
        const videos: VideoTimeRange[] = [];

        // 递归处理目录的函数
        async function processDirectoryRecursively(handle: any, currentPath: string = '') {
            for await (const entry of handle.values()) {
                if (entry.kind === 'directory') {
                    // 递归处理子目录
                    await processDirectoryRecursively(
                        await handle.getDirectoryHandle(entry.name),
                        `${currentPath}/${entry.name}`
                    );
                } else if (entry.kind === 'file' && isSubtitleFile(entry.name)) {
                    // 处理字幕文件
                    const subtitlePath = `${currentPath}/${entry.name}`;
                    const videoFile = await findMatchingVideoFile(entry.name, handle);

                    if (videoFile) {
                        const { startTime, endTime } = await processSubtitleFile(entry);

                        videos.push({
                            videoPath: `${currentPath}/${videoFile.name}`,
                            subtitlePath,
                            startTime,
                            endTime,
                            startTimestamp: parseTimeString(startTime),
                            endTimestamp: parseTimeString(endTime)
                        });
                    }
                }
            }
        }

        // 开始处理
        await processDirectoryRecursively(dirHandle);

        // 按时间排序
        videos.sort((a, b) => a.startTimestamp - b.startTimestamp);

        return {
            projectPath,
            videos,
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('处理目录时发生错误:', error);
        throw error;
    }
}

// 使用示例
export async function get_index() {
    try {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();

        const index = await processDirectory(dirHandle);
        console.log('索引生成完成:', index);
        // 将结果下载为JSON文件
        const indexFile = new File([JSON.stringify(index)], 'index.json', { type: 'application/json' });
        const indexUrl = URL.createObjectURL(indexFile);
        const a = document.createElement('a');
        a.href = indexUrl;
        a.download = `index_${dirHandle.name}.json`;
        a.click();
        console.log('索引已生成并保存');
    } catch (error) {
        console.error('生成索引时发生错误:', error);
    }
}