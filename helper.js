// 轉換URL為各種尺寸版本的函數
// 輸入 https://www.twreporter.org/images/20250409184447-4ec8004f3e32d67fe5bf5028777d575c-original.png
// 輸入 https://www.twreporter.org/images/20250409184447-4ec8004f3e32d67fe5bf5028777d575c-desktop.png
// 輸入 https://www.twreporter.org/images/20250409184447-4ec8004f3e32d67fe5bf5028777d575c-tablet.png
export function generateSrcSet(url) {
    // 檢查URL是否為空或無效
    if (!url || typeof url !== 'string') {
        return { src: url, srcset: '' };
    }

    // 檢查URL是否已經包含尺寸後綴
    const sizePatterns = ['-tiny', '-w400', '-tablet', '-mobile', '-desktop'];
    let baseUrl = '';
    let detectedPattern = '';
    let fileExtension = '.jpg'; // 默認擴展名

    // 獲取文件擴展名
    if (url.toLowerCase().endsWith('.png')) {
        fileExtension = '.png';
    } else if (
        url.toLowerCase().endsWith('.jpg') ||
        url.toLowerCase().endsWith('.jpeg')
    ) {
        fileExtension = '.jpg';
    }

    // 查找URL中包含的尺寸後綴
    for (const pattern of sizePatterns) {
        if (url.includes(pattern)) {
            // 從URL中提取基本路徑（不包含尺寸後綴和文件擴展名）
            baseUrl = url.substring(0, url.lastIndexOf(pattern));
            detectedPattern = pattern;
            break;
        }
    }

    // 如果沒有找到尺寸後綴，返回原始URL
    if (!detectedPattern) {
        return { src: url, srcset: '' };
    }

    // 生成不同大小的URL和寬度組合
    const srcset = [
        `${baseUrl}-mobile${fileExtension} 800w`,
        `${baseUrl}-tablet${fileExtension} 1200w`,
        `${baseUrl}-desktop${fileExtension} 2000w`,
        `${baseUrl}-tiny${fileExtension} 150w`,
    ].join(', ');

    // 默認顯示的圖片，根據設備類型選擇
    const defaultSrc = `${baseUrl}-mobile${fileExtension}`;

    return { src: defaultSrc, srcset };
}


// 初始化前先標記當前執行的模組
// 這是一個關鍵步驟，確保在多模組環境中正確識別當前模組
export function markCurrentModule(currentScript, moduleId) {
    try {
        // 使用當前運行的腳本元素標記最近的父級模組
        if (currentScript) {
            const parentModule = currentScript.closest('.parallax-module');
            if (parentModule) {
                // 為模組添加臨時ID標記
                parentModule.setAttribute('data-module-id', moduleId);
                console.log(`[${moduleId}] 成功標記當前模組`);
                return parentModule;
            }
        }

        // 如果上述方法失敗，使用DOM遍歷查找未標記的模組
        const allModules = document.querySelectorAll('.parallax-module:not([data-module-id])');
        if (allModules.length > 0) {
            // 標記第一個未標記的模組
            const targetModule = allModules[0];
            targetModule.setAttribute('data-module-id', moduleId);
            console.log(`[${moduleId}] 使用查找標記了模組`);
            return targetModule;
        }

        throw new Error('無法找到未標記的模組');
    } catch (error) {
        console.error(`[${moduleId}] 模組標記失敗:`, error);
        return null;
    }
}

// 載入所有圖片
export function loadImages(moduleId, parallaxWrapper, imagesConfig) {


    // 清空容器前先檢查
    if (!parallaxWrapper) {
        console.error(`[${moduleId}] 找不到有效的視差容器!`);
        return;
    }

    // 清空容器
    parallaxWrapper.innerHTML = '';

    // 1. 創建背景圖
    const bgImageConfig = imagesConfig.find(img => img.isBackground);
    if (bgImageConfig && bgImageConfig.url) {
        const { src, srcset } = generateSrcSet(bgImageConfig.url);

        const bgImg = document.createElement('img');
        bgImg.className = 'parallax-bg';
        bgImg.id = bgImageConfig.uniqueId || `${moduleId}_img_${bgImageConfig.id}`;
        bgImg.alt = bgImageConfig.name || '背景圖';
        bgImg.src = src;

        // 設置srcset和sizes屬性實現響應式
        if (srcset) {
            bgImg.srcset = srcset;
            bgImg.sizes =
                '(max-width: 800px) 800px, (max-width: 1200px) 1200px, 2000px';
        }

        // 設置背景圖的z-index
        if (typeof bgImageConfig.zIndex === 'number') {
            bgImg.style.zIndex = bgImageConfig.zIndex;
        }

        parallaxWrapper.appendChild(bgImg);
        console.log(`[${moduleId}] 已載入背景圖: ${bgImageConfig.url}`);
    }

    // 2. 創建所有前景圖片
    imagesConfig.forEach(config => {
        // 跳過背景圖和無URL的圖片
        if (config.isBackground || !config.url) {
            return;
        }

        const { src, srcset } = generateSrcSet(config.url);

        const img = document.createElement('img');
        img.className = 'parallax-img';
        // 使用配置中的唯一ID或根據模組ID創建
        img.id = config.uniqueId || `${moduleId}_img_${config.id}`;
        img.src = src;

        // 設置srcset和sizes屬性實現響應式
        if (srcset) {
            img.srcset = srcset;
            img.sizes =
                '(max-width: 800px) 800px, (max-width: 1200px) 1200px, 2000px';
        }

        img.alt = config.name || `圖片 ${config.id}`;

        // 設置前景圖的z-index
        if (typeof config.zIndex === 'number') {
            img.style.zIndex = config.zIndex;
        }

        parallaxWrapper.appendChild(img);
        console.log(`[${moduleId}] 已載入圖片 ${config.id}: ${config.url}`);
    });

    console.log(
        `[${moduleId}] 成功加載 ${imagesConfig.length} 張圖片，容器ID: ${parallaxWrapper.id}`
    );
}


import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.7/+esm';
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.7/ScrollTrigger.js/+esm';
gsap.registerPlugin(ScrollTrigger);

// 創建動畫
export function createAnimations(moduleId, scrollConfig, imagesConfig, parallaxWrapper, currentModule) {
    // 清除可能存在的ScrollTrigger實例
    ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.id && trigger.vars.id.startsWith(moduleId)) {
            trigger.kill();
        }
    });

    // 設置參數
    const viewportStart = `${Math.round(
        scrollConfig.startViewportPosition * 100
    )}%`;
    const triggerStart = `${Math.round(
        scrollConfig.triggerStartPosition * 100
    )}%`;
    const scrollDistance = scrollConfig.scrollDistance;

    // 設置起始和結束位置
    const startPos = `${triggerStart} ${viewportStart}`;
    const endPos = `+=${scrollDistance}`;

    // 創建共用的ScrollTrigger配置 - 使用DOM元素引用而非選擇器
    const commonScrollTriggerConfig = {
        trigger: parallaxWrapper, // 直接使用DOM元素引用
        id: `${moduleId}_trigger`,
        start: startPos,
        end: endPos,
        markers: false,
        scrub: 1,
    };

    // 為所有圖片創建動畫
    imagesConfig.forEach(imageConfig => {
        if (!imageConfig.url || imageConfig.isBackground) {
            return; // 跳過背景圖和無URL的圖片
        }

        try {
            // 獲取圖片元素 - 使用當前模組範圍內的查詢
            const imgId = imageConfig.uniqueId || `${moduleId}_img_${imageConfig.id}`;
            // 只在當前模組內查找，避免跨模組干擾
            const imgElement = currentModule.querySelector(`#${imgId}`);

            if (!imgElement) {
                console.warn(`[${moduleId}] 找不到圖片元素 #${imgId}，跳過動畫創建`);
                return;
            }

            // 檢查是否有動畫參數
            if (
                !imageConfig.fromParams ||
                !imageConfig.toParams ||
                imageConfig.fromParams.trim() === '{}' ||
                imageConfig.toParams.trim() === '{}'
            ) {
                console.log(
                    `[${moduleId}] 圖片 ${imageConfig.name} 沒有設置動畫參數或參數為空，跳過動畫創建`
                );
                return;
            }

            // 解析動畫參數
            let fromParams, toParams;
            try {
                fromParams = eval(`(${imageConfig.fromParams})`);
                if (Object.keys(fromParams).length === 0) return;
            } catch (e) {
                console.error(
                    `[${moduleId}] 解析From參數失敗 (${imageConfig.name})`,
                    e
                );
                return;
            }

            try {
                toParams = eval(`(${imageConfig.toParams})`);
                if (Object.keys(toParams).length === 0) return;
            } catch (e) {
                console.error(`[${moduleId}] 解析To參數失敗 (${imageConfig.name})`, e);
                return;
            }

            // 創建GSAP動畫 - 使用DOM元素引用而非選擇器
            gsap.fromTo(
                imgElement, // 直接使用DOM元素引用
                fromParams,
                {
                    ...toParams,
                    scrollTrigger: commonScrollTriggerConfig,
                }
            );

            console.log(`[${moduleId}] 已創建圖片動畫: ${imageConfig.name}`);
        } catch (error) {
            console.error(
                `[${moduleId}] 創建圖片動畫失敗 (${imageConfig.name})`,
                error
            );
        }
    });
}