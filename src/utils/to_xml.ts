import { VideoItem } from "./time_filter";

function generateFCPXML(videos: VideoItem[], rootDir: string): string {
    // 找到最早的开始时间作为基准点
    const earliestStartTime = Math.min(...videos.map(v => new Date(v.startTime).getTime()));

    // 辅助函数：计算相对时间（返回秒数）
    const getRelativeTime = (timestamp: number): number => {
        return (timestamp - earliestStartTime) / 1000;
    };

    // 辅助函数：生成FCPXML时间格式 (s/frames)
    const formatFCPTime = (seconds: number): string => {
        const frameRate = 30; // 假设30fps
        const totalFrames = Math.floor(seconds * frameRate);
        return `${Math.floor(totalFrames / frameRate)}/${totalFrames % frameRate}s`;
    };

    // 生成资源列表
    const resourcesXML = videos.map((video, index) => `
        <asset id="r${index + 1}">
            <media>
                <video>
                    <asset-clip format="r301" src="file://${rootDir}/${video.videoPath}" />
                </video>
            </media>
        </asset>
    `).join('');

    // 生成时间线片段
    const clipsXML = videos.map((video, index) => {
        const startTime = getRelativeTime(new Date(video.startTime).getTime());
        const duration = (video.endTimestamp - video.startTimestamp) / 1000;

        return `
            <asset-clip 
                name="Clip ${index + 1}" 
                ref="r${index + 1}" 
                start="${formatFCPTime(startTime)}"
                duration="${formatFCPTime(duration)}"
                format="r301">
                <adjust-transform position="0 0" anchor="0 0" />
            </asset-clip>
        `;
    }).join('');

    // 计算总时长
    const lastVideo = videos[videos.length - 1];
    const totalDuration = getRelativeTime(lastVideo.endTimestamp) -
        getRelativeTime(new Date(videos[0].startTime).getTime());

    // 生成完整的XML结构
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
    <resources>
        <format id="r301" name="FFVideoFormat1080p30" frameDuration="1/30s" width="1920" height="1080" />
        <text-style id="ts1" font="Helvetica" fontSize="72" color="1 1 1 1" />
        ${resourcesXML}
    </resources>
    <library>
        <event name="Video Project">
            <project name="Video Sequence">
                <sequence format="r301" duration="${formatFCPTime(totalDuration)}">
                    <spine>
                        ${clipsXML}
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>`;

    return xmlContent;
}

// 使用示例：
function generateProjectXML(videos: VideoItem[], rootDir: string): string {
    try {
        const xmlContent = generateFCPXML(videos, rootDir);
        return xmlContent;
    } catch (error) {
        console.error('Error generating XML:', error);
        throw error;
    }
}

export { generateProjectXML };