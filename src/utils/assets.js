// Procedural Pixel Art Generator for Next.js RPG
// Creates offscreen canvases for 16x16 and 32x32 sprites.

const COLORS = {
  '.': null,              // Transparent
  'k': '#1a1c2e',         // Very dark blue/black outline
  'w': '#f4f4f9',         // Off-white
  'g': '#38b000',         // Vibrant grass green
  'G': '#005f73',         // Dark teal/forest green
  'b': '#48cae4',         // Bright blue
  'B': '#0077b6',         // Deep blue
  'r': '#e63946',         // Red
  'R': '#9b2226',         // Dark red
  'y': '#ffb703',         // Gold/Yellow
  'o': '#fb8500',         // Orange
  's': '#ffcdb2',         // Skin tone
  'd': '#6c757d',         // Slate metal grey
  'c': '#adb5bd',         // Light steel grey
  'p': '#7209b7',         // Purple
  'P': '#4cc9f0',         // Cyber cyan
  'm': '#b07d62',         // Brown
  'M': '#6f4e37',         // Dark brown
  'f': '#ffb5a7',         // Pink
};

const SPRITES = {
  // 16x16 sprites
  grass: [
    'gggggggggggggggg',
    'ggggggggGggggggg',
    'ggggggggGggggggg',
    'gggggggggggggggg',
    'ggggGggggggggggg',
    'ggggGggggggggggg',
    'gggggggggggggggg',
    'ggggggggggggGggg',
    'ggggggggggggGggg',
    'gggggggggggggggg',
    'ggGggggggggggggg',
    'ggGggggggggggggg',
    'gggggggggggggggg',
    'gggggggggggggggg',
    'gggggggggggggggg',
    'gggggggggggggggg'
  ],
  wall: [
    'kkkkkkkkkkkkkkkk',
    'kddddddddddddddk',
    'kdccccccccccccdk',
    'kdcckkkkkkkcccdk',
    'kdckdddddddkccdk',
    'kdckdcccccdkccdk',
    'kdckdckkkkdkccdk',
    'kdckdckddkdkccdk',
    'kdckdckddkdkccdk',
    'kdckdckkkkdkccdk',
    'kdckdcccccdkccdk',
    'kdckdddddddkccdk',
    'kdcckkkkkkkcccdk',
    'kdccccccccccccdk',
    'kddddddddddddddk',
    'kkkkkkkkkkkkkkkk'
  ],
  floor: [
    'MMMMMMMMMMMMMMMM',
    'MmmmmmmmmmmmmmmM',
    'MmmmmmmmmmmmmmmM',
    'MmmMmmmmmmmmMmmM',
    'MmmmmmmmmmmmmmmM',
    'MmmmmmmmmmmmmmmM',
    'MmmmmmmmmmmmmmmM',
    'MmmmmmmmmmmmmmmM',
    'MmmmmmmmmmmmmmmM',
    'MmmmmmmmmmmmmmmM',
    'MmmMmmmmmmmmMmmM',
    'MmmmmmmmmmmmmmmM',
    'MmmmmmmmmmmmmmmM',
    'MmmmmmmmmmmmmmmM',
    'MmmmmmmmmmmmmmmM',
    'MMMMMMMMMMMMMMMM'
  ],
  tree: [
    '......kkkk......',
    '....kkggggkk....',
    '...kggggGGggk...',
    '..kggggGGGGggk..',
    '..kggGGGGGGggk..',
    '.kggGGGGGGGGggk.',
    '.kggGGGGGGGGggk.',
    'kGGGGGGGGGGGGGGk',
    'kGGGGGGGGGGGGGGk',
    '.kkkGGGGGGGGkkk.',
    '....kMMMMMMk....',
    '....kMmmmmMk....',
    '....kMmmmmMk....',
    '....kMMMMMMk....',
    '.....kkkkkk.....',
    '................'
  ],
  chest: [
    '.....kkkkkk.....',
    '...kkMmmmmMkk...',
    '..kMmmmmmmmmmMk..',
    '.kMmmmyyyyyymmMk.',
    '.kMmmmykkkkymmMk.',
    'kkMmmmykkkkymmMkk',
    'kkddddddddddddkk',
    'kkddddddddddddkk',
    'kkddddkkkkddddkk',
    'kkdddkwyywkdddkk',
    'kkdddkkkkkkdddkk',
    '.kddddddddddddk.',
    '.kddddddddddddk.',
    '..kkkkkkkkkkkk..',
    '................',
    '................'
  ],
  coin: [
    '......kkkk......',
    '....kkyyyykk....',
    '...kyyyyyyyyk...',
    '..kyywwyyyyykk..',
    '.kyywyyyyyoyyyk.',
    '.kyywyyyyoyyyyk.',
    '.kyyyyyyoyyyyyk.',
    '.kyyyyyoyyyyyyk.',
    '.kyyyoyyyyyyyyk.',
    '..kyoyyyyyyykk..',
    '...kyyyyyyyyk...',
    '....kkyyyykk....',
    '......kkkk......',
    '................',
    '................',
    '................'
  ],
  heart: [
    '................',
    '...kkkk...kkkk..',
    '.kkrrrrkkrrrrkk.',
    'krrrrrrrrrrrrrrk',
    'krrrrrrrrrrrrrrk',
    'krrrrrrrrrrrrrrk',
    '.krrrrrrrrrrrrk.',
    '.krrrrrrrrrrrrk.',
    '..krrrrrrrrrrk..',
    '...krrrrrrrrk...',
    '....krrrrrrk....',
    '.....krrrrk.....',
    '......krrk......',
    '.......kk.......',
    '................',
    '................'
  ],
  potion: [
    '......kkkk......',
    '......kwwk......',
    '......kwwk......',
    '.....kddddk.....',
    '....kppppppk....',
    '...kppppppppk...',
    '..kppppppppppk..',
    '..kppppwwppppk..',
    '..kppppwwppppk..',
    '..kppppppppppk..',
    '..kppppppppppk..',
    '...kppppppppk...',
    '....kppppppk....',
    '.....kkkkkk.....',
    '................',
    '................'
  ],
  sword: [
    '............kk..',
    '...........kckk.',
    '..........kccck.',
    '.........kccck..',
    '........kccck...',
    '.......kccck....',
    '......kccck.....',
    '.....kccck......',
    '....kccck.......',
    '...kdddk........',
    '..kdddk.........',
    '.kyyyk..........',
    'kyykk...........',
    'kk..............',
    '................',
    '................'
  ],
  portal: [
    '...kkkkkkkkkk...',
    '..kPPppppppPPk..',
    '.kPppppppppppPk.',
    '.kppppPPPPppppk.',
    'kpppPPwwwwPPpppk',
    'kpppPwwkkwwPpppk',
    'kpppPwk..kwPpppk',
    'kpppPwk..kwPpppk',
    'kpppPwwkkwwPpppk',
    'kpppPPwwwwPPpppk',
    'kppppPPPPppppk.',
    '.kPppppppppppPk.',
    '..kPPppppppPPk..',
    '...kkkkkkkkkk...',
    '................',
    '................'
  ],
  
  // 16x24/16x16 animations
  player_down: [
    '......kkkk......',
    '....kksssskk....',
    '...kssssssssk...',
    '..kssskkkksssk..',
    '..ksswkkwwsssk..',
    '..kssssssssssk..',
    '...kssssssssk...',
    '....kksssskk....',
    '..kkddddddddkk..',
    '.kddddddddddddk.',
    'kddccddddddccddk',
    'kddccddddddccddk',
    'kkddddddddddddkk',
    '..kddddddddddk..',
    '..kMMkkkkkkMMk..',
    '..kkk......kkk..'
  ],
  player_up: [
    '......kkkk......',
    '....kksssskk....',
    '...kssssssssk...',
    '..kssssssssssk..',
    '..kssssssssssk..',
    '..kssssssssssk..',
    '...kssssssssk...',
    '....kksssskk....',
    '..kkddddddddkk..',
    '.kddddddddddddk.',
    'kddddddddddddddk',
    'kddddddddddddddk',
    'kkddddddddddddkk',
    '..kddddddddddk..',
    '..kMMkkkkkkMMk..',
    '..kkk......kkk..'
  ],
  player_left: [
    '......kkkk......',
    '....kksssskk....',
    '...kssssssssk...',
    '..kssskkkksssk..',
    '..ksswkkwwsssk..',
    '..kssssssssssk..',
    '...kssssssssk...',
    '....kksssskk....',
    '....kddddddkk...',
    '...kdddddddddk..',
    '..kccddddddccdk.',
    '..kccddddddccdk.',
    '..kddddddddddk..',
    '...kddddddddk...',
    '....kMMkkkMMk...',
    '....kkk...kkk...'
  ],
  player_right: [
    '......kkkk......',
    '....kksssskk....',
    '...kssssssssk...',
    '..kssskkkksssk..',
    '..ksswkkwwsssk..',
    '..kssssssssssk..',
    '...kssssssssk...',
    '....kksssskk....',
    '...kkddddddk....',
    '..kdddddddddk...',
    '.kdccddddddcck..',
    '.kdccddddddcck..',
    '..kddddddddddk..',
    '...kddddddddk...',
    '...kMMkkkMMk....',
    '...kkk...kkk....'
  ],
  slime: [
    '................',
    '................',
    '......kkkk......',
    '....kkbbbbkk....',
    '...kbbbbbbbbk...',
    '..kbbbbbbbbbbk..',
    '.kbbwbbbbbbwbbk.',
    '.kbbwbbbbbbwbbk.',
    'kbbbbbbbbbbbbbbk',
    'kbbbbbbbbbbbbbbk',
    'kbbbbbbbbbbbbbbk',
    'kbbbbbbbbbbbbbbk',
    '.kbbbbbbbbbbbbk.',
    '..kkbbbbbbbbkk..',
    '...kkkkkkkkkk...',
    '................'
  ],
  slime_boss: [
    '................',
    '......kkkk......',
    '....kkppppkk....',
    '...kppppppppk...',
    '..kppppppppppk..',
    '.kppwppppppwppk.',
    '.kppwppppppwppk.',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    '.kppppppppppppk.',
    '..kkppppppppkk..',
    '...kkkkkkkkkk...',
    '................',
    '................'
  ]
};

// Generates canvas images from pixel art string grids
export function generateAssets() {
  if (typeof window === 'undefined') return {}; // SSR safety

  const assets = {};

  Object.entries(SPRITES).forEach(([name, grid]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    grid.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        const color = COLORS[char];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    assets[name] = canvas;
  });

  return assets;
}
