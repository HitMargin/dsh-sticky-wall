# dsh-sticky-wall

DSH 插件：在左侧栏加入「便签墙」入口，打开一个可以随手记便签、按颜色区分的整页面板。

## 功能

- **左侧栏入口**：`sidebar.panellist`（全局面板图标区）新增便签图标，位于「定时任务」与「模型用量」之间；折叠成轨道时显示 Tooltip，展开时显示文字。按钮、焦点、aria 与选中态由 shell 拥有，插件只提供图标与本地化标签。
- **整页面板**：`main` 以同一 id 注册，点击栏位即切换到该页。
- **便签操作**：
  - 「新建便签」建一张空便签，并把焦点放进正文；编辑中按 `Ctrl + Enter`（macOS 为 `⌘ + Enter`）也能新建。
  - 正文边输边存，不需要保存按钮。
  - 五种颜色：琥珀、玫红、薄荷、天蓝、丁香。
  - 删除后底部出现 8 秒「撤销」，可撤回这段时间内删掉的全部便签。
- 界面文案与插件元数据提供中文、英文两套，其它语言回退英文。

## 安装

本仓库是标准 DSH bundle（`dsh.bundle.patch` + `dsh.client`）。把本目录作为 bundle 装进当前 profile：

```
plugin_manager  action=install_bundle  target=<本目录绝对路径>
```

安装后刷新 DSH Web 页面即可看到左侧栏图标。升级 / 卸载：在插件页停用或移除 `Sticky wall`，或对同一 bundle 执行 `remove_bundle`。

## 数据存储

- 便签写在**本机浏览器的 localStorage**（键 `dsh.sticky-wall.v1`），不写入会话日志、不上传、不经过 Host。
- 桌面应用窗口的 origin 固定为 `dsh-app://app`，所以刷新和重启后便签仍在；换浏览器或换机器不会带过去，也没有导出与同步。
- 单条便签最多 2000 字。

## 说明

- 便签只在这台电脑的这个 DSH 里可见；清空应用数据会一起清掉。
- 关闭插件后便签仍留在存储里，但入口与页面不再显示。

## 结构

| 文件 | 作用 |
|---|---|
| `index.js` | Host 半：空实现（页面完全在浏览器侧） |
| `client.js` | Client 半：左侧栏图标 + 中央便签墙（两个 slot 注册、样式、localStorage） |
| `cordis.patch.yml` | bundle 插入 `sticky-wall` 行 |
| `package.json` | bundle 清单与 `dsh.client` 声明 |
| `locale/*.json` | 插件管理页显示用标题 / 描述 |
| `docs/DETAIL*.md`、`docs/preview.svg` | 插件详情页的功能图 |
| `icon.svg` | 插件图标 |

## 许可证

本项目基于 [MIT](LICENSE) 协议开源，Copyright (c) 2026 HitMargin。

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
