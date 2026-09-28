const fs = require('fs');
const file = '/Users/iyumriba/Desktop/youtube short generator/Imagino/untitled folder/src/games/SlotsGame.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /graphics\.lineStyle\(6, 0x00E701, 0\.8\);([\s\S]*?)graphics\.lineStyle\(0\);\s*graphics\.beginFill\(0x00E701, 0\.2\);\s*graphics\.drawRect\(col \* REEL_WIDTH, row \* SYMBOL_SIZE, REEL_WIDTH, SYMBOL_SIZE\);\s*graphics\.endFill\(\);/g,
  `graphics.stroke({ width: 6, color: 0x00E701, alpha: 0.8 }); // Wait, that would stroke after path
       
       for (let col = 0; col < win.count; col++) {
          const row = line[col];
          graphics.rect(col * REEL_WIDTH, row * SYMBOL_SIZE, REEL_WIDTH, SYMBOL_SIZE);
       }
       graphics.fill({ color: 0x00E701, alpha: 0.2 });`
);

// Actually, I'll just rewrite the drawWinningLines function via sed/node
