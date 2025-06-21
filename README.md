![image](![image](https://github.com/user-attachments/assets/1543f1e3-2c90-41b7-8ded-9b56add5631f)
)

# open-phiedit

非常简洁的开源制谱器。

正在测试中，bug 很多。欢迎其它人 fork 此仓库。

随缘更新。

## 操作说明

### 一、音符

单击 Q 放置 Tap，单击 W 放置 Drag，单击 E 放置 Flick

单击 R 选择 Hold 头部位置，再次单击 R，选择 Hold 尾部位置

### 二、事件

注：如果右侧没有事件轨道，需要点击上方控制栏 -> 编辑 -> 打开/关闭事件

放置方式和 Hold 的放置方式一样

### 三、播放

空格键开始播放，再次按下空格键停止播放

## update

**v5.0**：复制粘贴操作；简易的右键菜单；优化；

**v4.0**：尝试对混合 bpm 提供支持，尝试对大文本读取提供支持，优化渲染，以及一些 rpe 特性

**v3.1**：[微调] 修复按下大写字母无法放置的问题；预处理音符的距离，提供播放谱面的速度。

**v3.0**：播放谱面，优化触摸放置功能

**v2.0**: 触摸放置（测试），note 拖动，还有一些细节

## 代码说明

1. 坐标系说明

渲染时以 canvas 坐标系为主，1600*900，其中 0,0 点为左上角，x 轴向右，y 轴向下

音符处理时以 rpe 坐标系为主，1350*900，其中 0,0 点为中心，x 轴向右，y 轴向上

2. 时间说明

主要有三种类型的时间：

1. 浮点型的秒数
2. 带分数型的节拍数（由一个长度为3的Array构成）
3. 浮点型的节拍数

2与3本质是相同的，2可以避免浮点数误差，3使用更方便。

math.js 中提供了 sec_to_beat（1 --> 2），beat_to_sec（2或3 --> 1）对以上三种类型实现了转换。

## 支持

- [x] "BPMList"
- [ ] "META"
- [ ] "chartTime"
- [ ] "judgeLineGroup"
- [ ] "judgeLineList"
  - [ ] "Group"
  - [x] "Name"
  - [ ] "Texture"
  - [x] "alphaControl"
  - [ ] "anchor"
  - [x] "bpmfactor"
  - [ ] "eventLayers"
    - [ ] "bezier"
    - [ ] "bezierPoints"
    - [x] "easingLeft"
    - [x] "easingRight"
    - [x] "easingType"
    - [x] "end"
    - [x] "endTime"
    - [ ] "linkgroup"
    - [x] "start"
    - [x] "startTime"
  - [ ] "extended"
    - [ ] "inclineEvents"
    - [x] "colorEvents"
    - [x] "textEvents"
    - [x] "scaleXEvents"
    - [x] "scaleYEvents"
    - [x] "paintEvents"
  - [x] "father"
  - [ ] "isCover"
  - [ ] "isGif"
  - [x] "numOfNotes"
  - [x] "posControl"
  - [x] "sizeControl"
  - [ ] "skewControl"
  - [x] "yControl"
  - [ ] "zOrder" : 0
