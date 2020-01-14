# 计算机图形学

## 环境搭建

### 本地模式
- Edge：直接运行
- Chrome：`chrome --allow-file-access-from-files`

### 服务器模式
- Python2：`python -m SimpleHTTPServer`
- Python3：`python -m http.server`

## My Platform
> 本程序仅为展示各种变换及渲染效果，物体可移动旋转删除，是为创造模式。娱乐模式参见OnlyMyCube，物体基本锁定，不可随意移动。

![效果图](https://raw.githubusercontent.com/zhengbili/zhengbili.github.io/master/programs/ComputerGraphics/mp.png)

### 键盘控制
* V/Y/T/B/F/H：物体移动（前后上下左右）
* W/S/A/D：光源移动（上下左右）
* I/K/J/L：相机移动（前后左右）
* P：改变视角模式
* Q：改变光照模式
* Del：删除物体
* 空格：开始/暂停渲染

### 鼠标控制
* 物体选定：出现选取标志
	* 左键拖动：移动物体
	* 滚轮滚动：改变大小
	* 右键拖动：旋转物体
	* 双击：加锁（锁定地面）/解锁
* 默认选定：相机
	* 左键拖动：相机平移
	* 滚轮滚动：调节远近
	* 右键拖动：相机旋转
	* 双击：开始/停止自动旋转

### 渲染模式
* 宝贝球：纯色
* 老虎：带明暗
* 萝莉：带纹理
* 手机：明暗+纹理
* 新科娘（不建议加载）：明暗+纹理

### 在线演示

[点击进入](https://zhengbili.github.io/programs/ComputerGraphics/MyPlatform/MyPlatform.html)

[源代码](https://github.com/zhengbili/zhengbili.github.io/blob/master/programs/ComputerGraphics/MyPlatform/)

## Only My Cube

![效果图](https://raw.githubusercontent.com/zhengbili/zhengbili.github.io/master/programs/ComputerGraphics/omc.png)

### 键盘控制
* 空格：开始/暂停
* B：控制转向
* P：转换视角模式 正交/透视（不建议使用）
* F5：刷新重新游戏
* Z：增加游戏难度
* X：减小游戏难度
* Delete：删除选中物体（把碰撞检测方块删了就是无敌模式）
* 自动模式：按A键进入
* 空格：开始/暂停
* P：转换视角模式 正交/透视
* 左键单击：选择物体
* Delete：删除选中物体（不建议使用）

### 鼠标控制
* 左键（触屏）单击：选择物体/开始/转向

### 在线演示

[点击进入](https://zhengbili.github.io/programs/ComputerGraphics/OnlyMyCube/OnlyMyCube.html)

[源代码](https://github.com/zhengbili/zhengbili.github.io/blob/master/programs/ComputerGraphics/OnlyMyCube/)