import { useMemo, useState, useEffect, useRef } from 'react'
import './App.css'
import { supabase } from './supabaseClients'

// 棋寶常見牌套尺寸選項
const CHESURE_SLEEVE_OPTIONS = [
  '38x88 mm', '41x63 mm', '43x65 mm', '44x63 mm', '45x68 mm',
  '50x75 mm', '54x80 mm', '54x86 mm', '56x87 mm', '57.5x89 mm',
  '59x92 mm', '61x112 mm', '63.5x88 mm', '65x100 mm', '70x100 mm',
  '70x110 mm', '70x120 mm', '75x105 mm', '75x110 mm', '80x120 mm',
  '52x52 mm', '65x65 mm', '70x70 mm', '80x80 mm', '免用牌套'
]

const initialGames = [
  { id: 1, name: '地城無雙 Dungeon Mayhem', englishName: 'Dungeon Mayhem', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 15, category: '卡牌對戰', rating: 8.00, complexity: 1.50, emoji: '⚔️', imageUrl: '', tags: ['新手推薦', '快節奏'], description: '極度爽快的卡牌對戰遊戲，選好你的英雄，把其他對手打倒！', cheatSheet: '1. 每回合抽2張牌，打出牌面執行效果。\n2. 攻擊對手血量，歸零者淘汰。\n3. 最後存活的英雄獲勝！', videoUrl: 'https://www.youtube.com/results?search_query=地城無雙+桌遊教學', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm (120張)' },
  { id: 2, name: '心靈同步', englishName: 'The Mind', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 20, category: '合作', rating: 8.10, complexity: 1.20, emoji: '🧠', imageUrl: '', tags: ['默契考驗', '靜音遊戲'], description: '不能說話、不能打手勢，只能靠感覺依序打出數字牌！', cheatSheet: '1. 牌面數字由小到大依序打出。\n2. 全程絕對不能溝通與暗示。\n3. 容許一定的生命值失誤次數。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '56x87 mm (120張)' },
  { id: 3, name: '機密代號：裡應外合', englishName: 'Codenames: Duet', minPlayers: 2, maxPlayers: 2, bestPlayers: '2', time: 25, category: '合作', rating: 8.30, complexity: 2.00, emoji: '🕵️', imageUrl: '', tags: ['雙人首選', '聯想燒腦'], description: '雙人合作版的機密代號，透過一個詞彙給予提示，找出所有特務。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: true, parentId: null, sleeveSize: '45x68 mm (100張), 70x70 mm (15張)' },
  { id: 4, name: '格格不入', englishName: 'Blokus', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 30, category: '策略', rating: 7.80, complexity: 1.80, emoji: '🟩', imageUrl: '', tags: ['抽象棋類', '易學難精'], description: '經典的版塊放置遊戲，盡可能把自己的方塊全部拼上棋盤！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '免用牌套' },
  { id: 5, name: '璀璨寶石：漫威版', englishName: 'Splendor Marvel', minPlayers: 2, maxPlayers: 4, bestPlayers: '3-4', time: 40, category: '策略', rating: 8.40, complexity: 2.20, emoji: '💎', imageUrl: '', tags: ['引擎建構', '漫威IP'], description: '招募超級英雄，收集無限寶石，搶先完成無限手套！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: true, parentId: null, sleeveSize: '63.5x88 mm (90張)' },
  { id: 6, name: '炸彈競技場：口袋版', englishName: 'Bomb Arena', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 20, category: '陣營', rating: 7.50, complexity: 1.30, emoji: '💣', imageUrl: '', tags: ['快節奏', '互相傷害'], description: '炸彈隨時爆發，利用手中的牌轉移炸彈或陷害對手。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '57.5x89 mm' },
  { id: 7, name: '三千世界鴉殺盡', englishName: 'Crow Killers', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 20, category: '派對', rating: 7.60, complexity: 1.50, emoji: '🦅', imageUrl: '', tags: ['日系畫風', '心機'], description: '充滿日式風情的輕度心理戰遊戲。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 8, name: '鴿爆了', englishName: 'Pigeon Explode', minPlayers: 2, maxPlayers: 5, bestPlayers: '4-5', time: 20, category: '派對', rating: 7.40, complexity: 1.00, emoji: '🕊️', imageUrl: '', tags: ['派對', '搞笑'], description: '充滿歡笑與意外的派對卡牌遊戲。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 9, name: '你是不是沒朋友', englishName: 'No Friends', minPlayers: 1, maxPlayers: 5, bestPlayers: '3-4', time: 25, category: '派對', rating: 7.30, complexity: 1.00, emoji: '😜', imageUrl: '', tags: ['自嘲搞笑', '單人可玩'], description: '適合邊聊天邊玩的邊緣人派對桌遊。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 10, name: '無限手套：情書', englishName: 'Infinity Gauntlet', minPlayers: 2, maxPlayers: 6, bestPlayers: '6', time: 15, category: '陣營', rating: 8.00, complexity: 1.50, emoji: '🥊', imageUrl: '', tags: ['1對多', '陣營對決'], description: '一名玩家扮演薩諾斯，其他人扮演復仇者聯盟進行對決！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: true, parentId: 17, sleeveSize: '63.5x88 mm (36張)' },
  { id: 11, name: '爆炸貓桌遊版', englishName: 'Exploding Kittens', minPlayers: 2, maxPlayers: 5, bestPlayers: '4-5', time: 15, category: '派對', rating: 7.80, complexity: 1.10, emoji: '💥', imageUrl: '', tags: ['心機抽牌', '新手推薦'], description: '像俄羅斯輪盤一樣的抽牌遊戲，抽到爆炸貓就淘汰！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm (56張)' },
  { id: 12, name: '爆炸貓 + 黑洞貓擴充', englishName: 'Exploding Kittens: Streaking Kittens', minPlayers: 2, maxPlayers: 6, bestPlayers: '5-6', time: 20, category: '派對', rating: 8.00, complexity: 1.30, emoji: '🐱', imageUrl: '', tags: ['擴充版', '更多玩法'], description: '加入了黑洞貓與更多特殊功能卡，讓遊戲更混亂更有趣！', videoUrl: '', rulePdfUrl: '', isExpansion: true, isSequel: false, parentId: 11, sleeveSize: '63.5x88 mm (15張)' },
  { id: 13, name: '德國蟑螂 皇家版', englishName: 'Cockroach Poker Royal', minPlayers: 2, maxPlayers: 6, bestPlayers: '4-5', time: 20, category: '吹牛', rating: 7.90, complexity: 1.20, emoji: '🪲', imageUrl: '', tags: ['經典吹牛', '看穿心機'], description: '看著對方的眼睛吹牛，皇家版多了皇冠動物與特殊卡牌！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: true, parentId: null, sleeveSize: '57.5x89 mm (65張)' },
  { id: 14, name: '字字轉機', englishName: 'Anomia', minPlayers: 3, maxPlayers: 6, bestPlayers: '4-6', time: 25, category: '派對', rating: 7.70, complexity: 1.10, emoji: '🔤', imageUrl: '', tags: ['反應力', '聯想力'], description: '符號對對碰！當卡牌符號相同時，必須搶先喊出對方卡牌類別的單字！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 15, name: '夜市人蔘', englishName: 'Night Market', minPlayers: 2, maxPlayers: 6, bestPlayers: '4', time: 30, category: '輕策略', rating: 7.80, complexity: 1.80, emoji: '🍢', imageUrl: '', tags: ['台灣在地', '美食擺攤'], description: '體驗台灣夜市擺攤樂趣！收集食材組合出美味的夜市小吃。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 16, name: '搞怪運動會', englishName: 'Wacky Sports', minPlayers: 2, maxPlayers: 6, bestPlayers: '5-6', time: 20, category: '派對', rating: 7.20, complexity: 1.00, emoji: '🏅', imageUrl: '', tags: ['歡樂動作', '派對爆笑'], description: '各種搞怪刺激的運動會項目，考驗大家的反應與肢體協調！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 17, name: '情書：六人版', englishName: 'Love Letter: Premium', minPlayers: 2, maxPlayers: 6, bestPlayers: '4', time: 20, category: '輕策略', rating: 8.00, complexity: 1.40, emoji: '💌', imageUrl: '', tags: ['經典推理', '支援6人'], description: '手牌只有一張！利用角色能力猜測他人手牌並將情書送到公主手中。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm (27張)' },
  { id: 18, name: '政變疑雲', englishName: 'Coup', minPlayers: 2, maxPlayers: 6, bestPlayers: '5-6', time: 15, category: '吹牛', rating: 8.10, complexity: 1.50, emoji: '👑', imageUrl: '', tags: ['吹牛陣營', '快節奏'], description: '即使你沒有那個角色的能力，也可以假裝有！看誰能吹牛到最後。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm (15張)' },
  { id: 19, name: '墨敵賽', englishName: 'Modisai', minPlayers: 2, maxPlayers: 5, bestPlayers: '3-4', time: 20, category: '輕策略', rating: 7.30, complexity: 1.60, emoji: '🐙', imageUrl: '', tags: ['卡牌對決', '簡單易學'], description: '充滿戰略趣味的卡牌對決遊戲，運用墨水敵人打敗對手！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '57.5x89 mm' },
  { id: 20, name: '吸爆鬆餅', englishName: 'Pancake Stack', minPlayers: 2, maxPlayers: 5, time: 15, bestPlayers: '4-5', category: '派對', rating: 7.40, complexity: 1.10, emoji: '🥞', imageUrl: '', tags: ['反應搶答', '輕鬆搞笑'], description: '疊高鬆餅吸爆對手！節奏快速且充滿歡笑的輕度派對遊戲。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '70x70 mm' },
  { id: 21, name: '犯人在跳舞', englishName: 'Criminal Dance', minPlayers: 3, maxPlayers: 8, bestPlayers: '6-8', time: 15, category: '陣營', rating: 8.00, complexity: 1.20, emoji: '🕺', imageUrl: '', tags: ['手牌交換', '新手必玩'], description: '犯人卡會在大家手中不斷轉移，偵探能否在遊戲結束前抓到犯人？', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '57.5x89 mm (32張)' },
  { id: 22, name: 'Who怕Who !?', englishName: 'Who Pa Who', minPlayers: 2, maxPlayers: 6, bestPlayers: '4-6', time: 20, category: '派對', rating: 7.30, complexity: 1.10, emoji: '👊', imageUrl: '', tags: ['互相傷害', '熱鬧歡樂'], description: '充滿挑釁與互踩樂趣的歡樂派對卡牌遊戲！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 23, name: '神吐槽', englishName: 'God Reaction', minPlayers: 3, maxPlayers: 8, bestPlayers: '5-8', time: 25, category: '派對', rating: 7.80, complexity: 1.20, emoji: '🗣️', imageUrl: '', tags: ['吐槽搞笑', '文字遊戲'], description: '面對各種奇葩情境，給出最具創意與爆點的神吐槽！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '56x87 mm' },
  { id: 24, name: '驚爆倫敦', englishName: 'Time Bomb', minPlayers: 4, maxPlayers: 8, bestPlayers: '6-8', time: 20, category: '陣營', rating: 8.20, complexity: 1.60, emoji: '💣', imageUrl: '', tags: ['剪線炸彈', '陣營心機'], description: '福爾摩斯對決莫里亞蒂！剪對線解除炸彈，還是不小心引爆大樓？', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm (48張)' },
  { id: 25, name: '世界上有兩種人', englishName: 'Two Kinds of People', minPlayers: 2, maxPlayers: 8, bestPlayers: '5-8', time: 20, category: '派對', rating: 7.60, complexity: 1.00, emoji: '☯️', imageUrl: '', tags: ['價值觀對立', '聊天神開場'], description: '香菜吃不吃？折摺還是捲牙膏？迅速了解朋友隱藏性格的派對遊戲！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 26, name: '瞎掰王：看圖掰', englishName: 'Fake That Picture', minPlayers: 3, maxPlayers: 9, bestPlayers: '5-8', time: 30, category: '吹牛', rating: 8.10, complexity: 1.40, emoji: '🖼️', imageUrl: '', tags: ['看圖說故事', '胡說八道'], description: '看著怪異圖片發揮創意一本正經地胡說八道，騙過所有玩家！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: true, parentId: 28, sleeveSize: '63.5x88 mm' },
  { id: 27, name: '腦洞量表：沒有下限', englishName: 'Top Ten Uncensored', minPlayers: 4, maxPlayers: 9, bestPlayers: '6-8', time: 30, category: '派對', rating: 8.30, complexity: 1.20, emoji: '🔞', imageUrl: '', tags: ['限制級搞笑', '默契評估'], description: '腦洞量表無下限版！根據題目表演 1 到 10 的程度，越浮誇越好！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: true, parentId: 29, sleeveSize: '63.5x88 mm' },
  { id: 28, name: '瞎掰王', englishName: 'Fake That', minPlayers: 3, maxPlayers: 9, bestPlayers: '5-8', time: 30, category: '吹牛', rating: 8.40, complexity: 1.50, emoji: '🤥', imageUrl: '', tags: ['派對熱門', '一本正經胡說八道'], description: '只有一個人知道冷知識真相，其他人要發揮演技瞎掰搶答！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 29, name: '腦洞量表', englishName: 'Top Ten', minPlayers: 4, maxPlayers: 9, bestPlayers: '6-8', time: 30, category: '派對', rating: 8.20, complexity: 1.20, emoji: '💡', imageUrl: '', tags: ['合作默契', '熱鬧歡樂'], description: '隊長提出題目，每個人根據手中的數字表演對應程度，讓隊長排序！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 30, name: '阿瓦隆', englishName: 'Avalon', minPlayers: 5, maxPlayers: 10, bestPlayers: '8-10', time: 30, category: '陣營', rating: 8.60, complexity: 2.40, emoji: '🏰', imageUrl: '', tags: ['陣營必玩', '語言邏輯', '不淘汰'], description: '正義與邪惡陣營的經典對決，刺客與梅林的智力較量。', cheatSheet: '1. 任務組隊：依據玩家人數指派隊長出任務。\n2. 投票：所有人同時決定贊成或反對該任務組合。\n3. 任務執行：任務成員秘密投下成功或失敗。\n4. 刺殺梅林：壞人若失敗可試圖找出梅林逆轉勝！', videoUrl: 'https://www.youtube.com/results?search_query=阿瓦隆+教學', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '57.5x89 mm (26張)' },
  { id: 31, name: '黃牌', englishName: 'Yellow Card', minPlayers: 3, maxPlayers: 10, bestPlayers: '6-10', time: 30, category: '派對', rating: 8.00, complexity: 1.00, emoji: '🟨', imageUrl: '', tags: ['填空搞笑', '黃暴歡樂'], description: '填空題卡牌遊戲，用最無厘頭或地獄的答案獲得裁判青睞！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' },
  { id: 32, name: '試個好遊戲', englishName: 'We Didn\'t Playtest This At All', minPlayers: 2, maxPlayers: 10, bestPlayers: '5-8', time: 5, category: '派對', rating: 7.50, complexity: 1.00, emoji: '🃏', imageUrl: '', tags: ['超快節奏', '無厘頭勝負'], description: '幾秒鐘就能結束一局！規則隨時在變，抽到什麼牌就照著做。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm (72張)' },
  { id: 33, name: '還試好遊戲', englishName: 'We Didn\'t Playtest This Either', minPlayers: 2, maxPlayers: 10, bestPlayers: '5-8', time: 5, category: '派對', rating: 7.50, complexity: 1.00, emoji: '🎴', imageUrl: '', tags: ['續作擴充', '無厘頭'], description: '《試個好遊戲》獨立續作，可單獨遊玩，亦可與前作混合！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: true, parentId: 32, sleeveSize: '63.5x88 mm (72張)' },
  { id: 34, name: '狼人真言', englishName: 'Werewords', minPlayers: 4, maxPlayers: 10, bestPlayers: '6-8', time: 10, category: '陣營', rating: 8.10, complexity: 1.40, emoji: '🐺', imageUrl: '', tags: ['問答陣營', '快節奏推理'], description: '透過「是/否」問答猜出祕密詞彙，同時找出潛伏在人群中的狼人！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '57.5x89 mm (14張)' },
  { id: 35, name: '梗圖黃牌', englishName: 'Meme Yellow Card', minPlayers: 3, maxPlayers: 10, bestPlayers: '6-10', time: 30, category: '派對', rating: 8.10, complexity: 1.10, emoji: '🖼️', imageUrl: '', tags: ['梗圖搭配', '地獄迷因'], description: '將熱門迷因梗圖搭配超欠扁台詞，製作出最搞笑的梗圖組合！', videoUrl: '', rulePdfUrl: '', isExpansion: true, isSequel: false, parentId: 31, sleeveSize: '63.5x88 mm' },
  { id: 36, name: '獵巫鎮 1692', englishName: 'Salem 1692', minPlayers: 4, maxPlayers: 12, bestPlayers: '7-10', time: 30, category: '陣營', rating: 8.40, complexity: 2.10, emoji: '🧹', imageUrl: '', tags: ['精美書本盒', '女巫審判'], description: '精美的暗黑歷史陣營遊戲，指控他人是女巫，在審判中存活下來！', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '57.5x89 mm (128張)' },
  { id: 37, name: '炸彈 boom', englishName: 'Boom Boom', minPlayers: 2, maxPlayers: 6, bestPlayers: '4-6', time: 15, category: '派對', rating: 7.20, complexity: 1.00, emoji: '💥', imageUrl: '', tags: ['緊張刺激', '反應力'], description: '傳遞炸彈！在時間倒數結束前快速完成任務並把炸彈傳給下一個人。', videoUrl: '', rulePdfUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm' }
]

const ADMIN_PASSWORD = '1234'

const emptyForm = {
  name: '',
  englishName: '',
  minPlayers: 2,
  maxPlayers: 4,
  bestPlayers: '4',
  time: 30,
  category: '派對',
  rating: '8.00',
  complexity: '2.00',
  emoji: '🎲',
  imageUrl: '',
  tagsInput: '',
  description: '',
  cheatSheet: '',
  videoUrl: '',
  rulePdfUrl: '',
  gameType: 'main',
  parentId: ''
}

export default function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')
  const [playerFilter, setPlayerFilter] = useState('all')
  const [bestPlayerFilter, setBestPlayerFilter] = useState('all')
  const [maxTimeFilter, setMaxTimeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rating-desc')
  const [expansionFilter, setExpansionFilter] = useState('all')

  // 多重主題切換
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'default')

  useEffect(() => {
    document.body.className = ''
    if (theme !== 'default') {
      document.body.classList.add(`theme-${theme}`)
    }
    localStorage.setItem('app_theme', theme)
  }, [theme])

  // 我的最愛
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_favorite_ids')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem('bg_favorite_ids', JSON.stringify(favorites))
    } catch (e) {}
  }, [favorites])

  function toggleFavorite(e, gameId) {
    e.stopPropagation()
    triggerHaptic('light')
    setFavorites(prev => 
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    )
  }

  // 牌套動態多組管理 (方案一)
  const [sleeveList, setSleeveList] = useState([{ size: '63.5x88 mm', count: '' }])

  function addSleeveRow() {
    setSleeveList([...sleeveList, { size: '63.5x88 mm', count: '' }])
  }

  function removeSleeveRow(idx) {
    setSleeveList(sleeveList.filter((_, i) => i !== idx))
  }

  function updateSleeveRow(idx, field, value) {
    const next = [...sleeveList]
    next[idx][field] = value
    setSleeveList(next)
  }

  // 聚會小工具狀態
  const [widgetTab, setWidgetTab] = useState('starter')
  const [sharedPlayers, setSharedPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_shared_players')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return [
      { id: 1, name: '玩家 1', score: 0 },
      { id: 2, name: '玩家 2', score: 0 },
      { id: 3, name: '玩家 3', score: 0 },
      { id: 4, name: '玩家 4', score: 0 }
    ]
  })

  useEffect(() => {
    try {
      localStorage.setItem('bg_shared_players', JSON.stringify(sharedPlayers))
    } catch (e) {}
  }, [sharedPlayers])

  const [inputPlayerName, setInputPlayerName] = useState('')
  const [starterWinner, setStarterWinner] = useState(null)
  const [isPickingStarter, setIsPickingStarter] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [diceResult, setDiceResult] = useState('🎲 點擊擲骰')
  const [coinResult, setCoinResult] = useState('🪙 點擊翻面')
  const [isRollingDice, setIsRollingDice] = useState(false)
  const [isFlippingCoin, setIsFlippingCoin] = useState(false)
  const [coinDegree, setCoinDegree] = useState(0)
  const [teamA, setTeamA] = useState([])
  const [teamB, setTeamB] = useState([])

  // 彈窗
  const [randomGame, setRandomGame] = useState(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [parentSearchInput, setParentSearchInput] = useState('')
  const [viewDetailGame, setViewDetailGame] = useState(null)
  const [detailTab, setDetailTab] = useState('info')

  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchGamesFromSupabase()
  }, [])

  async function fetchGamesFromSupabase() {
    setLoading(true)
    const { data, error } = await supabase
      .from('boardgames')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('抓取資料失敗:', error.message)
      setGames(initialGames)
    } else if (data) {
      setGames(data.length > 0 ? data : initialGames)
    }
    setLoading(false)
  }

  function triggerHaptic(type = 'light') {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(12)
        else if (type === 'medium') navigator.vibrate([20, 30, 20])
        else if (type === 'heavy') navigator.vibrate([40, 50, 100])
      } catch (e) {}
    }
  }

  function playSound(type) {
    if (!soundEnabled) return
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      const now = audioCtx.currentTime

      if (type === 'dice') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        osc.start(now)
        osc.stop(now + 0.15)
      } else if (type === 'coin') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(900, now)
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
        osc.start(now)
        osc.stop(now + 0.2)
      } else if (type === 'flip') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(450, now)
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.12)
        gain.gain.setValueAtTime(0.12, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
        osc.start(now)
        osc.stop(now + 0.12)
      } else if (type === 'victory') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(523.25, now)
        osc.frequency.setValueAtTime(659.25, now + 0.12)
        osc.frequency.setValueAtTime(783.99, now + 0.24)
        osc.frequency.setValueAtTime(1046.50, now + 0.36)
        gain.gain.setValueAtTime(0.25, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
        osc.start(now)
        osc.stop(now + 0.6)
      } else if (type === 'alarm') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, now)
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.6)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
        osc.start(now)
        osc.stop(now + 0.6)
      }
    } catch (e) {}
  }

  useEffect(() => {
    let interval = null
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false)
      playSound('alarm')
      triggerHaptic('heavy')
    }
    return () => clearInterval(interval)
  }, [timerRunning, timeLeft])

  const totalCount = games.length
  const mainCount = games.filter(g => !g.isExpansion).length
  const expansionCount = games.filter(g => g.isExpansion).length
  const favoriteCount = games.filter(g => favorites.includes(g.id)).length

  const categories = useMemo(() => {
    const base = ['派對', '陣營', '吹牛', '合作', '策略', '輕策略', '卡牌對戰']
    const catSet = new Set(base)
    games.forEach(g => { if (g.category) catSet.add(g.category.trim()) })
    return ['全部', ...Array.from(catSet)]
  }, [games])

  function isBestPlayerMatch(bestStr, targetNum) {
    if (!bestStr) return false
    const cleanStr = String(bestStr).replace(/人/g, '').trim()
    if (cleanStr.includes('-')) {
      const [minStr, maxStr] = cleanStr.split('-')
      const min = parseInt(minStr, 10)
      const max = parseInt(maxStr, 10)
      return targetNum >= min && targetNum <= max
    }
    return parseInt(cleanStr, 10) === targetNum
  }

  const filteredGames = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return games.filter((game) => {
      const matchSearch = keyword === '' || 
        (game.name && game.name.toLowerCase().includes(keyword)) ||
        (game.englishName && game.englishName.toLowerCase().includes(keyword))
      
      const matchCat = category === '全部' || game.category === category
      
      let matchP = true
      if (playerFilter !== 'all') {
        const p = parseInt(playerFilter, 10)
        matchP = p >= (game.minPlayers || 1) && p <= (game.maxPlayers || 99)
      }

      let matchBest = true
      if (bestPlayerFilter !== 'all') {
        const b = parseInt(bestPlayerFilter, 10)
        matchBest = isBestPlayerMatch(game.bestPlayers, b)
      }

      let matchTime = true
      if (maxTimeFilter !== 'all') {
        matchTime = (game.time || 0) <= parseInt(maxTimeFilter, 10)
      }

      let matchExp = true
      if (expansionFilter === 'main') matchExp = !game.isExpansion
      else if (expansionFilter === 'expansion') matchExp = !!game.isExpansion
      else if (expansionFilter === 'favorite') matchExp = favorites.includes(game.id)

      return matchSearch && matchCat && matchP && matchBest && matchTime && matchExp
    }).sort((a, b) => {
      if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'time-asc') return (a.time || 0) - (b.time || 0)
      if (sortBy === 'complexity-asc') return (a.complexity || 1) - (b.complexity || 1)
      return 0
    })
  }, [games, search, category, playerFilter, bestPlayerFilter, maxTimeFilter, sortBy, expansionFilter, favorites])

  function handleExportJSON() {
    const jsonString = JSON.stringify(games, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.href = url
    downloadAnchor.download = `boardgames_backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    document.body.removeChild(downloadAnchor)
    URL.revokeObjectURL(url)
  }

  function handleImportJSON(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result)
        if (!Array.isArray(importedData)) return alert('❌ 檔案格式不正確！')
        if (!window.confirm(`確定要匯入 ${importedData.length} 款桌遊到雲端資料庫嗎？`)) return

        const cleanPayload = importedData.map(({ id, created_at, ...rest }) => ({
          ...rest,
          minPlayers: parseInt(rest.minPlayers, 10) || 1,
          maxPlayers: parseInt(rest.maxPlayers, 10) || 4,
          time: parseInt(rest.time, 10) || 30,
          rating: parseFloat(rest.rating) || 8.00,
          complexity: parseFloat(rest.complexity) || 2.00,
          isExpansion: !!rest.isExpansion,
          isSequel: !!rest.isSequel,
          parentId: rest.parentId ? parseInt(rest.parentId, 10) : null,
          sleeveSize: rest.sleeveSize || '',
          rulePdfUrl: rest.rulePdfUrl || ''
        }))

        const { error } = await supabase.from('boardgames').insert(cleanPayload)
        if (error) {
          alert('❌ 匯入 Supabase 失敗：' + error.message)
        } else {
          alert(`✅ 成功匯入 ${cleanPayload.length} 款桌遊！`)
          fetchGamesFromSupabase()
        }
      } catch (err) {
        alert('❌ 解析 JSON 失敗！')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleCroppedImageUpload(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const maxSize = 600
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85)
        setFormData(prev => ({ ...prev, imageUrl: compressedBase64 }))
      }
    }
    reader.readAsDataURL(file)
  }

  function handleAddSharedPlayer(e) {
    if (e) e.preventDefault()
    triggerHaptic('light')
    const name = inputPlayerName.trim()
    if (!name) return
    if (sharedPlayers.some(p => p.name === name)) return alert('玩家已存在！')
    const newId = sharedPlayers.length > 0 ? Math.max(...sharedPlayers.map(p => p.id)) + 1 : 1
    setSharedPlayers([...sharedPlayers, { id: newId, name, score: 0 }])
    setInputPlayerName('')
  }

  function handleRemoveSharedPlayer(idToRemove) {
    triggerHaptic('light')
    if (sharedPlayers.length <= 1) return alert('至少保留 1 位玩家！')
    setSharedPlayers(sharedPlayers.filter(p => p.id !== idToRemove))
  }

  function pickStarterPlayer() {
    if (sharedPlayers.length < 2) return alert('請至少加入 2 位玩家！')
    setIsPickingStarter(true)
    setStarterWinner(null)
    triggerHaptic('medium')

    let count = 0
    const interval = setInterval(() => {
      const tempIdx = Math.floor(Math.random() * sharedPlayers.length)
      setStarterWinner(sharedPlayers[tempIdx].name)
      playSound('flip')
      count++
      if (count >= 16) {
        clearInterval(interval)
        setIsPickingStarter(false)
        playSound('victory')
        triggerHaptic('heavy')
      }
    }, 80)
  }

  function changeScore(id, delta) {
    triggerHaptic('light')
    setSharedPlayers(sharedPlayers.map(p => p.id === id ? { ...p, score: p.score + delta } : p))
  }

  function resetAllScores(val = 0) {
    triggerHaptic('medium')
    setSharedPlayers(sharedPlayers.map(p => ({ ...p, score: val })))
  }

  function rollDice(sides = 6) {
    setIsRollingDice(true)
    playSound('dice')
    triggerHaptic('medium')
    let count = 0
    const interval = setInterval(() => {
      const temp = Math.floor(Math.random() * sides) + 1
      setDiceResult(`🎲 ${sides}面骰：${temp}`)
      count++
      if (count >= 10) {
        clearInterval(interval)
        setIsRollingDice(false)
        triggerHaptic('light')
      }
    }, 60)
  }

  function flipCoin() {
    if (isFlippingCoin) return
    setIsFlippingCoin(true)
    playSound('coin')
    triggerHaptic('medium')
    setCoinResult('🪙 翻轉中...')
    const nextDegree = coinDegree + 720 + (Math.random() < 0.5 ? 0 : 180)
    setCoinDegree(nextDegree)

    setTimeout(() => {
      const outcome = (nextDegree % 360 === 0) ? '🪙 正面（人頭）' : '🪙 反面（字）'
      setCoinResult(outcome)
      setIsFlippingCoin(false)
      triggerHaptic('light')
    }, 600)
  }

  function handleSplitTeams() {
    triggerHaptic('medium')
    if (sharedPlayers.length < 2) return alert('至少需要 2 位玩家才能分隊！')
    const shuffled = [...sharedPlayers].sort(() => Math.random() - 0.5)
    const mid = Math.ceil(shuffled.length / 2)
    setTeamA(shuffled.slice(0, mid))
    setTeamB(shuffled.slice(mid))
  }

  function chooseRandomWithAnimation() {
    const pool = filteredGames.length > 0 ? filteredGames : games
    if (pool.length === 0) return alert('⚠️ 目前篩選條件下沒有桌遊可抽取！')

    setIsRevealed(false)
    setIsShuffling(true)
    triggerHaptic('medium')
    playSound('flip')

    const picked = pool[Math.floor(Math.random() * pool.length)]
    setRandomGame(picked)

    setTimeout(() => {
      setIsShuffling(false)
      setIsRevealed(true)
      playSound('victory')
      triggerHaptic('heavy')
    }, 700)
  }

  function handleAdminToggle() {
    triggerHaptic('light')
    if (isAdmin) {
      setIsAdmin(false)
      alert('🔒 已退出管理模式！')
      return
    }
    const inputPass = prompt('🔑 請輸入管理者密碼：')
    if (inputPass === ADMIN_PASSWORD) {
      setIsAdmin(true)
      alert('🔓 驗證成功！已進入管理編輯模式。')
    } else if (inputPass !== null) {
      alert('❌ 密碼錯誤！')
    }
  }

  function handleOpenAddModal() {
    if (!isAdmin) return
    triggerHaptic('light')
    setEditingId(null)
    setFormData(emptyForm)
    setSleeveList([{ size: '63.5x88 mm', count: '' }])
    setParentSearchInput('')
    setShowModal(true)
  }

  function handleOpenEditModal(game) {
    if (!isAdmin) return
    triggerHaptic('light')
    setEditingId(game.id)
    let gType = 'main'
    if (game.isExpansion) gType = 'expansion'
    else if (game.isSequel) gType = 'sequel'

    const parentGame = games.find(g => g.id === game.parentId)

    // 動態拆解牌套
    if (game.sleeveSize) {
      const parsed = game.sleeveSize.split(',').map(s => {
        const item = s.trim()
        const countMatch = item.match(/\((\d+)張\)/)
        const sizeOnly = item.replace(/\s*\(\d+張\)/, '').trim()
        return {
          size: sizeOnly || '63.5x88 mm',
          count: countMatch ? countMatch[1] : ''
        }
      })
      setSleeveList(parsed.length > 0 ? parsed : [{ size: '63.5x88 mm', count: '' }])
    } else {
      setSleeveList([{ size: '63.5x88 mm', count: '' }])
    }

    setFormData({
      name: game.name || '',
      englishName: game.englishName || '',
      minPlayers: game.minPlayers || 2,
      maxPlayers: game.maxPlayers || 4,
      bestPlayers: game.bestPlayers || '',
      time: game.time || 30,
      category: game.category || '派對',
      rating: game.rating ? Number(game.rating).toFixed(2) : '8.00',
      complexity: game.complexity ? Number(game.complexity).toFixed(2) : '2.00',
      emoji: game.emoji || '🎲',
      imageUrl: game.imageUrl || '',
      tagsInput: Array.isArray(game.tags) ? game.tags.join(', ') : '',
      description: game.description || '',
      cheatSheet: game.cheatSheet || '',
      videoUrl: game.videoUrl || '',
      rulePdfUrl: game.rulePdfUrl || '',
      gameType: gType,
      parentId: game.parentId || ''
    })
    setParentSearchInput(parentGame ? parentGame.name : '')
    setShowModal(true)
  }

  async function handleSubmitForm(e) {
    e.preventDefault()
    triggerHaptic('medium')
    if (!formData.name.trim()) return alert('請填寫桌遊名稱！')

    // 組裝多組牌套規格 (方案一)
    const formattedSleeve = sleeveList
      .filter(s => s.size && s.size !== '')
      .map(s => s.count ? `${s.size} (${s.count}張)` : s.size)
      .join(', ')

    const tagsArray = formData.tagsInput.split(',').map(t => t.trim()).filter(t => t !== '')
    const isExpansion = formData.gameType === 'expansion'
    const isSequel = formData.gameType === 'sequel'

    const gamePayload = {
      name: formData.name,
      englishName: formData.englishName,
      minPlayers: parseInt(formData.minPlayers, 10) || 1,
      maxPlayers: parseInt(formData.maxPlayers, 10) || 4,
      bestPlayers: formData.bestPlayers.trim() || `${formData.minPlayers}-${formData.maxPlayers}`,
      time: parseInt(formData.time, 10) || 30,
      category: formData.category.trim() || '未分類',
      rating: parseFloat(Number(formData.rating).toFixed(2)) || 8.00,
      complexity: parseFloat(Number(formData.complexity).toFixed(2)) || 2.00,
      emoji: formData.emoji,
      imageUrl: formData.imageUrl,
      tags: tagsArray,
      description: formData.description,
      cheatSheet: formData.cheatSheet,
      videoUrl: formData.videoUrl,
      rulePdfUrl: formData.rulePdfUrl,
      isExpansion,
      isSequel,
      parentId: (isExpansion || isSequel) ? (parseInt(formData.parentId, 10) || null) : null,
      sleeveSize: formattedSleeve
    }

    if (editingId) {
      const { error } = await supabase.from('boardgames').update(gamePayload).eq('id', editingId)
      if (error) {
        alert('更新失敗：' + error.message)
      } else {
        setGames(games.map(g => g.id === editingId ? { ...g, ...gamePayload } : g))
        if (viewDetailGame && viewDetailGame.id === editingId) {
          setViewDetailGame({ ...viewDetailGame, ...gamePayload })
        }
        setShowModal(false)
      }
    } else {
      const { data, error } = await supabase.from('boardgames').insert([gamePayload]).select()
      if (error) {
        alert('新增失敗：' + error.message)
      } else if (data) {
        setGames([data[0], ...games])
        setShowModal(false)
      }
    }
  }

  async function handleDeleteGame(id, name) {
    if (!isAdmin) return
    triggerHaptic('medium')

    if (window.confirm(`確定要刪除「${name}」嗎？`)) {
      const { error } = await supabase.from('boardgames').delete().eq('id', id)
      if (error) {
        alert('刪除失敗：' + error.message)
      } else {
        setGames(games.filter(g => g.id !== id))
        if (viewDetailGame && viewDetailGame.id === id) setViewDetailGame(null)
      }
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span>🎲</span>
          <div>
            <strong>我的桌遊收藏庫</strong>
            <small>BOARD GAME COLLECTION</small>
          </div>
        </div>

        <div className="header-actions">
          {/* 主題切換 */}
          <select 
            className="theme-selector" 
            value={theme} 
            onChange={(e) => { triggerHaptic('light'); setTheme(e.target.value); }}
          >
            <option value="default">☀️ 淺色簡約</option>
            <option value="dark">🌙 柔和暗黑</option>
            <option value="forest">🌲 森之木質</option>
            <option value="medieval">🏰 中古世紀</option>
            <option value="cyberpunk">🌌 賽博龐克</option>
          </select>

          <button 
            type="button" 
            className="action-btn" 
            onClick={() => { triggerHaptic('light'); setSoundEnabled(!soundEnabled); }}
            title="聚會音效"
          >
            {soundEnabled ? '🔊 聲音開' : '🔇 靜音'}
          </button>

          {isAdmin && (
            <>
              <input 
                type="file" 
                accept=".json,application/json" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleImportJSON} 
              />
              <button type="button" className="action-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                📥 匯入 JSON
              </button>
            </>
          )}

          <button type="button" className="action-btn" onClick={handleExportJSON}>
            📤 匯出 JSON
          </button>

          <button 
            type="button" 
            className="action-btn" 
            onClick={handleAdminToggle}
            style={{ 
              backgroundColor: isAdmin ? '#EF4444' : 'var(--accent-blue)', 
              color: '#fff',
              border: 'none',
              fontWeight: 'bold'
            }}
          >
            {isAdmin ? '🔒 登出管理' : '🔑 站長登入'}
          </button>

          {isAdmin && (
            <button type="button" className="add-game-btn" onClick={handleOpenAddModal}>
              ➕ 新增桌遊
            </button>
          )}
        </div>
      </header>

      <main>
        {/* 橫幅區域 */}
        <section className="hero" id="hero-sec">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'flex-start', width: '100%' }}>
            <div className="hero-title-group">
              <span className="eyebrow" style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>MY BOARD GAME LIBRARY</span>
              <h1>今天聚會，<br /><span>玩哪一款？</span></h1>
            </div>
            
            {/* 統計篩選膠囊 */}
            <div className="hero-filter-group" style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', margin: '4px 0' }}>
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setExpansionFilter('all'); }}
                className={`stat-filter-btn ${expansionFilter === 'all' ? 'active-all' : ''}`}
              >
                <span>📦</span>
                <div style={{ textAlign: 'left', pointerEvents: 'none' }}>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>總收藏量</div>
                  <div style={{ fontWeight: '800', color: 'var(--accent-blue)' }}>
                    {totalCount} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>款</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setExpansionFilter(expansionFilter === 'main' ? 'all' : 'main'); }}
                className={`stat-filter-btn ${expansionFilter === 'main' ? 'active-main' : ''}`}
              >
                <span>🎮</span>
                <div style={{ textAlign: 'left', pointerEvents: 'none' }}>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>主遊戲</div>
                  <div style={{ fontWeight: '800', color: '#10B981' }}>
                    {mainCount} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>款</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setExpansionFilter(expansionFilter === 'expansion' ? 'all' : 'expansion'); }}
                className={`stat-filter-btn ${expansionFilter === 'expansion' ? 'active-expansion' : ''}`}
              >
                <span>🧩</span>
                <div style={{ textAlign: 'left', pointerEvents: 'none' }}>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>擴充包</div>
                  <div style={{ fontWeight: '800', color: '#D97706' }}>
                    {expansionCount} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>款</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setExpansionFilter(expansionFilter === 'favorite' ? 'all' : 'favorite'); }}
                className={`stat-filter-btn ${expansionFilter === 'favorite' ? 'active-favorite' : ''}`}
              >
                <span>❤️</span>
                <div style={{ textAlign: 'left', pointerEvents: 'none' }}>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>我的最愛</div>
                  <div style={{ fontWeight: '800', color: '#E11D48' }}>
                    {favoriteCount} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>款</span>
                  </div>
                </div>
              </button>
            </div>

            <button 
              type="button" 
              className={`random-button ${isShuffling ? 'spinning' : ''}`} 
              onClick={chooseRandomWithAnimation} 
              disabled={isShuffling}
            >
              {isShuffling ? '🎴 命運洗牌中...' : '🎲 幫我選一款桌遊'}
            </button>
          </div>

          {/* 右側小工具卡片 */}
          <div className="starter-card" style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '1.4rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)',
            position: 'relative',
            overflowX: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              background: 'rgba(0,0,0,0.05)',
              padding: '6px',
              borderRadius: '14px',
              marginBottom: '14px'
            }}>
              {[
                { key: 'starter', label: '👑 先攻' },
                { key: 'scoreboard', label: '📝 計分' },
                { key: 'timer', label: '⏱️ 倒數' },
                { key: 'dice', label: '🎲 骰子' },
                { key: 'team', label: '⚔️ 分隊' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { triggerHaptic('light'); setWidgetTab(tab.key); }}
                  style={{
                    flex: '1 1 calc(20% - 6px)',
                    minWidth: '54px',
                    padding: '6px 4px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: widgetTab === tab.key ? 'var(--accent-blue)' : 'transparent',
                    color: widgetTab === tab.key ? '#fff' : 'inherit',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 1. 先攻 */}
            {widgetTab === 'starter' && (
              <>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', minHeight: '36px', marginBottom: '12px', alignItems: 'center' }}>
                  {sharedPlayers.map((p) => (
                    <span 
                      key={p.id}
                      onClick={() => handleRemoveSharedPlayer(p.id)}
                      title="點擊刪除此玩家"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: starterWinner === p.name ? 'var(--accent-blue)' : 'var(--pill-bg)',
                        color: starterWinner === p.name ? '#ffffff' : 'inherit',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: starterWinner === p.name ? '700' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: starterWinner === p.name ? '1px solid var(--accent-blue)' : '1px solid transparent'
                      }}
                    >
                      {p.name} ✕
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddSharedPlayer} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="輸入玩家名字..." 
                    value={inputPlayerName} 
                    onChange={(e) => setInputPlayerName(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: '10px', border: '1px solid var(--input-border)', background: 'var(--bg-main)', color: 'inherit', fontSize: '0.85rem', outline: 'none' }}
                  />
                  <button 
                    type="submit" 
                    style={{ background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: '10px', padding: '7px 12px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    + 加入
                  </button>
                </form>

                <div style={{
                  background: isPickingStarter ? 'rgba(79, 70, 229, 0.05)' : (starterWinner ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.02)'),
                  border: starterWinner && !isPickingStarter ? '1px dashed #10B981' : '1px dashed var(--input-border)',
                  borderRadius: '12px',
                  padding: '10px',
                  textAlign: 'center',
                  marginBottom: '12px'
                }}>
                  {isPickingStarter && <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>🎲 輪動中... {starterWinner}</div>}
                  {!isPickingStarter && starterWinner && <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#059669' }}>🎉 先攻由 <u>{starterWinner}</u> 開始！</div>}
                  {!isPickingStarter && !starterWinner && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>點擊下方按鈕選出首位玩家！</div>}
                </div>

                <button 
                  type="button" 
                  onClick={pickStarterPlayer} 
                  disabled={isPickingStarter}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--accent-blue) 0%, #3B82F6 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    cursor: isPickingStarter ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  {isPickingStarter ? '⚡ 決定中...' : '🎯 抽出起始玩家'}
                </button>
              </>
            )}

            {/* 2. 計分 */}
            {widgetTab === 'scoreboard' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>快速重設：</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button type="button" onClick={() => resetAllScores(0)} style={{ padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', fontSize: '0.75rem', cursor: 'pointer' }}>歸零</button>
                    <button type="button" onClick={() => resetAllScores(10)} style={{ padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', fontSize: '0.75rem', cursor: 'pointer' }}>10血</button>
                    <button type="button" onClick={() => resetAllScores(20)} style={{ padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', fontSize: '0.75rem', cursor: 'pointer' }}>20血</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {sharedPlayers.map(p => (
                    <div 
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(0,0,0,0.03)',
                        borderRadius: '10px',
                        padding: '6px 10px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span 
                          onClick={() => handleRemoveSharedPlayer(p.id)} 
                          style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }} 
                          title="刪除玩家"
                        >
                          ✕
                        </span>
                        <strong style={{ fontSize: '0.88rem' }}>{p.name}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button type="button" onClick={() => changeScore(p.id, -5)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#FEE2E2', color: '#DC2626', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>-5</button>
                        <button type="button" onClick={() => changeScore(p.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#FEE2E2', color: '#DC2626', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>-1</button>
                        
                        <span style={{ 
                          minWidth: '36px', 
                          textAlign: 'center', 
                          fontWeight: '800', 
                          fontSize: '1rem',
                          color: p.score < 0 ? '#EF4444' : (p.score > 0 ? '#10B981' : 'inherit')
                        }}>
                          {p.score}
                        </span>

                        <button type="button" onClick={() => changeScore(p.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#D1FAE5', color: '#059669', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>+1</button>
                        <button type="button" onClick={() => changeScore(p.id, 5)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#D1FAE5', color: '#059669', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>+5</button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSharedPlayer} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="新增玩家 (兩邊同步)..." 
                    value={inputPlayerName} 
                    onChange={(e) => setInputPlayerName(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: '10px', border: '1px solid var(--input-border)', background: 'var(--bg-main)', color: 'inherit', fontSize: '0.85rem', outline: 'none' }}
                  />
                  <button 
                    type="submit" 
                    style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: '10px', padding: '7px 12px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    + 新增
                  </button>
                </form>
              </>
            )}

            {/* 3. 倒數計時 */}
            {widgetTab === 'timer' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', marginBottom: '14px' }}>
                  <button type="button" onClick={() => { triggerHaptic('light'); setTimeLeft(30); setTimerRunning(false); }} style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '0.75rem' }}>30秒</button>
                  <button type="button" onClick={() => { triggerHaptic('light'); setTimeLeft(60); setTimerRunning(false); }} style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '0.75rem' }}>60秒</button>
                  <button type="button" onClick={() => { triggerHaptic('light'); setTimeLeft(120); setTimerRunning(false); }} style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '0.75rem' }}>2分鐘</button>
                  <button type="button" onClick={() => { triggerHaptic('light'); setTimeLeft(300); setTimerRunning(false); }} style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '0.75rem' }}>5分鐘</button>
                  <button type="button" onClick={() => { triggerHaptic('light'); setTimeLeft(600); setTimerRunning(false); }} style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '0.75rem' }}>10分鐘</button>
                </div>

                <div style={{
                  fontSize: '3rem',
                  fontWeight: '900',
                  margin: '10px 0',
                  fontFamily: 'monospace',
                  color: timeLeft <= 10 ? '#EF4444' : 'var(--accent-blue)'
                }}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('medium'); setTimerRunning(!timerRunning); }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      background: timerRunning ? '#F59E0B' : '#10B981',
                      color: '#fff',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {timerRunning ? '⏸️ 暫停' : '▶️ 開始倒數'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setTimerRunning(false); setTimeLeft(60); }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    🔄 重設
                  </button>
                </div>
              </div>
            )}

            {/* 4. 骰子與硬幣 */}
            {widgetTab === 'dice' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-blue)', minHeight: '30px' }}>{diceResult}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '10px' }}>
                    <button type="button" onClick={() => rollDice(6)} disabled={isRollingDice} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'var(--accent-blue)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>🎲 6面骰</button>
                    <button type="button" onClick={() => rollDice(8)} disabled={isRollingDice} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#6366F1', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>🎲 8面骰</button>
                    <button type="button" onClick={() => rollDice(10)} disabled={isRollingDice} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#3B82F6', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>🎲 10面骰</button>
                    <button type="button" onClick={() => rollDice(20)} disabled={isRollingDice} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#0EA5E9', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>🎲 20面骰</button>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '12px' }}>
                  <div style={{
                    display: 'inline-block',
                    fontSize: '2.5rem',
                    transition: 'transform 0.6s cubic-bezier(0.4, 2, 0.3, 1)',
                    transform: `rotateY(${coinDegree}deg)`
                  }}>
                    🪙
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#D97706', marginTop: '4px' }}>{coinResult}</div>
                  <button 
                    type="button" 
                    onClick={flipCoin} 
                    disabled={isFlippingCoin}
                    style={{
                      marginTop: '8px',
                      padding: '7px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#F59E0B',
                      color: '#fff',
                      fontWeight: 'bold',
                      cursor: isFlippingCoin ? 'not-allowed' : 'pointer',
                      fontSize: '0.88rem'
                    }}
                  >
                    {isFlippingCoin ? '💫 翻轉中...' : '🪙 投擲硬幣'}
                  </button>
                </div>
              </div>
            )}

            {/* 5. 分隊 */}
            {widgetTab === 'team' && (
              <div>
                <button 
                  type="button" 
                  onClick={handleSplitTeams} 
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--accent-blue) 0%, #3B82F6 100%)',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                    marginBottom: '12px'
                  }}
                >
                  ⚖️ 將玩家隨機均分兩隊
                </button>

                {teamA.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                      <strong style={{ color: '#2563EB', display: 'block', marginBottom: '4px' }}>🔵 藍隊 ({teamA.length}人)：</strong>
                      <div style={{ lineHeight: '1.4' }}>{teamA.map(p => p.name).join('、')}</div>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                      <strong style={{ color: '#DC2626', display: 'block', marginBottom: '4px' }}>🔴 紅隊 ({teamB.length}人)：</strong>
                      <div style={{ lineHeight: '1.4' }}>{teamB.map(p => p.name).join('、')}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                    將使用目前已輸入的 {sharedPlayers.length} 位玩家進行自動分隊！
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 篩選面板 */}
        <section className="filter-panel" id="collection-sec">
          <div className="filter-row">
            <div className="search-box">
              <span>🔍</span>
              <input type="text" placeholder="搜尋桌遊名稱/英文..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="filter-group">
              <label>👥 可玩人數：</label>
              <select value={playerFilter} onChange={(e) => { triggerHaptic('light'); setPlayerFilter(e.target.value); }}>
                <option value="all">不限</option>
                <option value="2">2 人</option>
                <option value="3">3 人</option>
                <option value="4">4 人</option>
                <option value="5">5 人</option>
                <option value="6">6 人以上</option>
              </select>
            </div>

            <div className="filter-group">
              <label>👑 最佳人數：</label>
              <select value={bestPlayerFilter} onChange={(e) => { triggerHaptic('light'); setBestPlayerFilter(e.target.value); }}>
                <option value="all">不限</option>
                <option value="2">最佳 2 人</option>
                <option value="3">最佳 3 人</option>
                <option value="4">最佳 4 人</option>
                <option value="5">最佳 5 人</option>
                <option value="6">最佳 6 人</option>
                <option value="7">最佳 7 人</option>
                <option value="8">最佳 8 人</option>
              </select>
            </div>

            <div className="filter-group">
              <label>⏱️ 時間：</label>
              <select value={maxTimeFilter} onChange={(e) => { triggerHaptic('light'); setMaxTimeFilter(e.target.value); }}>
                <option value="all">不限</option>
                <option value="15">15 分鐘內</option>
                <option value="30">30 分鐘內</option>
              </select>
            </div>

            <div className="filter-group">
              <label>📊 排序：</label>
              <select value={sortBy} onChange={(e) => { triggerHaptic('light'); setSortBy(e.target.value); }}>
                <option value="rating-desc">⭐ 評分最高</option>
                <option value="time-asc">⏱️ 時間最短</option>
                <option value="complexity-asc">🧠 最易學入門</option>
              </select>
            </div>
          </div>

          <div className="category-bar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '14px 0 0 0' }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                type="button"
                className={`cat-btn ${category === cat ? 'active' : ''}`}
                onClick={() => { triggerHaptic('light'); setCategory(cat); }}
                style={{
                  borderRadius: '12px',
                  padding: '7px 16px',
                  fontSize: '0.92rem',
                  fontWeight: '600',
                  border: category === cat ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  backgroundColor: category === cat ? 'var(--accent-blue)' : 'var(--bg-card)',
                  color: category === cat ? '#ffffff' : 'inherit',
                  cursor: 'pointer',
                  boxShadow: category === cat ? '0 4px 12px rgba(79, 70, 229, 0.3)' : '0 2px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* 收藏列表 */}
        <section className="collection">
          <div className="game-grid">
            {filteredGames.map((game) => {
              const isFav = favorites.includes(game.id)
              return (
                <article className="game-card box-3d-card" key={game.id} onClick={() => { triggerHaptic('light'); setDetailTab('info'); setViewDetailGame(game); }}>
                  {/* 左上角愛心 */}
                  <button 
                    type="button" 
                    className="card-fav-btn" 
                    onClick={(e) => toggleFavorite(e, game.id)}
                    title={isFav ? "取消收藏" : "加入我的最愛"}
                  >
                    {isFav ? '❤️' : '🤍'}
                  </button>

                  <div className="cover">
                    {game.imageUrl ? (
                      <img src={game.imageUrl} alt={game.name} className="cover-img box-cover-img" />
                    ) : (
                      <span className="cover-emoji">{game.emoji}</span>
                    )}

                    {/* 右上角擴充/續作徽章 */}
                    <div className="badge-container">
                      {game.isExpansion && <span className="expansion-badge">🧩 擴充</span>}
                      {game.isSequel && <span className="sequel-badge">✨ 續作</span>}
                    </div>

                    <span className="category-tag">{game.category}</span>
                  </div>

                  <div className="game-info">
                    <h3>{game.name}</h3>
                    <p className="english">{game.englishName}</p>
                    
                    {Array.isArray(game.tags) && game.tags.length > 0 && (
                      <div className="card-tags" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '4px 0' }}>
                        {game.tags.map(t => (
                          <span key={t} style={{ fontSize: '11px', background: 'var(--pill-bg)', padding: '2px 6px', borderRadius: '4px' }}>#{t}</span>
                        ))}
                      </div>
                    )}

                    {/* 微型膠囊圖標 (Pill Badges) */}
                    <div className="pill-badges-row">
                      <span className="pill-badge">👥 {game.minPlayers}–{game.maxPlayers}人</span>
                      {game.bestPlayers && <span className="pill-badge best">👑 最佳{game.bestPlayers}人</span>}
                      <span className="pill-badge">⏱️ {game.time}分</span>
                    </div>

                    <div className="rating-complexity-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <div className="rating">⭐ <strong>{Number(game.rating || 0).toFixed(2)}</strong></div>
                      <div className="complexity-badge" style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                        🧠 燒腦: {Number(game.complexity || 2.00).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      {/* 手機專屬底部導覽列 (Bottom Nav) */}
      <nav className="bottom-nav-bar">
        <button 
          type="button" 
          className="bottom-nav-item active" 
          onClick={() => { triggerHaptic('light'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <span>📦</span>
          收藏庫
        </button>
        <button 
          type="button" 
          className="bottom-nav-item" 
          onClick={() => {
            triggerHaptic('light')
            const heroSec = document.getElementById('hero-sec')
            if (heroSec) heroSec.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <span>🎲</span>
          隨機選
        </button>
        <button 
          type="button" 
          className="bottom-nav-item" 
          onClick={() => {
            triggerHaptic('light')
            const themes = ['default', 'dark', 'forest', 'medieval', 'cyberpunk']
            const nextIdx = (themes.indexOf(theme) + 1) % themes.length
            setTheme(themes[nextIdx])
          }}
        >
          <span>🎨</span>
          換主題
        </button>
      </nav>

      {/* 3D 抽卡立體翻面彈窗 */}
      {randomGame && (
        <div className="modal-overlay" onClick={() => !isShuffling && setRandomGame(null)}>
          <div 
            className="detail-modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              textAlign: 'center', 
              maxWidth: '380px', 
              padding: '1.8rem 1.4rem', 
              borderRadius: '24px',
              perspective: '1200px'
            }}
          >
            <button className="close-detail-btn" onClick={() => setRandomGame(null)} disabled={isShuffling}>
              ✕
            </button>

            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-blue)', letterSpacing: '1px' }}>
              {isShuffling ? '🎴 命運牌堆洗牌中...' : '✨ 命中注定就是它！'}
            </span>

            <div className={`card-flip-scene ${isShuffling ? 'shuffle-shake' : ''}`} style={{ margin: '1.2rem auto' }}>
              <div className={`card-flip-inner ${isRevealed ? 'is-flipped' : ''}`}>
                <div className="card-face card-face-back">
                  <div className="card-back-pattern">
                    <span style={{ fontSize: '3rem' }}>🔮</span>
                    <strong style={{ fontSize: '0.9rem', color: '#CBD5E1', letterSpacing: '2px' }}>DESTINY</strong>
                  </div>
                </div>

                <div className="card-face card-face-front" style={{ padding: '12px 10px', height: '100%' }}>
                  <div style={{ flex: 1, width: '100%', minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                    {randomGame.imageUrl ? (
                      <img src={randomGame.imageUrl} alt={randomGame.name} style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                    ) : (
                      <span style={{ fontSize: '3.8rem' }}>{randomGame.emoji || '🎲'}</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', margin: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{randomGame.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 8px 0', width: '100%' }}>{randomGame.englishName}</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', width: '100%', marginBottom: '4px' }}>
                    <span>👥 {randomGame.minPlayers}–{randomGame.maxPlayers}人</span>
                    <span>⏱️ {randomGame.time}分</span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>🧠 {Number(randomGame.complexity || 2.00).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '1.2rem' }}>
              <button 
                type="button" 
                onClick={chooseRandomWithAnimation} 
                disabled={isShuffling}
                style={{
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '10px 20px',
                  fontWeight: 'bold',
                  fontSize: '0.88rem',
                  cursor: isShuffling ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                }}
              >
                {isShuffling ? '抽卡中...' : '🎲 再抽一次'}
              </button>
              
              <button 
                type="button" 
                onClick={() => {
                  triggerHaptic('light')
                  const target = randomGame
                  setRandomGame(null)
                  setDetailTab('info')
                  setViewDetailGame(target)
                }}
                disabled={isShuffling}
                style={{
                  background: '#10B981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '10px 20px',
                  fontWeight: 'bold',
                  fontSize: '0.88rem',
                  cursor: isShuffling ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                📖 查看詳情
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細資料 Modal */}
      {viewDetailGame && (
        <div className="modal-overlay" onClick={() => setViewDetailGame(null)}>
          <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-detail-btn" onClick={() => setViewDetailGame(null)}>✕</button>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setDetailTab('info'); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: detailTab === 'info' ? 'var(--accent-blue)' : 'var(--pill-bg)',
                  color: detailTab === 'info' ? '#fff' : 'inherit',
                  fontSize: '0.9rem'
                }}
              >
                📖 遊戲介紹
              </button>
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setDetailTab('cheatSheet'); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: detailTab === 'cheatSheet' ? '#10B981' : 'var(--pill-bg)',
                  color: detailTab === 'cheatSheet' ? '#fff' : 'inherit',
                  fontSize: '0.9rem'
                }}
              >
                ⚡ 快速規則 / 提示卡
              </button>
            </div>
            
            {detailTab === 'info' ? (
              <>
                {viewDetailGame.imageUrl && (
                  <img 
                    src={viewDetailGame.imageUrl} 
                    alt={viewDetailGame.name} 
                    style={{ 
                      width: '100%', 
                      maxHeight: '320px', 
                      objectFit: 'contain', 
                      borderRadius: '12px', 
                      marginBottom: '14px',
                      display: 'block'
                    }} 
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <h2>{viewDetailGame.emoji} {viewDetailGame.name}</h2>
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(e, viewDetailGame.id)}
                    style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer' }}
                    title={favorites.includes(viewDetailGame.id) ? "取消最愛" : "加入最愛"}
                  >
                    {favorites.includes(viewDetailGame.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                <p className="detail-english">{viewDetailGame.englishName}</p>
                
                <div style={{ display: 'flex', gap: '12px', margin: '12px 0', fontSize: '14px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>👥 可玩人數：{viewDetailGame.minPlayers}–{viewDetailGame.maxPlayers} 人</span>
                  <span style={{ color: '#D97706', fontWeight: 'bold' }}>👑 最佳人數：{viewDetailGame.bestPlayers || '未設定'} 人</span>
                  <span>⏱️ 時間：{viewDetailGame.time} 分鐘</span>
                  <span>⭐ 評分：{Number(viewDetailGame.rating || 0).toFixed(2)} 分</span>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>🧠 燒腦指數：{Number(viewDetailGame.complexity || 2.00).toFixed(2)} / 5.00</span>
                </div>

                {/* 牌套尺寸顯示 */}
                {viewDetailGame.sleeveSize && (
                  <div style={{ margin: '8px 0 12px 0', padding: '8px 12px', background: 'var(--pill-bg)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem' }}>🃏</span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--accent-blue)' }}>牌套規格：</strong>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{viewDetailGame.sleeveSize}</span>
                  </div>
                )}

                {/* 說明書 PDF 與教學影片 */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '10px 0' }}>
                  {viewDetailGame.rulePdfUrl && (
                    <a href={viewDetailGame.rulePdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '6px 14px', background: '#0284c7', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      📄 官方說明書 (PDF)
                    </a>
                  )}
                  {viewDetailGame.videoUrl && (
                    <a href={viewDetailGame.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '6px 14px', background: '#FF0000', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      🎬 觀看教學影片
                    </a>
                  )}
                </div>

                {/* 擴充包提示 */}
                {viewDetailGame.isExpansion && viewDetailGame.parentId && (
                  <div style={{ margin: '12px 0', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.88rem', color: '#B45309', fontWeight: 'bold' }}>
                      🧩 此為擴充包，需搭配主遊戲遊玩
                    </span>
                    {games.find(g => g.id === viewDetailGame.parentId) && (
                      <button
                        type="button"
                        onClick={() => { triggerHaptic('light'); setViewDetailGame(games.find(g => g.id === viewDetailGame.parentId)); }}
                        style={{
                          border: 'none',
                          background: '#F59E0B',
                          color: '#fff',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: 'bold'
                        }}
                      >
                        📦 查看主遊戲：{games.find(g => g.id === viewDetailGame.parentId).name} →
                      </button>
                    )}
                  </div>
                )}

                {/* 獨立續作提示 */}
                {viewDetailGame.isSequel && (
                  <div style={{ margin: '12px 0', padding: '10px 14px', background: 'rgba(14, 165, 233, 0.08)', borderRadius: '10px', border: '1px solid rgba(14, 165, 233, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.88rem', color: '#0369A1', fontWeight: 'bold' }}>
                      ✨ 獨立續作：可單獨遊玩，亦可與前作混合！
                    </span>
                    {viewDetailGame.parentId && games.find(g => g.id === viewDetailGame.parentId) && (
                      <button
                        type="button"
                        onClick={() => { triggerHaptic('light'); setViewDetailGame(games.find(g => g.id === viewDetailGame.parentId)); }}
                        style={{
                          border: 'none',
                          background: '#0EA5E9',
                          color: '#fff',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: 'bold'
                        }}
                      >
                        📦 查看關聯前作：{games.find(g => g.id === viewDetailGame.parentId).name} →
                      </button>
                    )}
                  </div>
                )}

                {Array.isArray(viewDetailGame.tags) && viewDetailGame.tags.length > 0 && (
                  <div style={{ margin: '8px 0', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {viewDetailGame.tags.map(t => (
                      <span key={t} style={{ background: 'var(--accent-blue)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>#{t}</span>
                    ))}
                  </div>
                )}

                <p style={{ lineHeight: '1.6', margin: '12px 0' }}>{viewDetailGame.description || '暫無詳細描述。'}</p>

                {games.filter(g => g.parentId === viewDetailGame.id).length > 0 && (
                  <div className="expansion-list" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>🧩 關聯作品 / 擴充包（點擊查看詳情）：</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {games.filter(g => g.parentId === viewDetailGame.id).map(exp => (
                        <button
                          key={exp.id}
                          type="button"
                          onClick={() => { triggerHaptic('light'); setViewDetailGame(exp); }}
                          style={{
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'inherit',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: '500'
                          }}
                        >
                          {exp.isSequel ? '✨' : '🧩'} {exp.name} →
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="detail-admin-bar">
                    <button 
                      type="button" 
                      onClick={() => handleOpenEditModal(viewDetailGame)}
                      style={{ background: 'var(--accent-blue)', color: '#fff' }}
                    >
                      ✏️ 編輯桌遊
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteGame(viewDetailGame.id, viewDetailGame.name)}
                      style={{ background: '#EF4444', color: '#fff' }}
                    >
                      🗑️ 刪除桌遊
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '4px 0' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#10B981' }}>⚡ {viewDetailGame.name} 快速提示卡</h3>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px dashed #10B981',
                  borderRadius: '12px',
                  padding: '16px',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.7',
                  fontSize: '0.95rem'
                }}>
                  {viewDetailGame.cheatSheet ? viewDetailGame.cheatSheet : '📌 目前尚未建立這款遊戲的快速規則提示，站長可透過「編輯桌遊」隨時補上開局重點！'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 新增/編輯 Modal (工整滿版 + 動態牌套增刪 + 官方說明書連結) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? '✏️ 編輯桌遊' : '➕ 新增桌遊'}</h2>
            
            <form onSubmit={handleSubmitForm}>
              <div className="form-group">
                <label>中文名稱 *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="form-group">
                <label>英文名稱</label>
                <input type="text" value={formData.englishName} onChange={(e) => setFormData({...formData, englishName: e.target.value})} />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label>最小人數</label>
                  <input type="number" min="1" value={formData.minPlayers} onChange={(e) => setFormData({...formData, minPlayers: e.target.value})} />
                </div>
                <div>
                  <label>最大人數</label>
                  <input type="number" min="1" value={formData.maxPlayers} onChange={(e) => setFormData({...formData, maxPlayers: e.target.value})} />
                </div>
                <div>
                  <label>👑 最佳人數</label>
                  <input type="text" placeholder="例: 4 或 4-6" value={formData.bestPlayers} onChange={(e) => setFormData({...formData, bestPlayers: e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label>遊戲時間 (分鐘)</label>
                  <input type="number" step="5" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                </div>
                <div>
                  <label>⭐ 評分 (0.00~10.00)</label>
                  <input type="number" step="0.01" min="0.00" max="10.00" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} />
                </div>
                <div>
                  <label>🧠 燒腦度 (1.00~5.00)</label>
                  <input type="number" step="0.01" min="1.00" max="5.00" value={formData.complexity} onChange={(e) => setFormData({...formData, complexity: e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label>分類 (可手動輸入)</label>
                  <input 
                    type="text" 
                    list="category-options" 
                    placeholder="選擇或自由輸入類型" 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  />
                  <datalist id="category-options">
                    {categories.filter(c => c !== '全部').map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label>Emoji 圖示</label>
                  <input type="text" value={formData.emoji} onChange={(e) => setFormData({...formData, emoji: e.target.value})} />
                </div>
              </div>

              {/* 牌套多組動態管理 (方案一：選尺寸 + 張數，排版舒適滿版) */}
              <div className="sleeve-manager-box">
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.92rem' }}>
                  🃏 牌套規格管理（棋寶常用尺寸 + 張數）：
                </label>

                {sleeveList.map((item, idx) => (
                  <div key={idx} className="sleeve-row-item">
                    <select 
                      value={item.size} 
                      onChange={(e) => updateSleeveRow(idx, 'size', e.target.value)}
                    >
                      {CHESURE_SLEEVE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>

                    <input 
                      type="number" 
                      placeholder="張數 (例: 110)" 
                      value={item.count} 
                      onChange={(e) => updateSleeveRow(idx, 'count', e.target.value)}
                    />

                    {sleeveList.length > 1 && (
                      <button type="button" className="sleeve-remove-btn" onClick={() => removeSleeveRow(idx)}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button type="button" className="sleeve-add-btn" onClick={addSleeveRow}>
                  + 新增另一種牌套尺寸
                </button>
              </div>

              {/* 說明書 PDF 網址 */}
              <div className="form-group">
                <label>📄 官方規則說明書連結 (PDF 網址)</label>
                <input 
                  type="url" 
                  placeholder="https://example.com/rules.pdf" 
                  value={formData.rulePdfUrl} 
                  onChange={(e) => setFormData({...formData, rulePdfUrl: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label>📷 封面圖片網址 (Image URL)</label>
                <input type="url" placeholder="https://example.com/image.jpg" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
              </div>

              <div className="form-group">
                <label>或 上傳圖片 (自動縮放不裁切)</label>
                <input type="file" accept="image/*" onChange={handleCroppedImageUpload} />
              </div>

              <div className="form-group">
                <label>🏷️ 標籤 (以逗號分隔，例如: 新手推薦, 快節奏)</label>
                <input type="text" placeholder="例如: 派對, 爆笑, 雙人首選" value={formData.tagsInput} onChange={(e) => setFormData({...formData, tagsInput: e.target.value})} />
              </div>

              <div className="form-group">
                <label>🎬 教學影片連結 (YouTube 網址)</label>
                <input type="url" placeholder="https://www.youtube.com/..." value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} />
              </div>

              <div className="form-group">
                <label>📝 遊戲介紹 / 玩法簡介</label>
                <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
              </div>

              <div className="form-group">
                <label>⚡ 快速規則 / 提示卡重點 (Cheat Sheet)</label>
                <textarea rows="4" placeholder="每行輸入一條開局重點或關鍵規則..." value={formData.cheatSheet} onChange={(e) => setFormData({...formData, cheatSheet: e.target.value})} style={{ border: '1px solid #10B981', background: 'rgba(16, 185, 129, 0.02)' }}></textarea>
              </div>

              {/* 遊戲本體類型下拉選單 + 打字搜尋前作 */}
              <div className="form-group" style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '10px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '6px' }}>📦 遊戲本體類型：</label>
                <select 
                  value={formData.gameType} 
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData(prev => ({
                      ...prev,
                      gameType: val,
                      parentId: val === 'main' ? '' : prev.parentId
                    }))
                    if (val === 'main') setParentSearchInput('')
                  }}
                  style={{ marginBottom: '8px' }}
                >
                  <option value="main">🎮 獨立主遊戲</option>
                  <option value="sequel">✨ 獨立續作 / 衍生作（可單獨玩）</option>
                  <option value="expansion">🧩 純擴充包（需搭配前作）</option>
                </select>

                {(formData.gameType === 'expansion' || formData.gameType === 'sequel') && (
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      {formData.gameType === 'expansion' ? '🔍 搜尋並選擇所屬主遊戲 *：' : '🔍 搜尋並選擇關聯前作（可選）：'}
                    </label>
                    <input 
                      type="text" 
                      list="parent-games-list" 
                      placeholder="輸入遊戲名稱關鍵字..."
                      value={parentSearchInput}
                      onChange={(e) => {
                        const val = e.target.value
                        setParentSearchInput(val)
                        const matched = games.find(g => g.name === val)
                        if (matched) {
                          setFormData(prev => ({ ...prev, parentId: matched.id }))
                        } else if (!val) {
                          setFormData(prev => ({ ...prev, parentId: '' }))
                        }
                      }}
                    />
                    <datalist id="parent-games-list">
                      {games.filter(g => !g.isExpansion && g.id !== editingId).map(g => (
                        <option key={g.id} value={g.name} />
                      ))}
                    </datalist>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="submit-btn">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}