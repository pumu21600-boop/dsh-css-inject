# dsh-css-inject

DSH 界面美化插件：在设置面板里粘贴自定义 CSS，保存后立即应用到整个界面（无需刷新）。附带自定义背景、悬停 CSS 检查器、下拉框美化三个小工具。

## 功能

- **自定义 CSS**：设置 → 「自定义 CSS」，带撤销/重做工具栏与右下角清除按钮；CSS 由宿主持久化（settings.yaml 的 `css-inject` 命名空间），启动时自动恢复
- **自定义背景**：上传图片或视频作为页面背景，1–100 不透明度滑块；媒体文件存在宿主侧 `$DSH_HOME/storages/dsh-css-inject/`，经同源端点 `/dsh-css-inject/bg` 取回
- **悬停 CSS 检查器**：开关打开后，悬停任意元素即显示其选择器、计算样式、命中的 CSS 规则与内联样式，附「复制选择器 / 复制 CSS / 复制规则」按钮；点击元素固定面板，Esc 取消固定
- **下拉框美化**：替换原生 `<select>` 的系统白色弹层为主题化自定义弹层，弹层背景由 `--dsh-select-popup-bg` 控制（设为 `transparent` 即透明）

> 所有配置都由宿主持久化，**不使用 localStorage / IndexedDB**——浏览器存储绑定页面 origin，换端口或换访问地址就会丢；宿主侧持久化不受影响。

## 安装

1. 将源码目录 junction 到 `~/.dsh/profiles/web/node_modules/dsh-css-inject`
2. 在 `~/.dsh/profiles/web/cordis.patch.yml` 追加：

   ```yaml
   - insert:
       - id: dsh-css-inject
         name: 'dsh-css-inject'
   ```

3. 重启后端 + 刷新页面

## 许可证

MIT
