# 交互式木船结构展示网页

本项目使用 Three.js 实现了一个可交互的木船结构展示网页，支持用户查看、拆解/组装船体结构，并提供部件信息展示功能。

## 目标

- 使用现代前端技术（HTML, CSS, JavaScript, Three.js）构建。
- 以 3D 模型呈现木船部件。
- 支持用户交互：旋转、缩放、平移模型，点击部件高亮并显示信息。
- 实现部件的拆解与模拟组装功能。
- 响应式设计，适配桌面与移动端设备。

## 技术实现

- **渲染技术**: Three.js (WebGL)
- **模型格式**: 推荐使用 GLTF (.gltf, .glb) 格式。模型应包含船体主要部件，如龙骨、肋骨、甲板、桅杆、船舵、船锚、帆具等。
- **交互功能**:
    - 鼠标/触摸操作：模型旋转、缩放、平移。
    - 点击部件高亮，Tooltip 显示部件名称、功能、历史背景。
    - “拆解模式”：部件按结构顺序动态拆解。
    - （进阶）拖拽部件进行模拟组装。
- **视觉设计**:
    - 模拟实木纹理。
    - 顶部工具栏、侧边部件列表、底部信息栏。
- **响应式适配**: 优化移动端触摸操作和界面布局。

## 项目结构

```
labor_project/
├── models/                # 存放 3D 模型文件 (例如 boat.gltf)
│   └── .placeholder       # 占位符文件
├── index.html             # 网页主入口
├── style.css              # CSS 样式文件
├── script.js              # JavaScript 逻辑文件 (Three.js 场景、交互等)
└── README.md              # 项目说明文件
```

## 如何运行

1.  **准备模型**: 
    *   获取一个木船的 3D 模型，推荐 GLTF 格式。你可以从 Sketchfab、CGTrader 等网站寻找免费或付费模型，或者使用 Blender、Maya 等 3D 建模软件自行创建和导出。
    *   **重要**: 将模型文件（例如 `boat.gltf` 及其相关资源如 `.bin` 和纹理图片）放置在 `models/` 文件夹下。
    *   **修改代码**: 打开 `script.js` 文件，找到 `loadModel` 函数，将其中的 `'models/boat.gltf'` 替换为你实际的模型文件名和路径。
        ```javascript
        // script.js
        // ...
        loadModel('models/your_model_name.gltf'); // <--- 修改这里
        // ...
        ```
2.  **本地服务器**: 由于浏览器安全策略（CORS），直接打开 `index.html` 文件可能无法加载模型或纹理。你需要通过一个本地 HTTP 服务器来运行此项目。
    *   **方法一 (使用 VS Code Live Server)**: 如果你使用 Visual Studio Code，可以安装 "Live Server" 扩展。安装后，右键点击 `index.html` 文件，选择 "Open with Live Server"。
    *   **方法二 (使用 Python)**: 如果你安装了 Python，可以在项目根目录 (`labor_project/`) 打开终端或命令行，然后运行：
        *   Python 3: `python -m http.server`
        *   Python 2: `python -m SimpleHTTPServer`
        默认情况下，服务器会在 `http://localhost:8000` 或 `http://0.0.0.0:8000` 启动。
    *   **方法三 (使用 Node.js http-server)**: 如果你安装了 Node.js 和 npm，可以全局安装 `http-server`：
        ```bash
        npm install -g http-server
        ```
        然后在项目根目录运行：
        ```bash
        http-server
        ```
        服务器通常会在 `http://localhost:8080` 启动。
3.  **打开浏览器**: 在浏览器中访问本地服务器提供的地址 (例如 `http://localhost:8000` 或 `http://localhost:8080`)。

## 模型资源获取与处理

- **模型来源**: 
    - 在线模型库: Sketchfab, TurboSquid, CGTrader 等。
    - 自行创建: 使用 Blender, Maya, 3ds Max 等。
- **格式**: GLTF/GLB 是 Web 端推荐格式，因其高效和 PBR 材质支持。
- **优化**: 
    - **简化面数 (Decimation)**: 使用建模软件减少模型的多边形数量，以提高性能。
    - **纹理优化**: 压缩纹理图片大小，使用合适的格式 (如 JPG, PNG, KTX2)。
    - **LOD (Level of Detail)**: 为不同距离下的模型准备不同细节层次的版本，按需加载。
- **部件命名**: 在 3D 建模软件中，为船体的各个主要部件（如龙骨、肋骨、甲板等）赋予清晰、唯一的名称。这些名称将在 `script.js` 中用于识别和交互。确保 `script.js` 中的 `partData` 对象的键名与模型中部件的名称对应，或者在 `loadModel` 函数中正确映射。

## 关键逻辑说明 (script.js)

- **`init()`**: 初始化 Three.js 场景、相机、渲染器、光照、控制器，并加载模型。
- **`loadModel()`**: 使用 `GLTFLoader` 加载 3D 模型。遍历模型子节点，存储原始材质，并将可交互的网格（部件）存入 `parts` 数组。
- **`populatePartsList()`**: 根据加载的部件动态生成侧边栏的部件列表。
- **`onMouseMove()` / `onClick()`**: 处理鼠标悬停和点击事件，使用 `Raycaster` 检测与部件的交互，实现高亮和信息展示。
- **`highlightPart()` / `highlightPartByName()`**: 高亮指定部件。
- **`updateInfoBar()` / `showTooltip()` / `hideTooltip()`**: 更新底部信息栏和显示/隐藏部件 Tooltip。
- **`toggleDisassemble()`**: 实现部件的拆解和组装动画切换。拆解时，部件沿 Y 轴分散；组装时，恢复到原始位置。使用 `animatePartToPosition` 实现平滑动画。
- **`animatePartToPosition()`**: 使用 `requestAnimationFrame` 实现部件到目标位置的平滑过渡动画。
- **响应式处理**: `onWindowResize` 函数确保场景在窗口大小改变时正确调整。
- **WebGL 兼容性**: 检查浏览器是否支持 WebGL，并在不支持时显示提示信息。

## 待实现/可扩展功能

- **更精确的组装逻辑**: 实现拖拽部件到正确位置的吸附效果和验证。
- **LOD (Level of Detail)**: 根据相机距离加载不同细节的模型。
- **纹理和材质**: 为部件应用更逼真的实木纹理贴图。
- **动画优化**: 使用更专业的动画库 (如 GSAP) 或更精细的 `requestAnimationFrame` 控制。
- **SVG 模式**: 作为备选方案，实现 2D 矢量图形的交互版本。
- **数据加载**: 从外部 JSON 文件加载部件信息，而不是硬编码在 `script.js` 中。

## 贡献

欢迎提出改进建议或贡献代码！