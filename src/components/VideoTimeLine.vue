<template>
    <n-timeline item-placement="left">
        <!-- @vue-expect-error -->
        <n-timeline-item v-for="event in timelineEvents" :key="`${event.videoPath}-${event.type}`"
            :type="getEventInfo(event).type" :title="getEventInfo(event).title" :content="getEventInfo(event).content"
            :time="getEventInfo(event).time" />
    </n-timeline>
</template>

<script setup lang="ts">
import { NTimeline, NTimelineItem } from 'naive-ui';
import { computed } from 'vue';
import dayjs from 'dayjs';
import { VideoItem } from '../utils/time_filter';

interface TimelineEvent {
    type: 'start' | 'end';
    time: string;
    videoPath: string;
}

// 定义 props
const props = defineProps<{
    videos: VideoItem[]
}>();

// 将视频数组转换为时间线事件数组
const timelineEvents = computed(() => {
    const events: TimelineEvent[] = [];

    props.videos.forEach(video => {
        // 添加开始事件
        events.push({
            type: 'start',
            time: video.startTime,
            videoPath: video.videoPath
        });

        // 添加结束事件
        events.push({
            type: 'end',
            time: video.endTime,
            videoPath: video.videoPath
        });
    });

    // 按时间排序
    return events.sort((a, b) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
    );
});

// 格式化时间的辅助函数
const formatTime = (time: string) => {
    return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

// 获取事件的显示信息
const getEventInfo = (event: TimelineEvent) => {
    // const filename = event.videoPath.split('/').pop() || event.videoPath;
    const filename = event.videoPath

    const type = event.type === 'start' ? 'success' : 'info';
    const title = event.type === 'start' ? '开始录制' : '结束录制';

    return {
        type,
        title,
        content: `文件: ${filename}`,
        time: formatTime(event.time)
    };
};
</script>