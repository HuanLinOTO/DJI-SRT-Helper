<script setup lang="ts">
import {
  NButton,
  NSpace,
  NUploadDragger,
  NUpload,
  NText,
  NP,
  UploadFileInfo,
  NDatePicker,
  NH2,
} from "naive-ui"
import { get_index } from "./utils/generate_index"
import { ref, watchEffect } from "vue";
import { ProjectIndex, updateFileListByTimeRange, VideoItem } from "./utils/time_filter";
import VideoTimeLine from "./components/VideoTimeLine.vue";
import { generateProjectXML } from "./utils/to_xml";
const filelist = ref<UploadFileInfo[]>([])

const on_file_change = (options: { file: UploadFileInfo, fileList: Array<UploadFileInfo>, event?: Event }) => {
  filelist.value = options.fileList
}

const date_range = ref<[number, number]>()

const filtered_video_list = ref<VideoItem[]>([])

watchEffect(async () => {
  console.log(date_range.value, filelist.value)
  const allIndexData: ProjectIndex[] = [];
  for (const file of filelist.value) {
    const jsonData = await file.file?.text();
    try {
      const indexData = JSON.parse(jsonData as string) as ProjectIndex;
      allIndexData.push(indexData);
    } catch (error) {
      console.error("Error parsing file:", file.name, error);
    }
  }
  if (date_range.value) {
    const allVideoList: VideoItem[] = [];
    for (const indexData of allIndexData) {
      const video_list = updateFileListByTimeRange(indexData, date_range.value);
      allVideoList.push(...video_list);
    }
    console.log(allVideoList)
    filtered_video_list.value = allVideoList;
  }
})

const to_xml = () => {
  const res = generateProjectXML(filtered_video_list.value, "E:\\视频\\社团素材\\24_11_21_运动会")
  // console.log(res);
  // 下载下来
  const blob = new Blob([res], { type: "text/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "project.xml";
  a.click();
  URL.revokeObjectURL(url);
}

</script>
<template>

  <div class="container">
    <n-space vertical class="inner">
      <div class="title">
        基于 DJI 字幕的视频工程整理工具
      </div>
      <div>
        <n-button type="primary" secondary @click="get_index">获取索引</n-button>
      </div>
      <div>
        <n-upload multiple :max="5" :on-change="on_file_change">
          <n-upload-dragger>
            <n-text style="font-size: 16px">
              点击或者拖动文件到该区域来上传
            </n-text>
            <n-p depth="3" style="margin: 8px 0 0 0">
              请上传从上方获取的索引文件
            </n-p>
          </n-upload-dragger>
        </n-upload>
      </div>
      <div>
        已载入 {{ filelist.length }} 个文件
      </div>
      <n-h2>选择时间范围</n-h2>
      <n-date-picker v-model:value="date_range" type="datetimerange" clearable />
      <n-button @click="to_xml">生成 XML 工程</n-button>
      <VideoTimeLine :videos="filtered_video_list" />
    </n-space>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.inner {
  display: flex;
  align-items: center;

}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}
</style>
