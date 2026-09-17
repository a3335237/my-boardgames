import { useMemo, useState, useEffect, useRef } from 'react'
import './App.css'
// 1. 引入 Supabase 連線實體
import { supabase } from './supabaseClients'

// 預設 37 款桌遊資料（若 Supabase 為空可作為備用）
const initialGames = [
  { id: 1, name: '地城無雙 Dungeon Mayhem', englishName: 'Dungeon Mayhem', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 15, category: '卡牌對戰', rating: 8.0, emoji: '⚔️', imageUrl: '', tags: ['新手推薦', '快節奏'], description: '極度爽快的卡牌對戰遊戲，選好你的英雄，把其他對手打倒！', videoUrl: 'https://www.youtube.com/results?search_query=地城無雙+桌遊教學', isExpansion: false, parentId: null },
  { id: 2, name: '心靈同步', englishName: 'The Mind', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 20, category: '合作', rating: 8.1, emoji: '🧠', imageUrl: '', tags: ['默契考驗', '靜音遊戲'], description: '不能說話、不能打手勢，只能靠感覺依序打出數字牌！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 3, name: '機密代號：裡應外合', englishName: 'Codenames: Duet', minPlayers: 2, maxPlayers: 2, bestPlayers: '2', time: 25, category: '合作', rating: 8.3, emoji: '🕵️', imageUrl: '', tags: ['雙人首選', '聯想燒腦'], description: '雙人合作版的機密代號，透過一個詞彙給予提示，找出所有特務。', videoUrl: '', isExpansion: false, parentId: null },
  { id: 4, name: '格格不入', englishName: 'Blokus', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 30, category: '策略', rating: 7.8, emoji: '🟩', imageUrl: '', tags: ['抽象棋類', '易學難精'], description: '經典的版塊放置遊戲，盡可能把自己的方塊全部拼上棋盤！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 5, name: '璀璨寶石：漫威版', englishName: 'Splendor Marvel', minPlayers: 2, maxPlayers: 4, bestPlayers: '3-4', time: 40, category: '策略', rating: 8.4, emoji: '💎', imageUrl: '', tags: ['引擎建構', '漫威IP'], description: '招募超級英雄，收集無限寶石，搶先完成無限手套！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 6, name: '炸彈競技場：口袋版', englishName: 'Bomb Arena', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 20, category: '陣營', rating: 7.5, emoji: '💣', imageUrl: '', tags: ['快節奏', '互相傷害'], description: '炸彈隨時爆發，利用手中的牌轉移炸彈或陷害對手。', videoUrl: '', isExpansion: false, parentId: null },
  { id: 7, name: '三千世界鴉殺盡', englishName: 'Crow Killers', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 20, category: '派對', rating: 7.6, emoji: '🦅', imageUrl: '', tags: ['日系畫風', '心機'], description: '充滿日式風情的輕度心理戰遊戲。', videoUrl: '', isExpansion: false, parentId: null },
  { id: 8, name: '鴿爆了', englishName: 'Pigeon Explode', minPlayers: 2, maxPlayers: 5, bestPlayers: '4-5', time: 20, category: '派對', rating: 7.4, emoji: '🕊️', imageUrl: '', tags: ['派對', '搞笑'], description: '充滿歡笑與意外的派對卡牌遊戲。', videoUrl: '', isExpansion: false, parentId: null },
  { id: 9, name: '你是不是沒朋友', englishName: 'No Friends', minPlayers: 1, maxPlayers: 5, bestPlayers: '3-4', time: 25, category: '派對', rating: 7.3, emoji: '😜', imageUrl: '', tags: ['自嘲搞笑', '單人可玩'], description: '適合邊聊天邊玩的邊緣人派對桌遊。', videoUrl: '', isExpansion: false, parentId: null },
  { id: 10, name: '無限手套：情書', englishName: 'Infinity Gauntlet', minPlayers: 2, maxPlayers: 6, bestPlayers: '6', time: 15, category: '陣營', rating: 8.0, emoji: '🥊', imageUrl: '', tags: ['1對多', '陣營對決'], description: '一名玩家扮演薩諾斯，其他人扮演復仇者聯盟進行對決！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 11, name: '爆炸貓桌遊版', englishName: 'Exploding Kittens', minPlayers: 2, maxPlayers: 5, bestPlayers: '4-5', time: 15, category: '派對', rating: 7.8, emoji: '💥', imageUrl: '', tags: ['心機抽牌', '新手推薦'], description: '像俄羅斯輪盤一樣的抽牌遊戲，抽到爆炸貓就淘汰！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 12, name: '爆炸貓 + 黑洞貓擴充', englishName: 'Exploding Kittens: Streaking Kittens', minPlayers: 2, maxPlayers: 6, bestPlayers: '5-6', time: 20, category: '派對', rating: 8.0, emoji: '🐱', imageUrl: '', tags: ['擴充版', '更多玩法'], description: '加入了黑洞貓與更多特殊功能卡，讓遊戲更混亂更有趣！', videoUrl: '', isExpansion: true, parentId: 11 },
  { id: 13, name: '德國蟑螂 皇家版', englishName: 'Cockroach Poker Royal', minPlayers: 2, maxPlayers: 6, bestPlayers: '4-5', time: 20, category: '吹牛', rating: 7.9, emoji: '🪲', imageUrl: '', tags: ['經典吹牛', '看穿心機'], description: '看著對方的眼睛吹牛，皇家版多了皇冠動物與特殊卡牌！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 14, name: '字字轉機', englishName: 'Anomia', minPlayers: 3, maxPlayers: 6, bestPlayers: '4-6', time: 25, category: '派對', rating: 7.7, emoji: '🔤', imageUrl: '', tags: ['反應力', '聯想力'], description: '符號對對碰！當卡牌符號相同時，必須搶先喊出對方卡牌類別的單字！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 15, name: '夜市人蔘', englishName: 'Night Market', minPlayers: 2, maxPlayers: 6, bestPlayers: '4', time: 30, category: '輕策略', rating: 7.8, emoji: '🍢', imageUrl: '', tags: ['台灣在地', '美食擺攤'], description: '體驗台灣夜市擺攤樂趣！收集食材組合出美味的夜市小吃。', videoUrl: '', isExpansion: false, parentId: null },
  { id: 16, name: '搞怪運動會', englishName: 'Wacky Sports', minPlayers: 2, maxPlayers: 6, bestPlayers: '5-6', time: 20, category: '派對', rating: 7.2, emoji: '🏅', imageUrl: '', tags: ['歡樂動作', '派對爆笑'], description: '各種搞怪刺激的運動會項目，考驗大家的反應與肢體協調！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 17, name: '情書：六人版', englishName: 'Love Letter: Premium', minPlayers: 2, maxPlayers: 6, bestPlayers: '4', time: 20, category: '輕策略', rating: 8.0, emoji: '💌', imageUrl: '', tags: ['經典推理', '支援6人'], description: '手牌只有一張！利用角色能力猜測他人手牌並將情書送到公主手中。', videoUrl: '', isExpansion: false, parentId: null },
  { id: 18, name: '政變疑雲', englishName: 'Coup', minPlayers: 2, maxPlayers: 6, bestPlayers: '5-6', time: 15, category: '吹牛', rating: 8.1, emoji: '👑', imageUrl: '', tags: ['吹牛陣營', '快節奏'], description: '即使你沒有那個角色的能力，也可以假裝有！看誰能吹牛到最後。', videoUrl: '', isExpansion: false, parentId: null },
  { id: 19, name: '墨敵賽', englishName: 'Modisai', minPlayers: 2, maxPlayers: 5, bestPlayers: '3-4', time: 20, category: '輕策略', rating: 7.3, emoji: '🐙', imageUrl: '', tags: ['卡牌對決', '簡單易學'], description: '充滿戰略趣味的卡牌對決遊戲，運用墨水敵人打敗對手！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 20, name: '吸爆鬆餅', englishName: 'Pancake Stack', minPlayers: 2, maxPlayers: 5, time: 15, bestPlayers: '4-5', category: '派對', rating: 7.4, emoji: '🥞', imageUrl: '', tags: ['反應搶答', '輕鬆搞笑'], description: '疊高鬆餅吸爆對手！節奏快速且充滿歡笑的輕度派對遊戲。', videoUrl: '', isExpansion: false, parentId: null },
  { id: 21, name: '犯人在跳舞', englishName: 'Criminal Dance', minPlayers: 3, maxPlayers: 8, bestPlayers: '6-8', time: 15, category: '陣營', rating: 8.0, emoji: '🕺', imageUrl: '', tags: ['手牌交換', '新手必玩'], description: '犯人卡會在大家手中不斷轉移，偵探能否在遊戲結束前抓到犯人？', videoUrl: '', isExpansion: false, parentId: null },
  { id: 22, name: 'Who怕Who !?', englishName: 'Who Pa Who', minPlayers: 2, maxPlayers: 6, bestPlayers: '4-6', time: 20, category: '派對', rating: 7.3, emoji: '👊', imageUrl: '', tags: ['互相傷害', '熱鬧歡樂'], description: '充滿挑釁與互踩樂趣的歡樂派對卡牌遊戲！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 23, name: '神吐槽', englishName: 'God Reaction', minPlayers: 3, maxPlayers: 8, bestPlayers: '5-8', time: 25, category: '派對', rating: 7.8, emoji: '🗣️', imageUrl: '', tags: ['吐槽搞笑', '文字遊戲'], description: '面對各種奇葩情境，給出最具創意與爆點的神吐槽！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 24, name: '驚爆倫敦', englishName: 'Time Bomb', minPlayers: 4, maxPlayers: 8, bestPlayers: '6-8', time: 20, category: '陣營', rating: 8.2, emoji: '💣', imageUrl: '', tags: ['剪線炸彈', '陣營心機'], description: '福爾摩斯對決莫里亞蒂！剪對線解除炸彈，還是不小心引爆大樓？', videoUrl: '', isExpansion: false, parentId: null },
  { id: 25, name: '世界上有兩種人', englishName: 'Two Kinds of People', minPlayers: 2, maxPlayers: 8, bestPlayers: '5-8', time: 20, category: '派對', rating: 7.6, emoji: '☯️', imageUrl: '', tags: ['價值觀對立', '聊天神開場'], description: '香菜吃不吃？折摺還是捲牙膏？迅速了解朋友隱藏性格的派對遊戲！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 26, name: '瞎掰王：看圖掰', englishName: 'Fake That Picture', minPlayers: 3, maxPlayers: 9, bestPlayers: '5-8', time: 30, category: '吹牛', rating: 8.1, emoji: '🖼️', imageUrl: '', tags: ['看圖說故事', '胡說八道'], description: '看著怪異圖片發揮創意一本正經地胡說八道，騙過所有玩家！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 27, name: '腦洞量表：沒有下限', englishName: 'Top Ten Uncensored', minPlayers: 4, maxPlayers: 9, bestPlayers: '6-8', time: 30, category: '派對', rating: 8.3, emoji: '🔞', imageUrl: '', tags: ['限制級搞笑', '默契評估'], description: '腦洞量表無下限版！根據題目表演 1 到 10 的程度，越浮誇越好！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 28, name: '瞎掰王', englishName: 'Fake That', minPlayers: 3, maxPlayers: 9, bestPlayers: '5-8', time: 30, category: '吹牛', rating: 8.4, emoji: '🤥', imageUrl: '', tags: ['派對熱門', '一本正經胡說八道'], description: '只有一個人知道冷知識真相，其他人要發揮演技瞎掰搶答！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 29, name: '腦洞量表', englishName: 'Top Ten', minPlayers: 4, maxPlayers: 9, bestPlayers: '6-8', time: 30, category: '派對', rating: 8.2, emoji: '💡', imageUrl: '', tags: ['合作默契', '熱鬧歡樂'], description: '隊長提出題目，每個人根據手中的數字表演對應程度，讓隊長排序！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 30, name: '阿瓦隆', englishName: 'Avalon', minPlayers: 5, maxPlayers: 10, bestPlayers: '8-10', time: 30, category: '陣營', rating: 8.6, emoji: '🏰', imageUrl: '', tags: ['陣營必玩', '語言邏輯', '不淘汰'], description: '正義與邪惡陣營的經典對決，刺客與梅林的智力較量。', videoUrl: 'https://www.youtube.com/results?search_query=阿瓦隆+教學', isExpansion: false, parentId: null },
  { id: 31, name: '黃牌', englishName: 'Yellow Card', minPlayers: 3, maxPlayers: 10, bestPlayers: '6-10', time: 30, category: '派對', rating: 8.0, emoji: '🟨', imageUrl: '', tags: ['填空搞笑', '黃暴歡樂'], description: '填空題卡牌遊戲，用最無厘頭或地獄的答案獲得裁判青睞！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 32, name: '試個好遊戲', englishName: 'We Didn\'t Playtest This At All', minPlayers: 2, maxPlayers: 10, bestPlayers: '5-8', time: 5, category: '派對', rating: 7.5, emoji: '🃏', imageUrl: '', tags: ['超快節奏', '無厘頭勝負'], description: '幾秒鐘就能結束一局！規則隨時在變，抽到什麼牌就照著做。', videoUrl: '', isExpansion: false, parentId: null },
  { id: 33, name: '還試好遊戲', englishName: 'We Didn\'t Playtest This Either', minPlayers: 2, maxPlayers: 10, bestPlayers: '5-8', time: 5, category: '派對', rating: 7.5, emoji: '🎴', imageUrl: '', tags: ['續作擴充', '無厘頭'], description: '《試個好遊戲》續作，更多荒繆搞笑的勝利條件與淘汰規則！', videoUrl: '', isExpansion: true, parentId: 32 },
  { id: 34, name: '狼人真言', englishName: 'Werewords', minPlayers: 4, maxPlayers: 10, bestPlayers: '6-8', time: 10, category: '陣營', rating: 8.1, emoji: '🐺', imageUrl: '', tags: ['問答陣營', '快節奏推理'], description: '透過「是/否」問答猜出祕密詞彙，同時找出潛伏在人群中的狼人！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 35, name: '梗圖黃牌', englishName: 'Meme Yellow Card', minPlayers: 3, maxPlayers: 10, bestPlayers: '6-10', time: 30, category: '派對', rating: 8.1, emoji: '🖼️', imageUrl: '', tags: ['梗圖搭配', '地獄迷因'], description: '將熱門迷因梗圖搭配超欠扁台詞，製作出最搞笑的梗圖組合！', videoUrl: '', isExpansion: true, parentId: 31 },
  { id: 36, name: '獵巫鎮 1692', englishName: 'Salem 1692', minPlayers: 4, maxPlayers: 12, bestPlayers: '7-10', time: 30, category: '陣營', rating: 8.4, emoji: '🧹', imageUrl: '', tags: ['精美書本盒', '女巫審判'], description: '精美的暗黑歷史陣營遊戲，指控他人是女巫，在審判中存活下來！', videoUrl: '', isExpansion: false, parentId: null },
  { id: 37, name: '炸彈 boom', englishName: 'Boom Boom', minPlayers: 2, maxPlayers: 6, bestPlayers: '4-6', time: 15, category: '派對', rating: 7.2, emoji: '💥', imageUrl: '', tags: ['緊張刺激', '反應力'], description: '傳遞炸彈！在時間倒數結束前快速完成任務並把炸彈傳給下一個人。', videoUrl: '', isExpansion: false, parentId: null }
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
  rating: '8.0',
  emoji: '🎲',
  imageUrl: '',
  tagsInput: '',
  description: '',
  videoUrl: '',
  isExpansion: false,
  parentId: ''
}

export default function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  // 管理者權限模式狀態
  const [isAdmin, setIsAdmin] = useState(false)

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme_mode') === 'dark')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')
  
  // 支援多選標籤狀態
  const [selectedTags, setSelectedTags] = useState([])

  const [playerFilter, setPlayerFilter] = useState('all')
  const [bestPlayerFilter, setBestPlayerFilter] = useState('all')
  const [maxTimeFilter, setMaxTimeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rating-desc')

  // 轉盤抽桌遊狀態
  const [randomGame, setRandomGame] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)

  // 右側卡片內部分頁 ('starter' | 'scoreboard')
  const [widgetTab, setWidgetTab] = useState('starter')

  // 雙向同步的玩家狀態（姓名 + 分數）
  const [sharedPlayers, setSharedPlayers] = useState([
    { id: 1, name: '玩家 1', score: 0 },
    { id: 2, name: '玩家 2', score: 0 },
    { id: 3, name: '玩家 3', score: 0 },
    { id: 4, name: '玩家 4', score: 0 }
  ])
  const [inputPlayerName, setInputPlayerName] = useState('')
  const [starterWinner, setStarterWinner] = useState(null)
  const [isPickingStarter, setIsPickingStarter] = useState(false)

  // Modal 狀態
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [viewDetailGame, setViewDetailGame] = useState(null)

  // File Input Ref
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
    } else if (data) {
      setGames(data.length > 0 ? data : initialGames)
    }
    setLoading(false)
  }

  function handleAdminToggle() {
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

  // 同步玩家管理操作
  function handleAddSharedPlayer(e) {
    if (e) e.preventDefault()
    const name = inputPlayerName.trim()
    if (!name) return
    if (sharedPlayers.some(p => p.name === name)) return alert('玩家名稱已存在！')
    const newId = sharedPlayers.length > 0 ? Math.max(...sharedPlayers.map(p => p.id)) + 1 : 1
    setSharedPlayers([...sharedPlayers, { id: newId, name, score: 0 }])
    setInputPlayerName('')
  }

  function handleRemoveSharedPlayer(idToRemove) {
    if (sharedPlayers.length <= 1) return alert('至少保留 1 位玩家！')
    setSharedPlayers(sharedPlayers.filter(p => p.id !== idToRemove))
  }

  // 起始玩家抽取邏輯
  function pickStarterPlayer() {
    if (sharedPlayers.length < 2) return alert('請至少加入 2 位玩家！')
    setIsPickingStarter(true)
    setStarterWinner(null)

    let count = 0
    const interval = setInterval(() => {
      const tempIdx = Math.floor(Math.random() * sharedPlayers.length)
      setStarterWinner(sharedPlayers[tempIdx].name)
      count++
      if (count >= 16) {
        clearInterval(interval)
        setIsPickingStarter(false)
      }
    }, 80)
  }

  // 計分助手操作
  function changeScore(id, delta) {
    setSharedPlayers(sharedPlayers.map(p => p.id === id ? { ...p, score: p.score + delta } : p))
  }

  function resetAllScores(val = 0) {
    setSharedPlayers(sharedPlayers.map(p => ({ ...p, score: val })))
  }

  // 統計數量計算
  const totalCount = games.length
  const mainCount = games.filter(g => !g.isExpansion).length
  const expansionCount = games.filter(g => g.isExpansion).length

  // 動態生成所有「遊戲類型」
  const categories = useMemo(() => {
    const baseCategories = ['派對', '陣營', '吹牛', '合作', '策略', '輕策略', '卡牌對戰']
    const catSet = new Set(baseCategories)
    games.forEach(g => {
      if (g.category && g.category.trim() !== '') {
        catSet.add(g.category.trim())
      }
    })
    return ['全部', ...Array.from(catSet)]
  }, [games])

  // 所有標籤
  const allTags = useMemo(() => {
    const tagSet = new Set()
    games.forEach(g => {
      if (Array.isArray(g.tags)) {
        g.tags.forEach(t => tagSet.add(t))
      }
    })
    return Array.from(tagSet)
  }, [games])

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme')
      localStorage.setItem('theme_mode', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      localStorage.setItem('theme_mode', 'light')
    }
  }, [darkMode])

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

  function handleTagToggle(tag) {
    if (tag === '') {
      setSelectedTags([])
      return
    }
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    )
  }

  const filteredGames = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    let result = games.filter((game) => {
      const matchSearch =
        keyword === '' ||
        (game.name && game.name.toLowerCase().includes(keyword)) ||
        (game.englishName && game.englishName.toLowerCase().includes(keyword))

      const matchCategory = category === '全部' || game.category === category

      const matchTags =
        selectedTags.length === 0 ||
        (Array.isArray(game.tags) && selectedTags.every(t => game.tags.includes(t)))

      let matchPlayers = true
      if (playerFilter !== 'all') {
        const pCount = parseInt(playerFilter, 10)
        matchPlayers = pCount >= (game.minPlayers || 1) && pCount <= (game.maxPlayers || 99)
      }

      let matchBestPlayers = true
      if (bestPlayerFilter !== 'all') {
        const bCount = parseInt(bestPlayerFilter, 10)
        matchBestPlayers = isBestPlayerMatch(game.bestPlayers, bCount)
      }

      let matchTime = true
      if (maxTimeFilter !== 'all') {
        matchTime = (game.time || 0) <= parseInt(maxTimeFilter, 10)
      }

      return matchSearch && matchCategory && matchTags && matchPlayers && matchBestPlayers && matchTime
    })

    return result.sort((a, b) => {
      if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'time-asc') return (a.time || 0) - (b.time || 0)
      if (sortBy === 'players-desc') return (b.maxPlayers || 0) - (a.maxPlayers || 0)
      if (sortBy === 'newest') return b.id - a.id
      return 0
    })
  }, [games, search, category, selectedTags, playerFilter, bestPlayerFilter, maxTimeFilter, sortBy])

  function chooseRandomWithAnimation() {
    const pool = filteredGames.length > 0 ? filteredGames : games

    if (pool.length === 0) {
      alert('⚠️ 資料庫中尚無任何桌遊資料！')
      return
    }

    setIsSpinning(true)
    setRandomGame(pool[Math.floor(Math.random() * pool.length)])

    let count = 0
    const interval = setInterval(() => {
      const index = Math.floor(Math.random() * pool.length)
      setRandomGame(pool[index])
      count++
      if (count >= 16) {
        clearInterval(interval)
        setIsSpinning(false)
      }
    }, 80)
  }

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
        if (!Array.isArray(importedData)) {
          return alert('❌ 檔案格式不正確，必須是 JSON 陣列資料！')
        }

        if (!window.confirm(`確定要匯入 ${importedData.length} 款桌遊到雲端資料庫嗎？`)) {
          return
        }

        const cleanPayload = importedData.map(({ id, created_at, ...rest }) => ({
          ...rest,
          minPlayers: parseInt(rest.minPlayers, 10) || 1,
          maxPlayers: parseInt(rest.maxPlayers, 10) || 4,
          time: parseInt(rest.time, 10) || 30,
          rating: parseFloat(rest.rating) || 8.0,
          isExpansion: !!rest.isExpansion,
          parentId: rest.parentId ? parseInt(rest.parentId, 10) : null
        }))

        const { error } = await supabase.from('boardgames').insert(cleanPayload)

        if (error) {
          alert('❌ 匯入 Supabase 失敗：' + error.message)
        } else {
          alert(`✅ 成功將 ${cleanPayload.length} 款桌遊寫入雲端資料庫！`)
          fetchGamesFromSupabase()
        }
      } catch (err) {
        alert('❌ 解析 JSON 檔案失敗，請確認檔案內容！')
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
        const size = 400
        canvas.width = size
        canvas.height = size

        const minDim = Math.min(img.width, img.height)
        const sx = (img.width - minDim) / 2
        const sy = (img.height - minDim) / 2

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85)
        setFormData(prev => ({ ...prev, imageUrl: croppedBase64 }))
      }
    }
    reader.readAsDataURL(file)
  }

  function handleOpenAddModal() {
    if (!isAdmin) return
    setEditingId(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  function handleOpenEditModal(e, game) {
    e.stopPropagation()
    if (!isAdmin) return
    setEditingId(game.id)
    setFormData({
      name: game.name || '',
      englishName: game.englishName || '',
      minPlayers: game.minPlayers || 2,
      maxPlayers: game.maxPlayers || 4,
      bestPlayers: game.bestPlayers || '',
      time: game.time || 30,
      category: game.category || '派對',
      rating: game.rating ? String(game.rating) : '8.0',
      emoji: game.emoji || '🎲',
      imageUrl: game.imageUrl || '',
      tagsInput: Array.isArray(game.tags) ? game.tags.join(', ') : '',
      description: game.description || '',
      videoUrl: game.videoUrl || '',
      isExpansion: game.isExpansion || false,
      parentId: game.parentId || ''
    })
    setShowModal(true)
  }

  async function handleSubmitForm(e) {
    e.preventDefault()
    if (!formData.name.trim()) return alert('請填寫桌遊名稱！')

    const tagsArray = formData.tagsInput.split(',').map(t => t.trim()).filter(t => t !== '')

    const gamePayload = {
      name: formData.name,
      englishName: formData.englishName,
      minPlayers: parseInt(formData.minPlayers, 10) || 1,
      maxPlayers: parseInt(formData.maxPlayers, 10) || 4,
      bestPlayers: formData.bestPlayers.trim() || `${formData.minPlayers}-${formData.maxPlayers}`,
      time: parseInt(formData.time, 10) || 30,
      category: formData.category.trim() || '未分類',
      rating: parseFloat(formData.rating) || 8.0,
      emoji: formData.emoji,
      imageUrl: formData.imageUrl,
      tags: tagsArray,
      description: formData.description,
      videoUrl: formData.videoUrl,
      isExpansion: formData.isExpansion,
      parentId: formData.isExpansion ? (parseInt(formData.parentId, 10) || null) : null
    }

    if (editingId) {
      const { error } = await supabase
        .from('boardgames')
        .update(gamePayload)
        .eq('id', editingId)

      if (error) {
        alert('更新失敗：' + error.message)
      } else {
        setGames(games.map(g => g.id === editingId ? { ...g, ...gamePayload } : g))
        setShowModal(false)
        setFormData(emptyForm)
      }
    } else {
      const { data, error } = await supabase
        .from('boardgames')
        .insert([gamePayload])
        .select()

      if (error) {
        alert('新增失敗：' + error.message)
      } else if (data) {
        setGames([data[0], ...games])
        setShowModal(false)
        setFormData(emptyForm)
      }
    }
  }

  async function handleDeleteGame(e, id, name) {
    e.stopPropagation()
    if (!isAdmin) return

    if (window.confirm(`確定要刪除「${name}」嗎？`)) {
      const { error } = await supabase
        .from('boardgames')
        .delete()
        .eq('id', id)

      if (error) {
        alert('刪除失敗：' + error.message)
      } else {
        setGames(games.filter(g => g.id !== id))
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
          
          <button type="button" className="action-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ 淺色' : '🌙 暗黑'}
          </button>

          <button 
            type="button" 
            className="action-btn" 
            onClick={handleAdminToggle}
            style={{ 
              backgroundColor: isAdmin ? '#EF4444' : '#4F46E5', 
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
        {/* 橫幅區域：左側統計與抽桌遊、右側【同步的起始玩家 / 計分血量】卡片 */}
        <section className="hero" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">MY BOARD GAME LIBRARY</p>
            <h1>今天聚會，<br /><span>玩哪一款？</span></h1>
            
            <div style={{ display: 'inline-flex', gap: '12px', margin: '18px 0 20px 0', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.2)', backdropFilter: 'blur(8px)', padding: '10px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>📦</span>
                <div>
                  <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>總收藏量</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#4F46E5' }}>{totalCount} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>款</span></div>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', backdropFilter: 'blur(8px)', padding: '10px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>🎮</span>
                <div>
                  <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>主遊戲</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#10B981' }}>{mainCount} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>款</span></div>
                </div>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', backdropFilter: 'blur(8px)', padding: '10px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>🧩</span>
                <div>
                  <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>擴充包</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#F59E0B' }}>{expansionCount} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>款</span></div>
                </div>
              </div>
            </div>

            <p className="hero-text">支援最佳人數過濾、自訂類型與 JSON 備份！</p>
            <button 
              type="button" 
              className={`random-button ${isSpinning ? 'spinning' : ''}`} 
              onClick={chooseRandomWithAnimation} 
              disabled={isSpinning}
            >
              {isSpinning ? '🎡 轉盤滾動中...' : '🎲 幫我選一款'}
            </button>
          </div>

          {/* 右側雙分頁聚會小卡片 */}
          <div className="starter-card" style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '20px',
            padding: '1.4rem',
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
            position: 'relative'
          }}>
            {/* 卡片頂部微型分頁按鈕 */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '14px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setWidgetTab('starter')}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: widgetTab === 'starter' ? '#4F46E5' : 'transparent',
                  color: widgetTab === 'starter' ? '#fff' : 'inherit',
                  transition: 'all 0.2s'
                }}
              >
                👑 起始玩家
              </button>
              <button
                type="button"
                onClick={() => setWidgetTab('scoreboard')}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: widgetTab === 'scoreboard' ? '#4F46E5' : 'transparent',
                  color: widgetTab === 'scoreboard' ? '#fff' : 'inherit',
                  transition: 'all 0.2s'
                }}
              >
                📝 計分 / 血量
              </button>
            </div>

            {/* 子分頁一：起始玩家 */}
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
                        background: starterWinner === p.name ? '#4F46E5' : 'rgba(79, 70, 229, 0.08)',
                        color: starterWinner === p.name ? '#ffffff' : '#4F46E5',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: starterWinner === p.name ? '700' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: starterWinner === p.name ? '1px solid #4F46E5' : '1px solid transparent'
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
                    style={{ flex: 1, padding: '7px 10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}
                  />
                  <button 
                    type="submit" 
                    style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: '10px', padding: '7px 12px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    + 加入
                  </button>
                </form>

                <div style={{
                  background: isPickingStarter ? 'rgba(79, 70, 229, 0.05)' : (starterWinner ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.02)'),
                  border: starterWinner && !isPickingStarter ? '1px dashed #10B981' : '1px dashed #CBD5E1',
                  borderRadius: '12px',
                  padding: '10px',
                  textAlign: 'center',
                  marginBottom: '12px'
                }}>
                  {isPickingStarter && <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#4F46E5' }}>🎲 輪動中... {starterWinner}</div>}
                  {!isPickingStarter && starterWinner && <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#059669' }}>🎉 先攻由 <u>{starterWinner}</u> 開始！</div>}
                  {!isPickingStarter && !starterWinner && <div style={{ fontSize: '0.82rem', color: '#888' }}>點擊下方按鈕選出首位玩家！</div>}
                </div>

                <button 
                  type="button" 
                  onClick={pickStarterPlayer} 
                  disabled={isPickingStarter}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
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

            {/* 子分頁二：計分 / 血量（快速重設已改為：歸零 / 10血 / 20血） */}
            {widgetTab === 'scoreboard' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>快速重設：</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button type="button" onClick={() => resetAllScores(0)} style={{ padding: '2px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'transparent', fontSize: '0.75rem', cursor: 'pointer' }}>歸零</button>
                    <button type="button" onClick={() => resetAllScores(10)} style={{ padding: '2px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'transparent', fontSize: '0.75rem', cursor: 'pointer' }}>10血</button>
                    <button type="button" onClick={() => resetAllScores(20)} style={{ padding: '2px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'transparent', fontSize: '0.75rem', cursor: 'pointer' }}>20血</button>
                  </div>
                </div>

                {/* 玩家分數列表：完全展開無內滾拉桿 */}
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
                        border: '1px solid rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span 
                          onClick={() => handleRemoveSharedPlayer(p.id)} 
                          style={{ cursor: 'pointer', color: '#94A3B8', fontSize: '0.75rem' }} 
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
                    style={{ flex: 1, padding: '7px 10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}
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
          </div>
        </section>

        <section className="filter-panel">
          <div className="filter-row">
            <div className="search-box">
              <span>🔍</span>
              <input type="text" placeholder="搜尋桌遊名稱/英文..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="filter-group">
              <label>👥 可玩人數：</label>
              <select value={playerFilter} onChange={(e) => setPlayerFilter(e.target.value)}>
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
              <select value={bestPlayerFilter} onChange={(e) => setBestPlayerFilter(e.target.value)}>
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
              <select value={maxTimeFilter} onChange={(e) => setMaxTimeFilter(e.target.value)}>
                <option value="all">不限</option>
                <option value="15">15 分鐘內</option>
                <option value="30">30 分鐘內</option>
              </select>
            </div>

            <div className="filter-group">
              <label>📊 排序：</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="rating-desc">⭐ 評分最高</option>
                <option value="time-asc">⏱️ 時間最短</option>
              </select>
            </div>
          </div>

          <div className="category-bar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '14px 0 10px 0' }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                type="button"
                className={`cat-btn ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
                style={{
                  borderRadius: '12px',
                  padding: '7px 16px',
                  fontSize: '0.92rem',
                  fontWeight: '600',
                  border: category === cat ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                  backgroundColor: category === cat ? '#4F46E5' : 'var(--bg-card, #ffffff)',
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

          {allTags.length > 0 && (
            <div className="tag-bar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 0', alignItems: 'center' }}>
              <button 
                type="button"
                className={`tag-chip ${selectedTags.length === 0 ? 'active' : ''}`}
                onClick={() => handleTagToggle('')}
                style={{ 
                  padding: '5px 14px', 
                  borderRadius: '20px', 
                  border: selectedTags.length === 0 ? '1px solid #10B981' : '1px solid #D1D5DB', 
                  cursor: 'pointer', 
                  whiteSpace: 'nowrap',
                  fontSize: '0.85rem',
                  fontWeight: selectedTags.length === 0 ? '600' : 'normal',
                  backgroundColor: selectedTags.length === 0 ? '#10B981' : 'transparent',
                  color: selectedTags.length === 0 ? '#fff' : 'inherit',
                  transition: 'all 0.2s ease'
                }}
              >
                🏷️ 全部標籤
              </button>
              {allTags.map(tag => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                    style={{ 
                      padding: '5px 13px', 
                      borderRadius: '20px', 
                      border: isSelected ? '1px solid #4F46E5' : '1px solid #E2E8F0', 
                      cursor: 'pointer', 
                      whiteSpace: 'nowrap',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? '600' : 'normal',
                      backgroundColor: isSelected ? '#4F46E5' : 'rgba(0,0,0,0.03)',
                      color: isSelected ? '#fff' : 'inherit',
                      boxShadow: isSelected ? '0 3px 10px rgba(79, 70, 229, 0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    #{tag} {isSelected && '✓'}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="collection">
          <div className="game-grid">
            {filteredGames.map((game) => (
              <article className="game-card" key={game.id} onClick={() => setViewDetailGame(game)}>
                {isAdmin && (
                  <div className="card-actions">
                    <button type="button" className="edit-btn" onClick={(e) => handleOpenEditModal(e, game)}>✏️</button>
                    <button type="button" className="delete-btn" onClick={(e) => handleDeleteGame(e, game.id, game.name)}>✕</button>
                  </div>
                )}

                <div className="cover">
                  {game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.name} className="cover-img" />
                  ) : (
                    <span className="cover-emoji">{game.emoji}</span>
                  )}
                  {game.isExpansion && (
                    <span 
                      className="expansion-badge" 
                      style={{ 
                        whiteSpace: 'nowrap', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px' 
                      }}
                    >
                      🧩 擴充
                    </span>
                  )}
                  <span className="category-tag">{game.category}</span>
                </div>

                <div className="game-info">
                  <h3>{game.name}</h3>
                  <p className="english">{game.englishName}</p>
                  
                  {Array.isArray(game.tags) && game.tags.length > 0 && (
                    <div className="card-tags" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '4px 0' }}>
                      {game.tags.map(t => (
                        <span key={t} style={{ fontSize: '11px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>#{t}</span>
                      ))}
                    </div>
                  )}

                  <div 
                    className="game-details" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      gap: '4px', 
                      whiteSpace: 'nowrap', 
                      fontSize: '11.5px', 
                      margin: '6px 0' 
                    }}
                  >
                    <span>👥 {game.minPlayers}–{game.maxPlayers}人</span>
                    {game.bestPlayers && (
                      <span style={{ color: '#D97706', fontWeight: 'bold' }}>
                        👑 最佳{game.bestPlayers}人
                      </span>
                    )}
                    <span>⏱️ {game.time}分</span>
                  </div>

                  <div className="rating">⭐ <strong>{game.rating}</strong></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* 隨機挑選結果 Modal */}
      {randomGame && (
        <div className="modal-overlay" onClick={() => !isSpinning && setRandomGame(null)}>
          <div 
            className="detail-modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ textAlign: 'center', maxWidth: '420px', padding: '2rem', borderRadius: '20px' }}
          >
            <button 
              className="close-detail-btn" 
              onClick={() => setRandomGame(null)}
              disabled={isSpinning}
            >
              ✕
            </button>

            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#6366F1', letterSpacing: '1px' }}>
              {isSpinning ? '🎡 命運之輪旋轉中...' : '🎯 命中注定就是它！'}
            </span>

            <div style={{ margin: '1.2rem auto', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: '16px', overflow: 'hidden' }}>
              {randomGame.imageUrl ? (
                <img src={randomGame.imageUrl} alt={randomGame.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '4.5rem' }}>{randomGame.emoji || '🎲'}</span>
              )}
            </div>

            <h2 style={{ fontSize: '1.4rem', margin: '0.5rem 0' }}>{randomGame.name}</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.2rem' }}>{randomGame.englishName}</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '0.85rem', color: '#555', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span>👥 {randomGame.minPlayers}–{randomGame.maxPlayers}人</span>
              <span>👑 最佳 {randomGame.bestPlayers || randomGame.maxPlayers}人</span>
              <span>⏱️ {randomGame.time} 分鐘</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={chooseRandomWithAnimation} 
                disabled={isSpinning}
                style={{
                  background: '#4F46E5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '10px 22px',
                  fontWeight: 'bold',
                  cursor: isSpinning ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                }}
              >
                {isSpinning ? '抽取中...' : '🎲 再抽一次'}
              </button>
              
              <button 
                type="button" 
                onClick={() => {
                  const target = randomGame
                  setRandomGame(null)
                  setViewDetailGame(target)
                }}
                disabled={isSpinning}
                style={{
                  background: '#10B981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '10px 22px',
                  fontWeight: 'bold',
                  cursor: isSpinning ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                📖 查看詳情
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細資料 Modal (含主遊戲/擴充雙向跳轉) */}
      {viewDetailGame && (
        <div className="modal-overlay" onClick={() => setViewDetailGame(null)}>
          <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-detail-btn" onClick={() => setViewDetailGame(null)}>✕</button>
            
            {viewDetailGame.imageUrl && (
              <img 
                src={viewDetailGame.imageUrl} 
                alt={viewDetailGame.name} 
                style={{ 
                  width: '100%', 
                  maxHeight: '380px', 
                  objectFit: 'contain', 
                  borderRadius: '12px', 
                  marginBottom: '14px',
                  display: 'block'
                }} 
              />
            )}

            <h2>{viewDetailGame.emoji} {viewDetailGame.name}</h2>
            <p className="detail-english">{viewDetailGame.englishName}</p>
            
            <div style={{ display: 'flex', gap: '12px', margin: '12px 0', fontSize: '14px', color: '#666', flexWrap: 'wrap' }}>
              <span>👥 可玩人數：{viewDetailGame.minPlayers}–{viewDetailGame.maxPlayers} 人</span>
              <span style={{ color: '#D97706', fontWeight: 'bold' }}>👑 最佳人數：{viewDetailGame.bestPlayers || '未設定'} 人</span>
              <span>⏱️ 時間：{viewDetailGame.time} 分鐘</span>
              <span>⭐ 評分：{viewDetailGame.rating} 分</span>
            </div>

            {viewDetailGame.isExpansion && viewDetailGame.parentId && (
              <div style={{ margin: '12px 0', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: '#B45309', fontWeight: 'bold' }}>
                  🧩 此為擴充包，需搭配主遊戲遊玩
                </span>
                {games.find(g => g.id === viewDetailGame.parentId) && (
                  <button
                    type="button"
                    onClick={() => setViewDetailGame(games.find(g => g.id === viewDetailGame.parentId))}
                    style={{
                      border: 'none',
                      background: '#F59E0B',
                      color: '#fff',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    📦 查看主遊戲：{games.find(g => g.id === viewDetailGame.parentId).name} →
                  </button>
                )}
              </div>
            )}

            {Array.isArray(viewDetailGame.tags) && viewDetailGame.tags.length > 0 && (
              <div style={{ margin: '8px 0', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {viewDetailGame.tags.map(t => (
                  <span key={t} style={{ background: '#4F46E5', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>#{t}</span>
                ))}
              </div>
            )}

            <p style={{ lineHeight: '1.6', margin: '12px 0' }}>{viewDetailGame.description || '暫無詳細描述。'}</p>

            {viewDetailGame.videoUrl && (
              <a href={viewDetailGame.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '8px 16px', background: '#FF0000', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', marginBottom: '12px' }}>
                🎬 觀看教學影片
              </a>
            )}

            {games.filter(g => g.parentId === viewDetailGame.id).length > 0 && (
              <div className="expansion-list" style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>🧩 附屬擴充包（點擊查看詳情）：</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {games.filter(g => g.parentId === viewDetailGame.id).map(exp => (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setViewDetailGame(exp)}
                      style={{
                        border: '1px solid #CBD5E1',
                        background: 'var(--bg-card, #fff)',
                        color: 'inherit',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      ✨ {exp.name} →
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 新增/編輯 Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
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

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label>遊戲時間 (分鐘)</label>
                  <input type="number" step="5" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                </div>
                <div>
                  <label>評分 (0.0~10.0)</label>
                  <input type="number" step="0.1" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} />
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

              <div className="form-group">
                <label>📷 封面圖片網址 (Image URL)</label>
                <input type="url" placeholder="https://example.com/image.jpg" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
              </div>

              <div className="form-group">
                <label>或 上傳圖片 (自動 1:1 裁切)</label>
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
                <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}></textarea>
              </div>

              <div className="form-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={formData.isExpansion} 
                    onChange={(e) => setFormData({...formData, isExpansion: e.target.checked})} 
                  />
                  這是擴充包？
                </label>
                {formData.isExpansion && (
                  <select value={formData.parentId || ''} onChange={(e) => setFormData({...formData, parentId: e.target.value})} style={{ marginTop: '6px' }}>
                    <option value="">-- 請選擇主遊戲 --</option>
                    {games.filter(g => !g.isExpansion).map(parent => (
                      <option key={parent.id} value={parent.id}>{parent.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="submit-btn" style={{ background: '#4F46E5', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}