const parseGradient = (gradientString) => {
    // 提取角度
    const angleMatch = gradientString.match(/(\d+)deg/);
    const angle = angleMatch ? parseFloat(angleMatch[1]) : 0;
    
    // 提取颜色停止点
    const colorStops = gradientString.match(/#[A-Fa-f0-9]{6} [-+\d.]+%/g) || [];
    
    // 解析颜色和位置
    const colors = [];
    const locations = [];
    
    colorStops.forEach(stop => {
      const [color, position] = stop.split(' ');
      colors.push(color);
      
      const positionPercent = parseFloat(position.replace('%', ''));
      locations.push(positionPercent / 100);
    });
    

    const normalizeLocations = (locs) => {
      const min = Math.min(...locs);
      const max = Math.max(...locs);
      const range = max - min;
      
      return range === 0 
        ? locs.map(() => 0.5) // 所有位置相同时设为0.5
        : locs.map(loc => (loc - min) / range);
    };
    
    const normalizedLocations = normalizeLocations(locations);
    
    // 计算起始点和结束点
    const calculatePoint = (angle) => {
      const radians = (angle * Math.PI) / 180;
      return {
        x: 0.5 + Math.sin(radians) / 2,
        y: 0.5 - Math.cos(radians) / 2
      };
    };
    
    return {
      colors,
      locations: normalizedLocations,
      start: calculatePoint(angle),
      end: calculatePoint(angle + 180)
    };
  };
  
const gradientProps = parseGradient(
    "linear-gradient(256deg, #00FFA3 -17.71%, #3F3FFF 68.62%, #0100F2 151.69%)"
);

console.log(gradientProps);


/**
 * css linear-gradient 转成react native 
 */