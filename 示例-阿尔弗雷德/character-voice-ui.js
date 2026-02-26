class CharacterVoiceUI {
    constructor(options = {}) {
        // 可配置的选项
        this.currentAwaken = options.defaultState || 'pre';
        this.currentAudio = null;
        this.isZoomed = false;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentTranslateX = 0;
        this.currentTranslateY = 0;
        this.currentScale = 1;
        this.currentExpressionIndex = 0;
        
        // 定时器
        this.blinkTimeout = null;
        
        // 图像相关
        this.bodyImg = new Image();
        this.headImg = new Image();
        this.loadedImages = 0;
        
        // DOM元素
        this.zoomBtn = document.getElementById('zoomBtn');
        this.canvas = document.getElementById('characterArt');
        this.ctx = this.canvas.getContext('2d');
        
        // 绑定事件
        this.bindEvents();
        
    }
    
    // 设置配置数据
    setConfig(config) {
        this.voiceData = config.voiceData;
        this.audioMap = config.audioMap;
        this.voiceLabels = config.voiceLabels;
        // 使用标准化函数处理数据
        this.bodyFrames = this.normalizeBodyFrames(config.bodyFrames);
        this.headOffsets = this.normalizeHeadOffsets(config.headOffsets);
        this.headFrames = this.normalizeHeadFrames(config.headFrames);
        this.blinkMap = config.blinkMap;
        this.voiceToExpressionMap = config.voiceToExpressionMap;
        this.DEFAULT_EXPRESSIONS = config.DEFAULT_EXPRESSIONS;
        this.imageMap = config.imageMap;
        this.currentExpression = this.DEFAULT_EXPRESSIONS[this.currentAwaken];
    }
    
    // 标准化bodyFrames数据格式
    normalizeBodyFrames(bodyFrames) {
        if (!bodyFrames) return bodyFrames;
        
        const normalized = {};
        for (const state in bodyFrames) {
            normalized[state] = {};
            const frame = bodyFrames[state];
            
            // 处理spriteOffset
            if (frame.spriteOffset) {
                if (typeof frame.spriteOffset === 'string' && frame.spriteOffset.startsWith('{')) {
                    // 字符串格式 "{0,250}"
                    const parsed = this.parseCoordinateString(frame.spriteOffset);
                    if (parsed) {
                        normalized[state].spriteOffset = parsed;
                    }
                } else if (Array.isArray(frame.spriteOffset)) {
                    // 数组格式 [0, 250]
                    normalized[state].spriteOffset = {
                        x: frame.spriteOffset[0] || 0,
                        y: frame.spriteOffset[1] || 0
                    };
                } else if (typeof frame.spriteOffset.x !== 'undefined' && typeof frame.spriteOffset.y !== 'undefined') {
                    // 原始格式 {x: 0, y: 250}
                    normalized[state].spriteOffset = frame.spriteOffset;
                } else {
                    // 新格式 {0, 250} (实际上是非法语法，但尝试处理)
                    const values = Object.values(frame.spriteOffset);
                    normalized[state].spriteOffset = {
                        x: values[0] || 0,
                        y: values[1] || 0
                    };
                }
            }
            
            // 处理spriteSize
            if (frame.spriteSize) {
                if (typeof frame.spriteSize === 'string' && frame.spriteSize.startsWith('{')) {
                    // 字符串格式 "{1202,2376}"
                    const parsed = this.parseSizeString(frame.spriteSize);
                    if (parsed) {
                        normalized[state].spriteSize = parsed;
                    }
                } else if (Array.isArray(frame.spriteSize)) {
                    // 数组格式 [1202, 2376]
                    normalized[state].spriteSize = {
                        w: frame.spriteSize[0] || 0,
                        h: frame.spriteSize[1] || 0
                    };
                } else if (typeof frame.spriteSize.w !== 'undefined' && typeof frame.spriteSize.h !== 'undefined') {
                    // 原始格式 {w: 1202, h: 2376}
                    normalized[state].spriteSize = frame.spriteSize;
                } else {
                    // 新格式 {1202, 2376} (实际上是非法语法，但尝试处理)
                    const values = Object.values(frame.spriteSize);
                    normalized[state].spriteSize = {
                        w: values[0] || 0,
                        h: values[1] || 0
                    };
                }
            }
            
            // 处理textureRect
            if (frame.textureRect) {
                if (typeof frame.textureRect === 'string' && frame.textureRect.startsWith('{')) {
                    // 字符串格式 "{{1,1},{1202,2376}}" 或 "{1,1},{1202,2376}"
                    let parsed = this.parseDoubleRectString(frame.textureRect);
                    if (!parsed) {
                        parsed = this.parseRectString(frame.textureRect);
                    }
                    if (parsed) {
                        normalized[state].textureRect = parsed;
                    }
                } else if (Array.isArray(frame.textureRect) && frame.textureRect.length >= 2) {
                    // 数组格式 [[1,1],[1202,2376]]
                    const pos = frame.textureRect[0];
                    const size = frame.textureRect[1];
                    
                    normalized[state].textureRect = {
                        x: pos[0] || 0,
                        y: pos[1] || 0,
                        w: size[0] || 0,
                        h: size[1] || 0
                    };
                } else if (typeof frame.textureRect.x !== 'undefined') {
                    // 原始格式 {x: 1, y: 1, w: 1202, h: 2376}
                    normalized[state].textureRect = frame.textureRect;
                } else if (frame.textureRect.tr) {
                    // plist格式 {tr: {x: 1, y: 1, w: 1202, h: 2376}}
                    normalized[state].textureRect = frame.textureRect.tr;
                } else {
                    // 新格式 {{1,1},{1202,2376}} (实际上是非法语法，但尝试处理)
                    // 这里假设是对象形式，我们需要提取坐标和尺寸
                    const rectValues = Object.values(frame.textureRect);
                    if (rectValues.length >= 2) {
                        const pos = rectValues[0]; // {1,1}
                        const size = rectValues[1]; // {1202,2376}
                        
                        const posValues = Object.values(pos);
                        const sizeValues = Object.values(size);
                        
                        normalized[state].textureRect = {
                            x: posValues[0] || 0,
                            y: posValues[1] || 0,
                            w: sizeValues[0] || 0,
                            h: sizeValues[1] || 0
                        };
                    }
                }
            }
        }
        return normalized;
    }
    
    // 标准化headOffsets数据格式
    normalizeHeadOffsets(headOffsets) {
        if (!headOffsets) return headOffsets;
        
        const normalized = {};
        for (const state in headOffsets) {
            const offset = headOffsets[state];
            if (typeof offset === 'string' && offset.startsWith('{')) {
                // 字符串格式 "{25,778}"
                const parsed = this.parseCoordinateString(offset);
                if (parsed) {
                    normalized[state] = parsed;
                }
            } else if (Array.isArray(offset)) {
                // 数组格式 [25, 778]
                normalized[state] = {
                    x: offset[0] || 0,
                    y: offset[1] || 0
                };
            } else if (typeof offset.x !== 'undefined' && typeof offset.y !== 'undefined') {
                // 原始格式 {x: 25, y: 778}
                normalized[state] = offset;
            } else {
                // 新格式 {25, 778} (实际上是非法语法，但尝试处理)
                const values = Object.values(offset);
                normalized[state] = {
                    x: values[0] || 0,
                    y: values[1] || 0
                };
            }
        }
        return normalized;
    }
    
    // 标准化headFrames数据格式
    normalizeHeadFrames(headFrames) {
        if (!headFrames) return headFrames;
        
        const normalized = {};
        for (const state in headFrames) {
            normalized[state] = {};
            const frames = headFrames[state];
            
            for (const face in frames) {
                const frame = frames[face];
                if (typeof frame === 'string') {
                    // 字符串格式 "x,y,w,h" 或 "{x,y},{w,h}"
                    if (frame.includes('{')) {
                        // 新格式 "{x,y},{w,h}"
                        const parsed = this.parseRectString(frame);
                        if (parsed) {
                            normalized[state][face] = { tr: parsed };
                        }
                    } else {
                        // 旧格式 "x,y,w,h"
                        const coords = frame.split(',').map(Number);
                        if (coords.length === 4) {
                            normalized[state][face] = {
                                tr: {
                                    x: coords[0] || 0,
                                    y: coords[1] || 0,
                                    w: coords[2] || 0,
                                    h: coords[3] || 0
                                }
                            };
                        }
                    }
                } else if (Array.isArray(frame)) {
                    // 数组格式 [x, y, w, h]
                    if (frame.length === 4) {
                        normalized[state][face] = {
                            tr: {
                                x: frame[0] || 0,
                                y: frame[1] || 0,
                                w: frame[2] || 0,
                                h: frame[3] || 0
                            }
                        };
                    }
                } else if (frame.tr) {
                    // 已经是标准格式 {tr: {x, y, w, h}}
                    normalized[state][face] = frame;
                } else {
                    // 其他格式保持原样
                    normalized[state][face] = frame;
                }
            }
        }
        return normalized;
    }
    
    // 解析坐标字符串格式 "{x,y}"
    parseCoordinateString(str) {
        if (!str || typeof str !== 'string') return null;
        
        // 匹配 {数值1,数值2} 格式
        const match = str.match(/^\{([^,]+),([^}]+)\}$/);
        if (match) {
            return {
                x: parseFloat(match[1]) || 0,
                y: parseFloat(match[2]) || 0
            };
        }
        return null;
    }
    
    // 解析尺寸字符串格式 "{w,h}"
    parseSizeString(str) {
        if (!str || typeof str !== 'string') return null;
        
        // 匹配 {数值1,数值2} 格式
        const match = str.match(/^\{([^,]+),([^}]+)\}$/);
        if (match) {
            return {
                w: parseFloat(match[1]) || 0,
                h: parseFloat(match[2]) || 0
            };
        }
        return null;
    }
    
    // 解析矩形字符串格式 "{{x,y},{w,h}}"
    parseDoubleRectString(str) {
        if (!str || typeof str !== 'string') return null;
        
        // 匹配 {{x,y},{w,h}} 格式
        const match = str.match(/^\{\{([^,]+),([^}]+)\},\{([^,]+),([^}]+)\}\}$/);
        if (match) {
            return {
                x: parseFloat(match[1]) || 0,
                y: parseFloat(match[2]) || 0,
                w: parseFloat(match[3]) || 0,
                h: parseFloat(match[4]) || 0
            };
        }
        return null;
    }
    
    // 解析矩形字符串格式 "{x,y},{w,h}"
    parseRectString(str) {
        if (!str || typeof str !== 'string') return null;
        
        // 匹配 {x,y},{w,h} 格式
        const match = str.match(/^\{([^,]+),([^}]+)\},\{([^,]+),([^}]+)\}$/);
        if (match) {
            return {
                x: parseFloat(match[1]) || 0,
                y: parseFloat(match[2]) || 0,
                w: parseFloat(match[3]) || 0,
                h: parseFloat(match[4]) || 0
            };
        }
        return null;
    }
    
    // 绑定事件
    bindEvents() {
        // 觉醒状态切换按钮
        document.querySelectorAll('.awaken-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentAwaken = btn.dataset.type;
                this.updateUI();
            });
        });
        
        // 缩放按钮
        if (this.zoomBtn) {
            this.zoomBtn.addEventListener('click', () => this.toggleZoom());
        }
        
        // 拖拽事件
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        }
        
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
        document.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // 上下表情切换按钮
        document.addEventListener('DOMContentLoaded', () => {
            const prevExpressionBtn = document.getElementById('prevExpressionBtn');
            const nextExpressionBtn = document.getElementById('nextExpressionBtn');
            
            if (prevExpressionBtn) {
                prevExpressionBtn.addEventListener('click', () => {
                    this.switchToPrevExpression();
                });
            }
            
            if (nextExpressionBtn) {
                nextExpressionBtn.addEventListener('click', () => {
                    this.switchToNextExpression();
                });
            }
        });
    }
    
    // 加载角色图像
    loadCharacterImages() {
        const activeBtn = document.querySelector('.awaken-btn.on');
        const state = activeBtn ? activeBtn.dataset.type : 'pre';
        
        const images = this.imageMap[state] || this.imageMap.pre;
        this.bodyImg.src = images.body;
        this.headImg.src = images.head;
        
        this.bodyImg.onload = () => {
            this.loadedImages++;
            if (this.loadedImages === 2) {
                this.drawCharacter();
            }
        };
        
        this.headImg.onload = () => {
            this.loadedImages++;
            if (this.loadedImages === 2) {
                this.drawCharacter();
            }
        };
    }
    
    // 更新UI
    updateUI() {
        document.querySelectorAll('.awaken-btn').forEach(btn => {
            btn.classList.toggle('on', btn.dataset.type === this.currentAwaken);
            btn.classList.toggle('off', btn.dataset.type !== this.currentAwaken);
        });
        
        this.resetZoom();
        this.loadCharacterImages();
        this.loadedImages = 0;
        
        // 当切换状态时，更新当前表情为该状态的默认表情
        this.currentExpression = this.DEFAULT_EXPRESSIONS[this.currentAwaken];
        
        // 重置表情切换历史
        this._expressionSwitchHistory = null;
        
        // 初始化表情索引（现在headFrames已经定义了）
        this.initializeExpressionIndex();
        
        const listContainer = document.getElementById('voiceList');
        if (listContainer && this.audioMap && this.voiceLabels) {
            listContainer.innerHTML = this.audioMap[this.currentAwaken].map((audioPath, index) => `
                <div class="voice-item" onclick="characterVoiceUI.playAudioAndExpression(${index})">
                    ${this.voiceLabels[this.currentAwaken][index] || '未命名'} - ${this.currentAwaken === 'sun' ? '日觉' : this.currentAwaken === 'moon' ? '月觉' : this.currentAwaken === 'pre' ? '觉醒前' : '星觉'}<br>
                    <span>${this.voiceData[this.currentAwaken] && this.voiceData[this.currentAwaken][index] ? this.voiceData[this.currentAwaken][index] : ''}</span>
                </div>
            `).join('');
        }
        
        // 启动眨眼功能
        clearTimeout(this.blinkTimeout);
        this.startBlinking();
    }
    
    // 播放音频和表情
    playAudioAndExpression(index) {
        // 使用映射关系获取对应的表情
        const expressionMap = this.voiceToExpressionMap[this.currentAwaken];
        let selectedExpression = null;
        
        // 如果有为该索引定义的映射关系，则使用映射的表情
        if (expressionMap && expressionMap[index]) {
            selectedExpression = expressionMap[index];
        } else {
            // 如果没有定义映射关系，则使用默认表情而不是模运算方式
            selectedExpression = this.DEFAULT_EXPRESSIONS[this.currentAwaken];
        }
        
        this.currentExpression = selectedExpression;
        
        // 同步更新currentExpressionIndex
        const expressions = Object.keys(this.headFrames[this.currentAwaken]).filter(key => !key.includes('blink'));
        this.currentExpressionIndex = expressions.indexOf(selectedExpression);
        if (this.currentExpressionIndex === -1) {
            this.currentExpressionIndex = 0;
        }
        
        this.drawCharacter();
        // 重置眨眼功能
        clearTimeout(this.blinkTimeout);
        this.startBlinking();
        this.playAudio(index);
    }
    
    // 播放音频
    playAudio(index) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        const audioPath = this.audioMap[this.currentAwaken][index];
        if (audioPath) {
            try {
                this.currentAudio = new Audio(audioPath);
                this.currentAudio.play().catch(error => {
                    console.error("播放失败:", error);
                    alert("无法播放音频文件: " + audioPath);
                });
            } catch (e) {
                console.error("音频加载错误:", e);
                alert("无法播放音频文件: " + audioPath);
            }
        } else {
            alert("没有可用的音频文件");
        }
    }
    
    // 绘制角色
    drawCharacter() {
        if (this.loadedImages < 2) return;
        
        // 在控制台显示当前表情名称（临时调试功能）
        console.log('当前显示的表情:', this.currentExpression);
        
        // 获取当前角色立绘的帧信息
        const b = this.bodyFrames[this.currentAwaken];
        const bodyFrame = b.spriteSize;
        
        // 计算缩放比例，使立绘高度等于canvas高度
        const scaleRatio = this.canvas.height / bodyFrame.h;
        
        // 计算缩放后的身体宽度
        const scaledBodyWidth = bodyFrame.w * scaleRatio;
        
        // 设置canvas宽度与缩放后的身体宽度一致
        this.canvas.width = scaledBodyWidth;
        
        // 设置高质量渲染参数
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 计算身体部分绘制位置（居中）
        const scaledBodyHeight = bodyFrame.h * scaleRatio;
        const bodyX = (this.canvas.width - scaledBodyWidth) / 2;
        const bodyY = (this.canvas.height - scaledBodyHeight) / 2;
        
        // 绘制身体部分
        this.ctx.drawImage(
            this.bodyImg,
            b.textureRect.x,
            b.textureRect.y,
            b.textureRect.w,
            b.textureRect.h,
            bodyX,
            bodyY,
            scaledBodyWidth,
            scaledBodyHeight
        );
        
        // 绘制头部部分
        const h = this.headFrames[this.currentAwaken][this.currentExpression];
        if (h) {
            // 获取当前状态的默认偏移量
            const defaultOffset = this.headOffsets[this.currentAwaken];
            
            // 动态获取spriteSourceSize，替代之前的固定值
            const spriteSourceSize = this.bodyFrames[this.currentAwaken].spriteSize;
            
            // 计算身体图片相对于spriteSourceSize的左上角坐标
            // spriteOffset表示中心点偏移，需要转换为左上角的坐标
            const bodyCenterX = spriteSourceSize.w / 2 + b.spriteOffset.x;
            const bodyCenterY = spriteSourceSize.h / 2 + b.spriteOffset.y;
            const bodyLeft = bodyCenterX - bodyFrame.w / 2;
            const bodyTop = bodyCenterY - bodyFrame.h / 2;
            
            // 计算头部图片相对于spriteSourceSize的左上角坐标
            const headCenterX = spriteSourceSize.w / 2 + defaultOffset.x;
            const headCenterY = spriteSourceSize.h / 2 - defaultOffset.y; // 注意：Y轴方向相反
            const headLeft = headCenterX - h.tr.w / 2;
            const headTop = headCenterY - h.tr.h / 2;
            
            // 计算头部相对于身体的偏移量
            const offsetX = (headLeft - bodyLeft) * scaleRatio;
            const offsetY = (headTop - bodyTop) * scaleRatio;
            
            // 计算头部在画布上的实际位置（以身体左上角为原点）
            const headX = bodyX + offsetX;
            const headY = bodyY + offsetY;
            
            // 绘制头部
            this.ctx.drawImage(
                this.headImg,
                h.tr.x,
                h.tr.y,
                h.tr.w,
                h.tr.h,
                headX,
                headY,
                h.tr.w * scaleRatio,
                h.tr.h * scaleRatio
            );
        }
    }
    
    // 眨眼控制函数
    startBlinking() {
        // 如果没有blink映射则不执行
        if (!this.blinkMap[this.currentAwaken] || !this.blinkMap[this.currentAwaken][this.currentExpression]) return;
        
        // 随机间隔时间后眨眼(2-8秒)
        const blinkDelay = 2000 + Math.random() * 6000;
        this.blinkTimeout = setTimeout(() => {
            this.blink();
        }, blinkDelay);
    }
    
    // 眨眼动画
    blink() {
        // 获取当前表情对应的眨眼表情
        const blinkExpression = this.blinkMap[this.currentAwaken][this.currentExpression];
        if (!blinkExpression) return;
        
        // 保存原始表情
        const originalExpression = this.currentExpression;
        
        // 切换到眨眼表情
        this.currentExpression = blinkExpression;
        this.drawCharacter();
        
        // 200ms后切换回原始表情
        setTimeout(() => {
            this.currentExpression = originalExpression;
            this.drawCharacter();
            
            // 重新开始眨眼循环
            this.startBlinking();
        }, 200);
    }
    
    // 切换缩放
    toggleZoom() {
        if (this.isZoomed) {
            this.resetZoom(true);
        } else {
            this.zoomIn();
        }
    }
    
    // 放大
    zoomIn() {
        this.currentScale = 3;
        this.resetZoom();
        this.isZoomed = true;
        if (this.zoomBtn) {
            this.zoomBtn.style.backgroundImage = "url('../picture/放大.png')";
        }
        if (this.canvas) {
            this.canvas.style.cursor = 'grab';
        }
    }
    
    // 重置缩放
    resetZoom(resetScale = false) {
        this.currentTranslateX = 0;
        this.currentTranslateY = 0;
        if (resetScale) {
            this.currentScale = 1;
            this.isZoomed = false;
            if (this.zoomBtn) {
                this.zoomBtn.style.backgroundImage = "url('../picture/放大.png')";
            }
            if (this.canvas) {
                this.canvas.style.cursor = 'default';
            }
        }
        this.updateCanvasTransform();
    }
    
    // 更新画布变换
    updateCanvasTransform() {
        if (this.canvas) {
            this.canvas.style.transform = `scale(${this.currentScale}) translate(${this.currentTranslateX}px, ${this.currentTranslateY}px)`;
        }
    }
    
    // 鼠标按下处理
    handleMouseDown(e) {
        if (!this.isZoomed) return;
        this.isDragging = true;
        this.startX = e.clientX - this.currentTranslateX;
        this.startY = e.clientY - this.currentTranslateY;
        if (this.canvas) {
            this.canvas.style.cursor = 'grabbing';
        }
        e.preventDefault();
    }
    
    // 鼠标移动处理
    handleMouseMove(e) {
        if (!this.isDragging || !this.isZoomed) return;
        this.currentTranslateX = e.clientX - this.startX;
        this.currentTranslateY = e.clientY - this.startY;
        const maxX = (this.canvas.offsetWidth * this.currentScale - this.canvas.offsetWidth) / 2;
        const maxY = (this.canvas.offsetHeight * this.currentScale - this.canvas.offsetHeight) / 2;
        this.currentTranslateX = Math.min(Math.max(this.currentTranslateX, -maxX), maxX);
        this.currentTranslateY = Math.min(Math.max(this.currentTranslateY, -maxY), maxY);
        this.updateCanvasTransform();
    }
    
    // 鼠标释放处理
    handleMouseUp() {
        this.isDragging = false;
        if (this.canvas) {
            this.canvas.style.cursor = this.isZoomed ? 'grab' : 'default';
        }
    }
    
    // 初始化表情索引
    initializeExpressionIndex() {
        // 确保headFrames已经定义
        if (!this.headFrames || !this.headFrames[this.currentAwaken]) return;
        
        const expressions = Object.keys(this.headFrames[this.currentAwaken]).filter(key => !key.includes('blink'));
        // 根据当前表情设置正确的索引
        this.currentExpressionIndex = expressions.indexOf(this.currentExpression);
        if (this.currentExpressionIndex === -1) {
            this.currentExpressionIndex = 0; // 如果找不到，默认为第一个
        }
    }
    
    // 切换到上一个表情（智能循环逻辑）
    switchToPrevExpression() {
        // 确保headFrames已经定义
        if (!this.headFrames || !this.headFrames[this.currentAwaken]) return;
        
        // 获取当前状态下所有可用的表情（排除blink表情）
        const expressions = Object.keys(this.headFrames[this.currentAwaken]).filter(key => !key.includes('blink'));
        
        // 获取第一个表情（目标起始表情）
        const firstExpression = expressions[0];
        // 获取最后一个表情
        const lastExpression = expressions[expressions.length - 1];
        
        let targetExpression;
        
        // 智能循环逻辑：
        // 首次操作时的行为
        if (!this._expressionSwitchHistory || !this._expressionSwitchHistory.enteredCycle) {
            // 第一次点击上一个按钮
            if (this.currentExpression === firstExpression) {
                // 当前是第一个表情，上一个应该是最后一个
                targetExpression = lastExpression;
            } else {
                // 当前不是第一个表情，上一个应该是最后一个（强制跳转）
                targetExpression = lastExpression;
            }
            // 标记已进入循环模式
            if (!this._expressionSwitchHistory) {
                this._expressionSwitchHistory = { enteredCycle: true };
            } else {
                this._expressionSwitchHistory.enteredCycle = true;
            }
        } else {
            // 已经进入循环模式，正常处理
            const currentIndex = expressions.indexOf(this.currentExpression);
            let prevIndex = currentIndex - 1;
            if (prevIndex < 0) {
                prevIndex = expressions.length - 1; // 循环到末尾
            }
            targetExpression = expressions[prevIndex];
        }
        
        // 更新当前表情和索引
        this.currentExpression = targetExpression;
        this.currentExpressionIndex = expressions.indexOf(targetExpression);
        
        // 输出调试信息
        console.log(`切换到上一个表情: ${targetExpression}, 索引: ${this.currentExpressionIndex}`);
        
        // 重绘角色
        this.drawCharacter();
        
        // 重置眨眼功能
        clearTimeout(this.blinkTimeout);
        this.startBlinking();
    }
    
    // 切换到下一个表情（智能循环逻辑）
    switchToNextExpression() {
        // 确保headFrames已经定义
        if (!this.headFrames || !this.headFrames[this.currentAwaken]) return;
        
        // 获取当前状态下所有可用的表情（排除blink表情）
        const expressions = Object.keys(this.headFrames[this.currentAwaken]).filter(key => !key.includes('blink'));
        
        // 获取第一个表情（目标起始表情）
        const firstExpression = expressions[0];
        
        let targetExpression;
        
        // 智能循环逻辑：
        // 首次操作时的行为
        if (!this._expressionSwitchHistory || !this._expressionSwitchHistory.enteredCycle) {
            // 第一次点击下一个按钮
            if (this.currentExpression === firstExpression) {
                // 当前已经是第一个表情，下一个应该是第二个
                targetExpression = expressions.length > 1 ? expressions[1] : firstExpression;
            } else {
                // 当前不是第一个表情，下一个应该是第一个
                targetExpression = firstExpression;
            }
            // 标记已进入循环模式
            if (!this._expressionSwitchHistory) {
                this._expressionSwitchHistory = { enteredCycle: true };
            } else {
                this._expressionSwitchHistory.enteredCycle = true;
            }
        } else {
            // 已经进入循环模式，正常处理
            const currentIndex = expressions.indexOf(this.currentExpression);
            let nextIndex = currentIndex + 1;
            if (nextIndex >= expressions.length) {
                nextIndex = 0; // 循环到开头
            }
            targetExpression = expressions[nextIndex];
        }
        
        // 更新当前表情和索引
        this.currentExpression = targetExpression;
        this.currentExpressionIndex = expressions.indexOf(targetExpression);
        
        // 输出调试信息
        console.log(`切换到下一个表情: ${targetExpression}, 索引: ${this.currentExpressionIndex}`);
        
        // 重绘角色
        this.drawCharacter();
        
        // 重置眨眼功能
        clearTimeout(this.blinkTimeout);
        this.startBlinking();
    }
    
    // 更新表情（保留原有方法用于兼容性）
    updateExpression() {
        this.switchToNextExpression();
    }
    
    // 初始化
    init() {
        this.updateUI();
    }
}

// 创建全局实例并暴露到window对象
window.characterVoiceUI = new CharacterVoiceUI();