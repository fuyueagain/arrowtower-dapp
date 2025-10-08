# SVG地图交互化完整流程文档

## 🎯 项目概述

为SVG地图添加可点击的文字链接，实现交互式地图功能。

## 📁 文件结构

```
project/
├── ref.svg                 # 原始SVG地图文件
├── map.html               # 交互式HTML文件
└── README.md              # 本文档
```

## 🛠️ 完整操作流程

### 阶段1：准备SVG文件

1. **在Inkscape中添加链接属性**

   - 打开SVG文件
   - 选择文字对象 → 编辑 → XML编辑器 (Shift + Ctrl + X)
   - 添加属性：
     - 名称：`ref` 或 `ref2`
     - 值：完整URL（如 `https://www.example.com`）
   - 保存为 Plain SVG 格式

2. **验证链接属性**

   ```bash
   # 检查链接属性设置
   echo "=== ref 元素的完整信息 ==="
   grep -A5 -B5 'ref="https://' ref.svg | head -20
   
   echo -e "\n=== ref2 元素的完整信息 ==="
   grep -A5 -B5 'ref2="https://' ref.svg | head -20
   
   echo -e "\n=== 元素标签和结构 ==="
   grep -E 'ref="https://|ref2="https://' ref.svg
   
   echo -e "\n=== 链接地址 ==="
   grep -o 'ref="https://[^"]*"' ref.svg
   grep -o 'ref2="https://[^"]*"' ref.svg
   ```

### 阶段2：创建交互式HTML

创建 `map.html` 文件：

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <title>交互式SVG地图</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px;
            background: #f5f5f5;
            font-family: Arial, sans-serif;
        }
        .container {
            max-width: 1600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .clickable-text {
            cursor: pointer;
        }
        .clickable-text:hover {
            opacity: 0.7;
            fill: #0066cc !important;
            text-decoration: underline;
        }
        h1 {
            text-align: center;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>交互式SVG地图</h1>
        <p style="text-align: center; color: #666;">点击文字访问相关链接</p>
        
        <!-- 直接引用SVG文件 -->
        <object id="svgMap" data="ref.svg" type="image/svg+xml" width="100%" height="600px"></object>
    </div>

    <script>
        document.getElementById('svgMap').addEventListener('load', function() {
            try {
                const svgDoc = this.contentDocument;
                
                // 处理 ref 元素 (text1)
                const refElement = svgDoc.getElementById('text1');
                if (refElement) {
                    refElement.classList.add('clickable-text');
                    refElement.addEventListener('click', function() {
                        window.open('https://www.google.com/', '_blank');
                    });
                }
                
                // 处理 ref2 元素 (text1-5)
                const ref2Element = svgDoc.getElementById('text1-5');
                if (ref2Element) {
                    ref2Element.classList.add('clickable-text');
                    ref2Element.addEventListener('click', function() {
                        window.open('https://www.youtube.com/', '_blank');
                    });
                }
                
                console.log('交互功能已启用: 幺妹灯工作室 → Google, 漆悦轩 → YouTube');
                
            } catch (error) {
                // 如果由于CORS无法访问，提供备用方案
                console.log('由于浏览器安全限制，请使用HTTP服务器运行此文件');
                alert('点击功能需要HTTP服务器环境。当前链接：\n幺妹灯工作室 → https://www.google.com/\n漆悦轩 → https://www.youtube.com/');
            }
        });
    </script>
</body>
</html>
```

### 阶段3：测试和运行

1. **启动本地服务器**

   ```bash
   python3 -m http.server 8000
   ```

2. **访问应用**

   - 浏览器打开：`http://localhost:8000/map.html`

3. **功能验证**

   - 点击地图上的文字元素
   - 验证是否在新标签页打开正确链接

```

