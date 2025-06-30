// generate-css-variables.js
const fs = require('fs');
const path = require('path');
const Asksia = 'sia'
// 1. 配置参数
const TOKENS_DIR = path.join(__dirname, 'tokens'); // JSON文件所在目录
const OUTPUT_CSS = path.join(__dirname, 'output', 'variables.css'); // 输出CSS文件路径

// 2. 主处理函数
async function generateCssVariables() {
  try {
    // 确保输出目录存在
    const outputDir = path.dirname(OUTPUT_CSS);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 读取所有JSON文件
    const files = fs.readdirSync(TOKENS_DIR).filter(file => 
      file.endsWith('.json') && !file.startsWith('.')
    );

    if (files.length === 0) {
      console.warn(`⚠️ 目录 ${TOKENS_DIR} 中没有找到JSON文件`);
      return;
    }

    // 收集所有变量
    const allVariables = {};
    const modeCounts = {};
    
    files.forEach(file => {
      try {
        const filePath = path.join(TOKENS_DIR, file);
        const rawData = fs.readFileSync(filePath, 'utf8');
        const tokenData = JSON.parse(rawData);
        
        // 验证文件结构
        if (!tokenData.collections || !Array.isArray(tokenData.collections)) {
          console.warn(`⚠️ 文件 ${file} 缺少 collections 数组，跳过处理`);
          return;
        }
        
        tokenData.collections.forEach(collection => {
          // 验证集合结构
          if (!collection.variables || typeof collection.variables !== 'object') {
            console.warn(`⚠️ 集合 "${collection.name}" 缺少 variables 对象，跳过处理`);
            return;
          }
          
          const collName = kebabCase(collection.name);
          
          Object.entries(collection.variables).forEach(([category, variables]) => {
            // 修复点1: 确保 variables 是对象
            if (typeof variables !== 'object' || variables === null) {
              console.warn(`⚠️ 类别 "${category}" 的变量不是对象，跳过`);
              return;
            }
            
            const catName = kebabCase(category);
            
            Object.entries(variables).forEach(([name, valueObj]) => {
              // 修复点2: 确保 valueObj 有 values 属性
              if (!valueObj || !valueObj.values || typeof valueObj.values !== 'object') {
                console.warn(`⚠️ 变量 "${name}" 缺少 values 属性，跳过`);
                return;
              }
              
              const varName = `--${Asksia}-${collName}-${catName}-${kebabCase(name)}`;
              
              // 处理多模式值
              const modes = Object.keys(valueObj.values);
              const defaultMode = modes[0];
              
              if (!defaultMode) {
                console.warn(`⚠️ 变量 "${name}" 没有定义任何模式值，跳过`);
                return;
              }
              
              // 统计模式使用情况
              modes.forEach(mode => {
                modeCounts[mode] = (modeCounts[mode] || 0) + 1;
              });
              
              // 只使用第一个模式的值
              const cssValue = valueObj.values[defaultMode];
              
              // 修复点3: 确保有值
              if (cssValue === undefined || cssValue === null) {
                console.warn(`⚠️ 变量 "${name}" 在模式 "${defaultMode}" 下没有值，跳过`);
                return;
              }
              
              const formattedValue = formatCssValue(cssValue, valueObj.type);
              
              allVariables[varName] = formattedValue;
            });
          });
        });
      } catch (fileError) {
        console.error(`❌ 处理文件 ${file} 时出错:`, fileError.message);
      }
    });

    // 3. 生成CSS内容
    let cssContent = `/* 自动生成的CSS变量 - 基于设计令牌 */\n`;
    cssContent += `/* 生成时间: ${new Date().toISOString()} */\n\n`;
    cssContent += `:root {\n`;
    
    Object.entries(allVariables).forEach(([varName, value]) => {
      cssContent += `  ${varName}: ${value};\n`;
    });
    
    cssContent += `}\n\n`;
    
    // 添加模式统计注释
    cssContent += `/* 模式统计:\n`;
    Object.entries(modeCounts).forEach(([mode, count]) => {
      cssContent += ` * ${mode}: ${count} 个变量\n`;
    });
    cssContent += ` */\n`;
    
    // 4. 写入CSS文件
    fs.writeFileSync(OUTPUT_CSS, cssContent);
    console.log(`✅ CSS变量已生成: ${OUTPUT_CSS}`);
    console.log(`   总变量数: ${Object.keys(allVariables).length}`);
    console.log(`   源文件数: ${files.length}`);
    
  } catch (error) {
    console.error('❌ 生成CSS变量时出错:', error.message);
    console.error(error.stack);
  }
}

// 辅助函数：转换为kebab-case
function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

// 辅助函数：格式化CSS值
function formatCssValue(value, type) {
  // 如果类型未定义，尝试自动判断
  if (!type) {
    if (typeof value === 'number') {
      return `${value}px`; // 假设数字值代表像素
    }
    return value;
  }
  
  switch (type.toLowerCase()) {
    case 'number':
      // 假设数字值代表像素，添加px单位
      return `${value}px`;
    case 'color':
      // 如果是颜色值，确保格式正确
      return value.startsWith('#') ? value : `#${value}`;
    case 'dimension':
      return `${value}px`;
    default:
      return value;
  }
}

// 5. 执行脚本
generateCssVariables();