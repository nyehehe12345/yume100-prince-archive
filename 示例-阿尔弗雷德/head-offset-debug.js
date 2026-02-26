// 头部偏移量调试功能 - 整合版
class HeadOffsetDebugger {
    constructor(characterVoiceUI) {
        this.characterVoiceUI = characterVoiceUI;
        this.showAxisLines = true;
        this.showTotalVector = true;
        this.showCoordinates = true;
        
        // 创建控制面板
        this.createControlPanel();
    }
    
    // 创建可视化控制面板
    createControlPanel() {
        console.log('Creating control panel');
        const controlPanel = document.createElement('div');
        controlPanel.id = 'head-offset-controls';
        controlPanel.className = 'head-offset-panel';
        controlPanel.innerHTML = `
            <div class="panel-header">
                <h3>头部偏移调试</h3>
            </div>
            <div class="panel-options">
                <label>
                    <input type="checkbox" id="showAxisLines" checked> 显示轴线(X红/Y蓝)
                </label>
                <label>
                    <input type="checkbox" id="showTotalVector" checked> 显示总向量(绿)
                </label>
                <label>
                    <input type="checkbox" id="showCoordinates" checked> 显示坐标信息
                </label>
                <button id="resetHeadView" class="debug-btn">重置视图</button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(controlPanel);
        console.log('Control panel added to DOM');
        
        // 绑定事件
        this.bindControlEvents();
        
        // 添加CSS样式
        this.addStyles();
    }
    
    // 绑定控制面板事件
    bindControlEvents() {
        document.getElementById('showAxisLines').addEventListener('change', (e) => {
            this.showAxisLines = e.target.checked;
            this.characterVoiceUI.drawCharacter();
        });
        
        document.getElementById('showTotalVector').addEventListener('change', (e) => {
            this.showTotalVector = e.target.checked;
            this.characterVoiceUI.drawCharacter();
        });
        
        document.getElementById('showCoordinates').addEventListener('change', (e) => {
            this.showCoordinates = e.target.checked;
            // 根据勾选状态控制面板显示/隐藏
            if (this.showCoordinates) {
                // 勾选时，触发一次绘制来显示并刷新面板
                this.characterVoiceUI.drawCharacter();
            } else {
                // 取消勾选时，清除面板
                this.clearCoordinateInfo();
            }
        });
        
        document.getElementById('resetHeadView').addEventListener('click', () => {
            this.characterVoiceUI.resetZoom(true);
        });
    }
    
    // 添加必要的CSS样式
    addStyles() {
        if (document.getElementById('head-offset-debug-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'head-offset-debug-styles';
        styles.textContent = `
            .head-offset-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.85);
                color: white;
                padding: 20px;
                border-radius: 12px;
                z-index: 1000;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                min-width: 280px;
                /* 根据项目规范，默认显示控制面板 */
            }
            
            .panel-header h3 {
                margin: 0 0 15px 0;
                color: #4CAF50;
                font-size: 18px;
                text-align: center;
            }
            
            .panel-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .panel-options label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .panel-options input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
            
            .debug-btn {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 8px;
                transition: background 0.3s;
            }
            
            .debug-btn:hover {
                background: #45a049;
            }
            
            .coordinate-info {
                position: fixed;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 14px;
                z-index: 1001;
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                min-width: 250px;
            }
        `;
        document.head.appendChild(styles);
    }
    
    
    // 绘制偏移量可视化
    drawDebugVisualization(ctx, headX, headY, headWidth, headHeight, offsetX, offsetY, scaleRatio) {
        // 直接绘制，不再检查isEnabled
        
        // 保存当前绘图状态
        ctx.save();
        
        // 设置更大的线条宽度和字体（两倍）
        ctx.lineWidth = 4;  // 从2增大到4
        ctx.font = 'bold 24px Arial';  // 从16px增大到24px（1.5倍）
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 计算关键点
        const headCenterX = headX + headWidth / 2;
        const headCenterY = headY + headHeight / 2;
        const endPointX = headCenterX + offsetX;
        const endPointY = headCenterY + offsetY;
        
        console.log('Drawing debug visualization at:', { headCenterX, headCenterY, endPointX, endPointY });
        
        // 绘制坐标系原点标记（更大更清晰）
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(headCenterX, headCenterY, 8, 0, 2 * Math.PI);  // 从5增大到8
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;  // 从2增大到3
        ctx.stroke();
        
        // 绘制X轴偏移量（红色）
        if (this.showAxisLines && offsetX !== 0) {
            console.log('Drawing X axis line');
            ctx.strokeStyle = '#ff3333'; // 鲜艳红色
            ctx.lineWidth = 8;  // 从4增大到8（两倍）
            ctx.beginPath();
            ctx.moveTo(headCenterX, headCenterY);
            ctx.lineTo(endPointX, headCenterY);
            ctx.stroke();
            
            // X轴箭头（更大）
            this.drawArrow(ctx, headCenterX, headCenterY, endPointX, headCenterY, '#ff3333', 32);  // 从16增大到32
            
            // X轴标签（更大字体）
            ctx.fillStyle = '#ff3333';
            ctx.font = 'bold 36px Arial';  // 从24px增大到36px（1.5倍）
            ctx.fillText(`X: ${Math.round(offsetX)}px`, 
                (headCenterX + endPointX) / 2, 
                headCenterY - 50);  // 从30增大到50
        }
        
        // 绘制Y轴偏移量（蓝色）
        if (this.showAxisLines && offsetY !== 0) {
            console.log('Drawing Y axis line');
            ctx.strokeStyle = '#3399ff'; // 鲜艳蓝色
            ctx.lineWidth = 8;  // 从4增大到8（两倍）
            ctx.beginPath();
            ctx.moveTo(endPointX, headCenterY);
            ctx.lineTo(endPointX, endPointY);
            ctx.stroke();
            
            // Y轴箭头（更大）
            this.drawArrow(ctx, endPointX, headCenterY, endPointX, endPointY, '#3399ff', 32);  // 从16增大到32
            
            // Y轴标签（更大字体）
            ctx.fillStyle = '#3399ff';
            ctx.font = 'bold 36px Arial';  // 从24px增大到36px（1.5倍）
            ctx.fillText(`Y: ${Math.round(offsetY)}px`, 
                endPointX + 60,  // 从40增大到60
                (headCenterY + endPointY) / 2);
        }
        
        // 绘制总向量（绿色）
        if (this.showTotalVector && (offsetX !== 0 || offsetY !== 0)) {
            console.log('Drawing total vector');
            ctx.strokeStyle = '#33cc33'; // 鲜艳绿色
            ctx.lineWidth = 8;  // 从4增大到8（两倍）
            ctx.setLineDash([16, 12]);  // 从[8,6]增大到[16,12]
            ctx.beginPath();
            ctx.moveTo(headCenterX, headCenterY);
            ctx.lineTo(endPointX, endPointY);
            ctx.stroke();
            ctx.setLineDash([]); // 重置虚线
            
            // 总向量箭头（更大）
            this.drawArrow(ctx, headCenterX, headCenterY, endPointX, endPointY, '#33cc33', 32);  // 从16增大到32
            
            // 总向量长度标签（更大字体）
            const totalLength = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
            ctx.fillStyle = '#33cc33';
            ctx.font = 'bold 36px Arial';  // 从24px增大到36px（1.5倍）
            ctx.fillText(`总长: ${Math.round(totalLength)}px`, 
                (headCenterX + endPointX) / 2 - 30,  // 从20增大到30
                (headCenterY + endPointY) / 2 - 50);  // 从30增大到50
        }
        
        // 显示坐标信息面板 - 只在勾选时显示
        if (this.showCoordinates) {
            this.showCoordinateInfo(headX, headY, headWidth, headHeight, offsetX, offsetY, scaleRatio);
        } else {
            // 如果未勾选，确保清除可能存在的面板
            this.clearCoordinateInfo();
        }
        
        // 恢复绘图状态
        ctx.restore();
        
        console.log('Debug visualization completed');
    }
    
    // 绘制箭头
    drawArrow(ctx, fromX, fromY, toX, toY, color, headSize = 32) {  // 默认32（两倍）
        const headLength = headSize;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 6;  // 从3增大到6（两倍）
        
        // 绘制箭头头部
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI/6), 
                  toY - headLength * Math.sin(angle - Math.PI/6));
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI/6), 
                  toY - headLength * Math.sin(angle + Math.PI/6));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    // 显示坐标信息面板
    showCoordinateInfo(headX, headY, headWidth, headHeight, offsetX, offsetY, scaleRatio) {
        // 移除已存在的信息面板
        this.clearCoordinateInfo();
        
        // 创建新的信息面板
        const infoPanel = document.createElement('div');
        infoPanel.className = 'coordinate-info';
        infoPanel.id = 'head-coordinate-info';
        
        // 计算显示坐标
        const headCenterX = headX + headWidth / 2;
        const headCenterY = headY + headHeight / 2;
        const canvasRect = this.characterVoiceUI.canvas.getBoundingClientRect();
        
        infoPanel.innerHTML = `
            <div><strong>头部偏移量信息:</strong></div>
            <div style="color:#ff3333">X轴偏移: ${Math.round(offsetX)}px</div>
            <div style="color:#3399ff">Y轴偏移: ${Math.round(offsetY)}px</div>
            <div style="color:#33cc33">总偏移量: ${Math.round(Math.sqrt(offsetX*offsetX + offsetY*offsetY))}px</div>
            <div>缩放比例: ${scaleRatio.toFixed(2)}x</div>
            <div style="margin-top: 8px; border-top: 1px solid #444; padding-top: 8px;">
                <div><strong>坐标信息:</strong></div>
                <div>头部中心: (${Math.round(headCenterX)}, ${Math.round(headCenterY)})</div>
                <div>偏移终点: (${Math.round(headCenterX + offsetX)}, ${Math.round(headCenterY + offsetY)})</div>
                <div>头部尺寸: ${Math.round(headWidth)} × ${Math.round(headHeight)}px</div>
            </div>
        `;
        
        // 设置位置（避免遮挡重要区域）
        infoPanel.style.left = `${canvasRect.right + 20}px`;
        infoPanel.style.top = `${canvasRect.top + 20}px`;
        
        document.body.appendChild(infoPanel);
    }
    
    // 清除坐标信息面板
    clearCoordinateInfo() {
        const existingPanel = document.getElementById('head-coordinate-info');
        if (existingPanel) {
            existingPanel.remove();
        }
    }
}

// 扩展CharacterVoiceUI类以集成调试功能
(function() {
    // 保存原始的drawCharacter方法
    const originalDrawCharacter = CharacterVoiceUI.prototype.drawCharacter;
    
    // 重写drawCharacter方法以添加调试功能
    CharacterVoiceUI.prototype.drawCharacter = function() {
        // 调用原始绘制方法
        originalDrawCharacter.call(this);
        
        // 直接调用调试绘制，不再检查isEnabled
        if (this.headDebugger) {
            const b = this.bodyFrames[this.currentAwaken];
            const bodyFrame = b.spriteSize;
            const scaleRatio = this.canvas.height / bodyFrame.h;
            
            const scaledBodyWidth = bodyFrame.w * scaleRatio;
            const scaledBodyHeight = bodyFrame.h * scaleRatio;
            const bodyX = (this.canvas.width - scaledBodyWidth) / 2;
            const bodyY = (this.canvas.height - scaledBodyHeight) / 2;
            
            const h = this.headFrames[this.currentAwaken][this.currentExpression];
            if (h) {
                const defaultOffset = this.headOffsets[this.currentAwaken];
                const spriteSourceSize = this.bodyFrames[this.currentAwaken].spriteSize;
                
                const bodyCenterX = spriteSourceSize.w / 2 + b.spriteOffset.x;
                const bodyCenterY = spriteSourceSize.h / 2 + b.spriteOffset.y;
                const bodyLeft = bodyCenterX - bodyFrame.w / 2;
                const bodyTop = bodyCenterY - bodyFrame.h / 2;
                
                const headCenterX = spriteSourceSize.w / 2 + defaultOffset.x;
                const headCenterY = spriteSourceSize.h / 2 - defaultOffset.y;
                const headLeft = headCenterX - h.tr.w / 2;
                const headTop = headCenterY - h.tr.h / 2;
                
                const offsetX = (headLeft - bodyLeft) * scaleRatio;
                const offsetY = (headTop - bodyTop) * scaleRatio;
                
                const headX = bodyX + offsetX;
                const headY = bodyY + offsetY;
                
                // 调用调试绘制方法
                this.headDebugger.drawDebugVisualization(
                    this.ctx, 
                    headX, 
                    headY, 
                    h.tr.w * scaleRatio, 
                    h.tr.h * scaleRatio, 
                    offsetX, 
                    offsetY,
                    scaleRatio
                );
            }
        }
    };
    
    // 初始化调试器的方法
    CharacterVoiceUI.prototype.initHeadDebugger = function() {
        if (!this.headDebugger) {
            this.headDebugger = new HeadOffsetDebugger(this);
        }
    };
})();

// 当DOM加载完成后初始化调试功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing head debugger');
    
    // 轮询等待characterVoiceUI实例创建完成
    function initHeadDebugger() {
        console.log('Checking for characterVoiceUI...');
        console.log('window.characterVoiceUI exists:', !!window.characterVoiceUI);
        console.log('initHeadDebugger method exists:', !!(window.characterVoiceUI && window.characterVoiceUI.initHeadDebugger));
        
        if (window.characterVoiceUI && window.characterVoiceUI.initHeadDebugger) {
            console.log('Found characterVoiceUI, initializing debugger');
            window.characterVoiceUI.initHeadDebugger();
            console.log('Head offset debugger initialized successfully');
            console.log('Debug options status:', {
                showAxisLines: window.characterVoiceUI.headDebugger?.showAxisLines,
                showTotalVector: window.characterVoiceUI.headDebugger?.showTotalVector,
                showCoordinates: window.characterVoiceUI.headDebugger?.showCoordinates
            });
        } else {
            console.log('characterVoiceUI not ready, retrying in 100ms');
            setTimeout(initHeadDebugger, 100);
        }
    }
    
    // 开始初始化
    initHeadDebugger();
});