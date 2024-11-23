import { UploadFileInfo } from "naive-ui";

// 定义视频项的接口
export interface VideoItem {
    videoPath: string;
    startTime: string;
    endTime: string;
    subtitlePath: string;
    startTimestamp: number;
    endTimestamp: number;
}

export interface ProjectIndex {
    projectPath: string;
    videos: VideoItem[];
    generatedAt: string;
}

// 将ISO时间字符串转换为时间戳
const isoToTimestamp = (isoString: string): number => {
    return new Date(isoString).getTime();
};

// 检查视频是否在指定时间范围内
const isVideoInTimeRange = (
    video: VideoItem,
    startTimestamp: number,
    endTimestamp: number
): boolean => {
    const videoStart = isoToTimestamp(video.startTime);
    const videoEnd = isoToTimestamp(video.endTime);

    // 视频的任何部分在选定时间范围内即可
    return (
        (videoStart <= endTimestamp && videoEnd >= startTimestamp) ||
        (videoEnd >= startTimestamp && videoStart <= endTimestamp)
    );
};

// 主函数：根据时间范围过滤视频并更新文件列表
export const updateFileListByTimeRange = (
    indexData: ProjectIndex,
    dateRange: [number, number],
): VideoItem[] => {
    if (!dateRange || !indexData.videos) return [];

    const [startTime, endTime] = dateRange;

    // 过滤符合时间范围的视频
    const filteredVideos = indexData.videos.filter(video =>
        isVideoInTimeRange(video, startTime, endTime)
    );

    return filteredVideos;
};
