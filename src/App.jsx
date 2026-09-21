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

const PLAYER_PALETTE = ['#6366f1', '#059669', '#d97706', '#db2777', '#2563eb', '#7c3aed', '#0d9488', '#ea580c']

const TEAM_CONFIG = [
  { name: '藍隊', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(37, 99, 235, 0.25)' },
  { name: '琥珀隊', color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', border: 'rgba(217, 119, 6, 0.25)' },
  { name: '綠隊', color: '#059669', bg: 'rgba(5, 150, 105, 0.08)', border: 'rgba(5, 150, 105, 0.25)' },
  { name: '紫隊', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)', border: 'rgba(124, 58, 237, 0.25)' }
]

const PLAYER_OPTIONS = [
  { key: 'all', label: '不限' },
  { key: '2', label: '2 人' },
  { key: '3', label: '3 人' },
  { key: '4', label: '4 人' },
  { key: '5', label: '5 人' },
  { key: '6', label: '6 人以上' }
]

const BEST_PLAYER_OPTIONS = [
  { key: 'all', label: '不限' },
  { key: '2', label: '2 人' },
  { key: '3', label: '3 人' },
  { key: '4', label: '4 人' },
  { key: '5', label: '5 人' },
  { key: '6', label: '6 人' },
  { key: '7', label: '7 人' },
  { key: '8', label: '8 人' }
]

const TIME_OPTIONS = [
  { key: 'all', label: '不限' },
  { key: '15', label: '15分內' },
  { key: '30', label: '30分內' }
]

const SORT_OPTIONS = [
  { key: 'rating-desc', label: '⭐ 評分最高' },
  { key: 'time-asc', label: '⏱️ 時間最短' },
  { key: 'time-desc', label: '⏳ 時間最長' },
  { key: 'complexity-desc', label: '🔥 燒腦硬核' },
  { key: 'name-asc', label: '🔤 名稱順序' }
]

const initialGames = [
  { id: 1, name: '地城無雙 Dungeon Mayhem', englishName: 'Dungeon Mayhem', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 15, category: '卡牌對戰', rating: 8.00, complexity: 1.50, emoji: '⚔️', imageUrl: '', tags: ['新手推薦', '快節奏'], description: '極度爽快的卡牌對戰遊戲，選好你的英雄，把其他對手打倒！', cheatSheet: '1. 每回合抽2張牌，打出牌面執行效果。\n2. 攻擊對手血量，歸零者淘汰。\n3. 最後存活的英雄獲勝！', videoUrl: 'https://www.youtube.com/results?search_query=地城無雙+桌遊教學', bggUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '63.5x88 mm (120張)' },
  { id: 2, name: '心靈同步', englishName: 'The Mind', minPlayers: 2, maxPlayers: 4, bestPlayers: '4', time: 20, category: '合作', rating: 6.80, complexity: 1.06, emoji: '🧠', imageUrl: '', tags: ['默契考驗', '靜音遊戲'], description: '不能說話、不能打手勢，只能靠感覺依序打出數字牌！', cheatSheet: '1. 牌面數字由小到大依序打出。\n2. 全程絕對不能溝通與暗示。\n3. 容許一定的生命值失誤次數。', videoUrl: '', bggUrl: '', isExpansion: false, isSequel: false, parentId: null, sleeveSize: '56x87 mm (120張)' }
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
  bggUrl: '',
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

  const [activeDropdown, setActiveDropdown] = useState(null)
  const filterRowRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRowRef.current && !filterRowRef.current.contains(e.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [quickPickPlayers, setQuickPickPlayers] = useState('all')
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'default')

  useEffect(() => {
    document.body.className = ''
    if (theme !== 'default') {
      document.body.classList.add(`theme-${theme}`)
    }
    localStorage.setItem('app_theme', theme)
  }, [theme])

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

  const [roundCount, setRoundCount] = useState(1)
  const [editingScoreId, setEditingScoreId] = useState(null)
  const [tempScoreVal, setTempScoreVal] = useState('')

  const [initialTimerDuration, setInitialTimerDuration] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)

  const [diceToolTab, setDiceToolTab] = useState('dice')
  const [diceSides, setDiceSides] = useState(6)
  const [diceNumber, setDiceNumber] = useState(6)
  const [isRollingDice, setIsRollingDice] = useState(false)
  const [coinSide, setCoinSide] = useState('👑 正面')
  const [isFlippingCoin, setIsFlippingCoin] = useState(false)
  const [coinDegree, setCoinDegree] = useState(0)

  const [targetTeamCount, setTargetTeamCount] = useState(2)
  const [assignedTeams, setAssignedTeams] = useState([])
  const [isShufflingTeams, setIsShufflingTeams] = useState(false)

  const [inputPlayerName, setInputPlayerName] = useState('')
  const [starterWinner, setStarterWinner] = useState(null)
  const [isPickingStarter, setIsPickingStarter] = useState(false)

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
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (activeDropdown) {
          setActiveDropdown(null)
        } else if (showModal) {
          setShowModal(false)
        } else if (viewDetailGame) {
          setViewDetailGame(null)
        } else if (randomGame) {
          setRandomGame(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDropdown, showModal, viewDetailGame, randomGame])

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
      if (sortBy === 'time-desc') return (b.time || 0) - (a.time || 0)
      if (sortBy === 'complexity-desc') return (b.complexity || 1) - (a.complexity || 1)
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '', 'zh-Hant')
      return 0
    })
  }, [games, search, category, playerFilter, bestPlayerFilter, maxTimeFilter, sortBy, expansionFilter, favorites])

  const availableRandomPoolCount = useMemo(() => {
    let pool = filteredGames.length > 0 ? filteredGames : games
    if (quickPickPlayers !== 'all') {
      const p = parseInt(quickPickPlayers, 10)
      pool = pool.filter(g => p >= (g.minPlayers || 1) && p <= (g.maxPlayers || 99))
    }
    return pool.length
  }, [filteredGames, games, quickPickPlayers])

  function handleExportJSON() {
    const cleanGames = games.map(g => {
      const safeImage = g.imageUrl && g.imageUrl.startsWith('data:') ? '' : (g.imageUrl || '')
      return {
        name: g.name || '',
        englishName: g.englishName || '',
        minPlayers: Number(g.minPlayers) || 1,
        maxPlayers: Number(g.maxPlayers) || 4,
        bestPlayers: String(g.bestPlayers || ''),
        time: Number(g.time) || 30,
        category: g.category || '未分類',
        rating: Number(Number(g.rating || 0).toFixed(2)),
        complexity: Number(Number(g.complexity || 2).toFixed(2)),
        emoji: g.emoji || '🎲',
        imageUrl: safeImage,
        tags: Array.isArray(g.tags) ? g.tags : [],
        description: g.description || '',
        cheatSheet: g.cheatSheet || '',
        videoUrl: g.videoUrl || '',
        bggUrl: g.bggUrl || '',
        sleeveSize: g.sleeveSize || '',
        isExpansion: !!g.isExpansion,
        isSequel: !!g.isSequel,
        parentId: g.parentId ? Number(g.parentId) : null
      }
    })

    const jsonString = JSON.stringify(cleanGames, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.href = url
    downloadAnchor.download = `boardgames_export_${new Date().toISOString().slice(0, 10)}.json`
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
        if (!Array.isArray(importedData)) return alert('❌ 檔案格式不正確，應為桌遊物件陣列！')
        if (!window.confirm(`確定要將 ${importedData.length} 款桌遊智慧同步到雲端資料庫嗎？\n（已存在的桌遊會更新資訊並自動保留原圖，絕不產生重複）`)) return

        const { data: dbGames, error: fetchErr } = await supabase
          .from('boardgames')
          .select('*')

        if (fetchErr) {
          throw new Error('讀取現有資料庫失敗：' + fetchErr.message)
        }

        const dbMap = new Map()
        ;(dbGames || []).forEach(g => {
          if (g.name) dbMap.set(g.name.trim(), g)
        })

        const toInsert = []
        const toUpdate = []

        importedData.forEach(item => {
          if (!item.name || !item.name.trim()) return

          const cleanName = item.name.trim()
          const existing = dbMap.get(cleanName)

          let finalImage = (item.imageUrl && item.imageUrl.trim()) || ''
          if (!finalImage && existing && existing.imageUrl) {
            finalImage = existing.imageUrl
          }

          const payload = {
            name: cleanName,
            englishName: item.englishName || '',
            minPlayers: parseInt(item.minPlayers, 10) || 1,
            maxPlayers: parseInt(item.maxPlayers, 10) || 4,
            bestPlayers: item.bestPlayers ? String(item.bestPlayers) : `${item.minPlayers || 1}-${item.maxPlayers || 4}`,
            time: parseInt(item.time, 10) || 30,
            category: item.category || '未分類',
            rating: parseFloat(item.rating) || 0,
            complexity: parseFloat(item.complexity) || 0,
            emoji: item.emoji || '🎲',
            imageUrl: finalImage,
            tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()) : []),
            description: item.description || '',
            cheatSheet: item.cheatSheet || '',
            videoUrl: item.videoUrl || '',
            bggUrl: item.bggUrl || '',
            sleeveSize: item.sleeveSize || '',
            isExpansion: !!item.isExpansion,
            isSequel: !!item.isSequel,
            parentId: item.parentId ? parseInt(item.parentId, 10) : null
          }

          if (existing) {
            toUpdate.push({ id: existing.id, ...payload })
          } else {
            toInsert.push(payload)
          }
        })

        for (const item of toUpdate) {
          const { id, ...dataToUpdate } = item
          await supabase.from('boardgames').update(dataToUpdate).eq('id', id)
        }

        if (toInsert.length > 0) {
          const { error: insErr } = await supabase.from('boardgames').insert(toInsert)
          if (insErr) throw insErr
        }

        alert(`✅ 同步完成！\n• 更新現有桌遊：${toUpdate.length} 款（已保護原圖不被覆蓋）\n• 新增桌遊：${toInsert.length} 款`)
        fetchGamesFromSupabase()

      } catch (err) {
        alert('❌ 匯入同步失敗：' + err.message)
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
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/png')
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

  function handleQuickAddPlayer() {
    triggerHaptic('light')
    const newId = sharedPlayers.length > 0 ? Math.max(...sharedPlayers.map(p => p.id)) + 1 : 1
    const nextName = `玩家 ${newId}`
    setSharedPlayers([...sharedPlayers, { id: newId, name: nextName, score: 0 }])
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
      if (count >= 18) {
        clearInterval(interval)
        setIsPickingStarter(false)
        playSound('victory')
        triggerHaptic('heavy')
      }
    }, 75)
  }

  function changeScore(id, delta) {
    triggerHaptic('light')
    setSharedPlayers(sharedPlayers.map(p => p.id === id ? { ...p, score: p.score + delta } : p))
  }

  function handleSortPlayersByScore() {
    triggerHaptic('medium')
    const sorted = [...sharedPlayers].sort((a, b) => b.score - a.score)
    setSharedPlayers(sorted)
  }

  function handleSaveDirectScore(id) {
    const val = parseInt(tempScoreVal, 10)
    if (!isNaN(val)) {
      setSharedPlayers(sharedPlayers.map(p => p.id === id ? { ...p, score: val } : p))
    }
    setEditingScoreId(null)
  }

  function resetAllScores(val = 0) {
    triggerHaptic('medium')
    setSharedPlayers(sharedPlayers.map(p => ({ ...p, score: val })))
  }

  const maxScore = useMemo(() => {
    if (sharedPlayers.length === 0) return 0
    return Math.max(...sharedPlayers.map(p => p.score))
  }, [sharedPlayers])

  function setTimerPreset(seconds) {
    triggerHaptic('light')
    setTimerRunning(false)
    setInitialTimerDuration(seconds)
    setTimeLeft(seconds)
  }

  function toggleTimer() {
    triggerHaptic('medium')
    if (timeLeft === 0) {
      setTimeLeft(initialTimerDuration)
    }
    setTimerRunning(!timerRunning)
  }

  function resetTimer() {
    triggerHaptic('light')
    setTimerRunning(false)
    setTimeLeft(initialTimerDuration)
  }

  function rollDice(sides) {
    setDiceSides(sides)
    setIsRollingDice(true)
    playSound('dice')
    triggerHaptic('medium')
    let count = 0
    const interval = setInterval(() => {
      const temp = Math.floor(Math.random() * sides) + 1
      setDiceNumber(temp)
      count++
      if (count >= 12) {
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
    const nextDegree = coinDegree + 720 + (Math.random() < 0.5 ? 0 : 180)
    setCoinDegree(nextDegree)

    setTimeout(() => {
      const isHead = nextDegree % 360 === 0
      setCoinSide(isHead ? '👑 正面（人頭）' : '🪙 反面（字）')
      setIsFlippingCoin(false)
      triggerHaptic('light')
    }, 650)
  }

  function handleSplitTeams(numTeams = targetTeamCount) {
    triggerHaptic('medium')
    if (sharedPlayers.length < numTeams) {
      return alert(`至少需要 ${numTeams} 位玩家才能分成 ${numTeams} 隊！`)
    }

    setIsShufflingTeams(true)
    const shuffled = [...sharedPlayers].sort(() => Math.random() - 0.5)
    
    const buckets = Array.from({ length: numTeams }, () => [])
    shuffled.forEach((player, idx) => {
      buckets[idx % numTeams].push(player)
    })

    setTimeout(() => {
      setAssignedTeams(buckets)
      setIsShufflingTeams(false)
      playSound('victory')
      triggerHaptic('heavy')
    }, 280)
  }

  function chooseRandomWithAnimation() {
    let pool = filteredGames.length > 0 ? filteredGames : games

    if (quickPickPlayers !== 'all') {
      const p = parseInt(quickPickPlayers, 10)
      pool = pool.filter(g => p >= (g.minPlayers || 1) && p <= (g.maxPlayers || 99))
    }

    if (pool.length === 0) {
      return alert(`⚠️ 目前收藏庫中沒有適合 ${quickPickPlayers === 'all' ? '' : quickPickPlayers + ' 人'}的桌遊可抽取！`)
    }

    setIsRevealed(false)
    setIsShuffling(true)
    triggerHaptic('medium')

    const picked = pool[Math.floor(Math.random() * pool.length)]
    setRandomGame(picked)

    setTimeout(() => {
      setIsShuffling(false)
      setIsRevealed(true)
      playSound('victory')
      triggerHaptic('heavy')
    }, 600)
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

    if (game.sleeveSize) {
      const parsed = game.sleeveSize.split(',').map(s => {
        const item = s.trim()
        const countMatch = item.match(/\((.*?)\)/)
        const sizeOnly = item.replace(/\s*\(.*?\)/, '').trim()
        return {
          size: sizeOnly || '63.5x88 mm',
          count: countMatch ? countMatch[1].replace('張', '') : ''
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
      bggUrl: game.bggUrl || '',
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
      bggUrl: formData.bggUrl,
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

  const timerRadius = 78
  const timerCircumference = 2 * Math.PI * timerRadius
  const timerProgress = initialTimerDuration > 0 ? (timeLeft / initialTimerDuration) : 0
  const timerDashoffset = timerCircumference - (timerProgress * timerCircumference)

  const currentPlayerLabel = useMemo(() => {
    const f = PLAYER_OPTIONS.find(o => o.key === playerFilter)
    return f ? f.label : '不限'
  }, [playerFilter])

  const currentBestLabel = useMemo(() => {
    const f = BEST_PLAYER_OPTIONS.find(o => o.key === bestPlayerFilter)
    return f ? f.label : '不限'
  }, [bestPlayerFilter])

  const currentTimeLabel = useMemo(() => {
    const f = TIME_OPTIONS.find(o => o.key === maxTimeFilter)
    return f ? f.label : '不限'
  }, [maxTimeFilter])

  const currentSortLabel = useMemo(() => {
    const f = SORT_OPTIONS.find(o => o.key === sortBy)
    return f ? f.label : '⭐ 評分最高'
  }, [sortBy])

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
        <section className="hero" id="hero-sec">
          <div className="hero-dashboard-left">
            <div>
              <span className="hero-tagline">✨ 聚會推薦助手</span>
              <h1>今天聚會，<br /><span>玩哪一款？</span></h1>
              <div className="hero-subtitle-hint">
                ⚡ 目前共有 <strong>{totalCount}</strong> 款精選桌遊準備就緒
              </div>
            </div>

            <div className="hero-stats-grid">
              <div 
                className={`hero-stat-card ${expansionFilter === 'all' ? 'active-all' : ''}`}
                onClick={() => { triggerHaptic('light'); setExpansionFilter('all'); }}
              >
                <span className="stat-icon">📦</span>
                <span className="stat-title">總收藏</span>
                <span className="stat-num" style={{ color: 'var(--accent-blue)' }}>
                  {totalCount}<span className="stat-unit">款</span>
                </span>
              </div>

              <div 
                className={`hero-stat-card ${expansionFilter === 'main' ? 'active-main' : ''}`}
                onClick={() => { triggerHaptic('light'); setExpansionFilter(expansionFilter === 'main' ? 'all' : 'main'); }}
              >
                <span className="stat-icon">🎮</span>
                <span className="stat-title">主遊戲</span>
                <span className="stat-num" style={{ color: '#10b981' }}>
                  {mainCount}<span className="stat-unit">款</span>
                </span>
              </div>

              <div 
                className={`hero-stat-card ${expansionFilter === 'expansion' ? 'active-expansion' : ''}`}
                onClick={() => { triggerHaptic('light'); setExpansionFilter(expansionFilter === 'expansion' ? 'all' : 'expansion'); }}
              >
                <span className="stat-icon">🧩</span>
                <span className="stat-title">擴充包</span>
                <span className="stat-num" style={{ color: '#d97706' }}>
                  {expansionCount}<span className="stat-unit">款</span>
                </span>
              </div>

              <div 
                className={`hero-stat-card ${expansionFilter === 'favorite' ? 'active-favorite' : ''}`}
                onClick={() => { triggerHaptic('light'); setExpansionFilter(expansionFilter === 'favorite' ? 'all' : 'favorite'); }}
              >
                <span className="stat-icon">❤️</span>
                <span className="stat-title">最愛</span>
                <span className="stat-num" style={{ color: '#e11d48' }}>
                  {favoriteCount}<span className="stat-unit">款</span>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <div className="quick-pick-container">
                <span className="quick-pick-label">
                  👥 指定人數:
                </span>
                <div className="quick-pick-track">
                  {[
                    { val: 'all', label: '不限' },
                    { val: '2', label: '2人' },
                    { val: '3', label: '3人' },
                    { val: '4', label: '4人' },
                    { val: '5', label: '5人' },
                    { val: '6', label: '6+人' }
                  ].map(item => {
                    const isSelected = quickPickPlayers === item.val
                    return (
                      <button
                        key={item.val}
                        type="button"
                        className={`quick-pick-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => { triggerHaptic('light'); setQuickPickPlayers(item.val); }}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button 
                type="button" 
                className={`random-button ${isShuffling ? 'spinning' : ''}`} 
                onClick={chooseRandomWithAnimation} 
                disabled={isShuffling || availableRandomPoolCount === 0}
                style={{ margin: 0 }}
              >
                <span className="random-dice-icon">🎲</span>
                <span>
                  {isShuffling 
                    ? '命運洗牌中...' 
                    : (quickPickPlayers === 'all' ? '幫我選一款桌遊' : `幫我選 ${quickPickPlayers} 人桌遊`)}
                </span>
              </button>

              <div className={`random-pool-counter ${availableRandomPoolCount === 0 ? 'empty' : ''}`}>
                {availableRandomPoolCount > 0 ? (
                  <>🎯 符合條件共 <strong>{availableRandomPoolCount}</strong> 款桌遊準備就緒</>
                ) : (
                  <>⚠️ 目前篩選條件下沒有符合的桌遊可抽</>
                )}
              </div>
            </div>
          </div>

          <div className="starter-card" style={{
            background: 'var(--bg-card)',
            borderRadius: '24px',
            padding: '1.4rem',
            border: '1px solid var(--border-color)',
            position: 'relative',
            overflowX: 'hidden'
          }}>
            <div className="tool-tab-track">
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
                  className={`tool-tab-btn ${widgetTab === tab.key ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {widgetTab === 'starter' && (
              <>
                <div className="player-chips-container">
                  {sharedPlayers.map((p, idx) => {
                    const isWon = starterWinner === p.name && !isPickingStarter
                    const dotColor = PLAYER_PALETTE[idx % PLAYER_PALETTE.length]
                    return (
                      <span 
                        key={p.id}
                        className={`player-chip ${isWon ? 'winner-chip' : ''}`}
                        title={isWon ? "🏆 起始先攻玩家！" : p.name}
                      >
                        <span className="player-chip-dot" style={{ backgroundColor: isWon ? '#f59e0b' : dotColor }}></span>
                        <span>{p.name}</span>
                        <span 
                          className="player-chip-del" 
                          onClick={() => handleRemoveSharedPlayer(p.id)}
                          title="移除玩家"
                        >
                          ✕
                        </span>
                      </span>
                    )
                  })}
                  <button 
                    type="button" 
                    onClick={handleQuickAddPlayer}
                    style={{
                      border: '1.5px dashed var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      borderRadius: '50px',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    title="快速新增一位玩家"
                  >
                    + 快速加人
                  </button>
                </div>

                <form onSubmit={handleAddSharedPlayer} className="integrated-input-group">
                  <input 
                    type="text" 
                    placeholder="自訂玩家暱稱..." 
                    value={inputPlayerName} 
                    onChange={(e) => setInputPlayerName(e.target.value)}
                  />
                  <button type="submit" className="integrated-input-btn">
                    + 加入
                  </button>
                </form>

                <div className={`starter-stage-card ${isPickingStarter ? 'rolling' : ''} ${starterWinner && !isPickingStarter ? 'won' : ''}`}>
                  {isPickingStarter && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 'bold' }}>🎰 命運輪盤極速旋轉中...</span>
                      <span className="slot-machine-text">🎯 {starterWinner}</span>
                    </div>
                  )}
                  {!isPickingStarter && starterWinner && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '1.8rem' }}>🎉</span>
                      <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#059669' }}>
                        先攻由 <u>{starterWinner}</u> 拔得頭籌！
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>請做好準備，順時針開始你的第一回合！</span>
                    </div>
                  )}
                  {!isPickingStarter && !starterWinner && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span>👑</span>
                      <span>點擊下方按鈕，交由命運選出首位開局玩家！</span>
                    </div>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={pickStarterPlayer} 
                  disabled={isPickingStarter}
                  className="starter-action-btn"
                >
                  {isPickingStarter ? '⚡ 命運抉擇中...' : '🎯 抽出起始玩家'}
                </button>
              </>
            )}

            {widgetTab === 'scoreboard' && (
              <>
                <div className="scoreboard-top-bar">
                  <div className="round-pill-control">
                    <span>🚩 第 {roundCount} 輪</span>
                    <button 
                      type="button" 
                      className="round-step-btn"
                      onClick={() => { triggerHaptic('light'); setRoundCount(Math.max(1, roundCount - 1)); }}
                    >
                      -
                    </button>
                    <button 
                      type="button" 
                      className="round-step-btn"
                      onClick={() => { triggerHaptic('light'); setRoundCount(roundCount + 1); }}
                    >
                      +
                    </button>
                  </div>

                  <div className="scoreboard-quick-actions">
                    <button 
                      type="button" 
                      className="scoreboard-action-tag highlight"
                      onClick={handleSortPlayersByScore} 
                      title="依分數從高到低重新排列"
                    >
                      🏆 排序
                    </button>
                    <button type="button" className="scoreboard-action-tag" onClick={() => resetAllScores(0)}>歸零</button>
                    <button type="button" className="scoreboard-action-tag" onClick={() => resetAllScores(10)}>10分</button>
                    <button type="button" className="scoreboard-action-tag" onClick={() => resetAllScores(20)}>20分</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {sharedPlayers.map((p, idx) => {
                    const dotColor = PLAYER_PALETTE[idx % PLAYER_PALETTE.length]
                    const isLeader = maxScore > 0 && p.score === maxScore

                    return (
                      <div 
                        key={p.id}
                        className={`score-card-row ${isLeader ? 'leader-active' : ''}`}
                      >
                        <div className="score-player-meta">
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor }}></span>
                          <span className="score-player-name">{p.name}</span>
                          {isLeader && <span className="leader-badge-pill">👑 領先</span>}
                        </div>

                        <div className="score-stepper-group">
                          <button type="button" className="step-btn-app" onClick={() => changeScore(p.id, -5)}>-5</button>
                          <button type="button" className="step-btn-app" onClick={() => changeScore(p.id, -1)}>-1</button>
                          
                          {editingScoreId === p.id ? (
                            <input 
                              type="number"
                              className="score-input-direct-app"
                              autoFocus
                              value={tempScoreVal}
                              onChange={(e) => setTempScoreVal(e.target.value)}
                              onBlur={() => handleSaveDirectScore(p.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDirectScore(p.id) }}
                            />
                          ) : (
                            <span 
                              className="score-display-number"
                              onClick={() => {
                                setEditingScoreId(p.id)
                                setTempScoreVal(String(p.score))
                              }}
                              title="點擊直接修改分數"
                            >
                              {p.score}
                            </span>
                          )}

                          <button type="button" className="step-btn-app" onClick={() => changeScore(p.id, 1)}>+1</button>
                          <button type="button" className="step-btn-app" onClick={() => changeScore(p.id, 5)}>+5</button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <form onSubmit={handleAddSharedPlayer} className="integrated-input-group">
                  <input 
                    type="text" 
                    placeholder="新增玩家 (兩邊同步)..." 
                    value={inputPlayerName} 
                    onChange={(e) => setInputPlayerName(e.target.value)}
                  />
                  <button type="submit" className="integrated-input-btn">
                    + 新增
                  </button>
                </form>
              </>
            )}

            {widgetTab === 'timer' && (
              <div className="timer-container">
                <div className="timer-preset-bar">
                  {[
                    { label: '30秒', val: 30 },
                    { label: '60秒', val: 60 },
                    { label: '2分鐘', val: 120 },
                    { label: '5分鐘', val: 300 },
                    { label: '10分鐘', val: 600 }
                  ].map(preset => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setTimerPreset(preset.val)}
                      className={`timer-preset-chip ${initialTimerDuration === preset.val ? 'active' : ''}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="timer-ring-wrapper">
                  <svg className="timer-svg" viewBox="0 0 190 190">
                    <circle className="timer-circle-bg" cx="95" cy="95" r={timerRadius} />
                    <circle
                      className={`timer-circle-progress ${timeLeft <= 10 && timeLeft > 0 ? 'danger' : ''}`}
                      cx="95"
                      cy="95"
                      r={timerRadius}
                      strokeDasharray={timerCircumference}
                      strokeDashoffset={timerDashoffset}
                    />
                  </svg>

                  <div className="timer-center-text">
                    <span className={`timer-digits ${timeLeft <= 10 ? 'danger' : ''}`}>
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="timer-sublabel">
                      {timerRunning ? 'COUNTING' : (timeLeft === 0 ? 'TIME OVER' : 'READY')}
                    </span>
                  </div>
                </div>

                <div className="timer-controls-row">
                  <button
                    type="button"
                    onClick={toggleTimer}
                    className={`timer-btn-primary ${timerRunning ? 'running' : ''}`}
                  >
                    {timerRunning ? '⏸️ 暫停' : (timeLeft === 0 ? '🔄 重新開始' : '▶️ 開始倒數')}
                  </button>
                  <button
                    type="button"
                    onClick={resetTimer}
                    className="timer-btn-secondary"
                  >
                    重設
                  </button>
                </div>
              </div>
            )}

            {widgetTab === 'dice' && (
              <div>
                <div className="dice-sub-tabs">
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setDiceToolTab('dice'); }}
                    className={`dice-sub-tab-btn ${diceToolTab === 'dice' ? 'active' : ''}`}
                  >
                    🎲 隨機骰子
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setDiceToolTab('coin'); }}
                    className={`dice-sub-tab-btn ${diceToolTab === 'coin' ? 'active' : ''}`}
                  >
                    🪙 3D 拋硬幣
                  </button>
                </div>

                {diceToolTab === 'dice' ? (
                  <>
                    <div className="dice-stage-box">
                      <div className={`dice-hero-icon ${isRollingDice ? 'rolling' : ''}`}>
                        🎲
                      </div>
                      <div className="dice-result-value">
                        {isRollingDice ? '投擲中...' : `${diceSides} 面骰點數：${diceNumber}`}
                      </div>
                    </div>

                    <div className="dice-buttons-grid">
                      {[
                        { sides: 6, label: 'D6' },
                        { sides: 8, label: 'D8' },
                        { sides: 10, label: 'D10' },
                        { sides: 20, label: 'D20' }
                      ].map(d => (
                        <button
                          key={d.sides}
                          type="button"
                          onClick={() => rollDice(d.sides)}
                          disabled={isRollingDice}
                          className="dice-select-btn"
                        >
                          <strong>{d.label}</strong>
                          <span>{d.sides}面</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="coin-stage-box" onClick={flipCoin} title="點擊硬幣直接翻轉">
                      <div 
                        className="coin-disc"
                        style={{ transform: `rotateY(${coinDegree}deg)` }}
                      >
                        {coinDegree % 360 === 0 ? '👑' : '1'}
                      </div>
                      <div className="coin-result-text">
                        {isFlippingCoin ? '空中旋轉中...' : coinSide}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={flipCoin}
                      disabled={isFlippingCoin}
                      className="coin-flip-action-btn"
                    >
                      {isFlippingCoin ? '💫 翻轉中...' : '🪙 投擲硬幣'}
                    </button>
                  </>
                )}
              </div>
            )}

            {widgetTab === 'team' && (
              <div className="team-tool-container">
                <div className="team-unified-header">
                  <div className="team-segmented-control">
                    {[2, 3, 4].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light')
                          setTargetTeamCount(num)
                          handleSplitTeams(num)
                        }}
                        className={`team-seg-btn ${targetTeamCount === num ? 'active' : ''}`}
                      >
                        {num} 隊
                      </button>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleSplitTeams(targetTeamCount)}
                    disabled={isShufflingTeams}
                    className="team-roll-btn"
                  >
                    {isShufflingTeams ? '🎴 洗牌中...' : '🎲 重新分組'}
                  </button>
                </div>

                {assignedTeams.length > 0 ? (
                  <div className={`team-results-grid cols-${assignedTeams.length}`}>
                    {assignedTeams.map((team, idx) => {
                      const cfg = TEAM_CONFIG[idx % TEAM_CONFIG.length]
                      return (
                        <div 
                          key={idx} 
                          className="team-box-card"
                          style={{ borderColor: cfg.border }}
                        >
                          <div className="team-card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color }}></span>
                              <strong style={{ color: cfg.color, fontSize: '0.9rem' }}>
                                {cfg.name}
                              </strong>
                            </div>
                            <span 
                              className="team-badge-pill" 
                              style={{ background: cfg.bg, color: cfg.color }}
                            >
                              {team.length} 人
                            </span>
                          </div>

                          <div className="team-members-chips">
                            {team.map(player => (
                              <span key={player.id} className="team-member-pill">
                                {player.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="team-empty-state">
                    <span>⚔️</span>
                    <p>點擊上方切換隊伍數或按「重新分組」開始！</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="filter-panel" id="collection-sec">
          <div className="filter-row" ref={filterRowRef}>
            <div className="search-box">
              <span>🔍</span>
              <input 
                type="text" 
                placeholder="搜尋桌遊名稱/英文..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

            <div className="custom-filter-dropdown-wrapper">
              <button
                type="button"
                className={`custom-filter-trigger ${activeDropdown === 'player' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light')
                  setActiveDropdown(activeDropdown === 'player' ? null : 'player')
                }}
              >
                <span className="custom-filter-label">👥 人數:</span>
                <span className="custom-filter-value">{currentPlayerLabel}</span>
                <span className={`custom-filter-arrow ${activeDropdown === 'player' ? 'open' : ''}`}>▼</span>
              </button>

              {activeDropdown === 'player' && (
                <div className="custom-filter-dropdown">
                  {PLAYER_OPTIONS.map(opt => {
                    const isSelected = playerFilter === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        className={`custom-filter-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          triggerHaptic('light')
                          setPlayerFilter(opt.key)
                          setActiveDropdown(null)
                        }}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <span className="custom-filter-check">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="custom-filter-dropdown-wrapper">
              <button
                type="button"
                className={`custom-filter-trigger ${activeDropdown === 'best' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light')
                  setActiveDropdown(activeDropdown === 'best' ? null : 'best')
                }}
              >
                <span className="custom-filter-label">👑 最佳:</span>
                <span className="custom-filter-value">{currentBestLabel}</span>
                <span className={`custom-filter-arrow ${activeDropdown === 'best' ? 'open' : ''}`}>▼</span>
              </button>

              {activeDropdown === 'best' && (
                <div className="custom-filter-dropdown">
                  {BEST_PLAYER_OPTIONS.map(opt => {
                    const isSelected = bestPlayerFilter === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        className={`custom-filter-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          triggerHaptic('light')
                          setBestPlayerFilter(opt.key)
                          setActiveDropdown(null)
                        }}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <span className="custom-filter-check">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="custom-filter-dropdown-wrapper">
              <button
                type="button"
                className={`custom-filter-trigger ${activeDropdown === 'time' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light')
                  setActiveDropdown(activeDropdown === 'time' ? null : 'time')
                }}
              >
                <span className="custom-filter-label">⏱️ 時間:</span>
                <span className="custom-filter-value">{currentTimeLabel}</span>
                <span className={`custom-filter-arrow ${activeDropdown === 'time' ? 'open' : ''}`}>▼</span>
              </button>

              {activeDropdown === 'time' && (
                <div className="custom-filter-dropdown">
                  {TIME_OPTIONS.map(opt => {
                    const isSelected = maxTimeFilter === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        className={`custom-filter-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          triggerHaptic('light')
                          setMaxTimeFilter(opt.key)
                          setActiveDropdown(null)
                        }}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <span className="custom-filter-check">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="custom-filter-dropdown-wrapper">
              <button
                type="button"
                className={`custom-filter-trigger ${activeDropdown === 'sort' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light')
                  setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')
                }}
              >
                <span className="custom-filter-label">📊 排序:</span>
                <span className="custom-filter-value">{currentSortLabel}</span>
                <span className={`custom-filter-arrow ${activeDropdown === 'sort' ? 'open' : ''}`}>▼</span>
              </button>

              {activeDropdown === 'sort' && (
                <div className="custom-filter-dropdown align-right">
                  {SORT_OPTIONS.map(opt => {
                    const isSelected = sortBy === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        className={`custom-filter-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          triggerHaptic('light')
                          setSortBy(opt.key)
                          setActiveDropdown(null)
                        }}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <span className="custom-filter-check">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="category-bar">
            {categories.map(cat => (
              <button 
                key={cat} 
                type="button"
                className={`cat-btn ${category === cat ? 'active' : ''}`}
                onClick={() => { triggerHaptic('light'); setCategory(cat); }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <section className="collection">
          <div className="game-grid">
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="skeleton-card">
                  <div className="skeleton-cover" />
                  <div className="skeleton-info">
                    <div className="skeleton-bar title" />
                    <div className="skeleton-bar subtitle" />
                    <div className="skeleton-bar tags" />
                    <div className="skeleton-bar bottom" />
                  </div>
                </div>
              ))
            ) : (
              filteredGames.map((game) => {
                const isFav = favorites.includes(game.id)
                return (
                  <article className="game-card box-3d-card" key={game.id} onClick={() => { triggerHaptic('light'); setDetailTab('info'); setViewDetailGame(game); }}>
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
              })
            )}
          </div>
        </section>
      </main>

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

      {/* 抽卡開箱彈窗 */}
      {randomGame && (
        <div className="modal-overlay">
          <div 
            className="detail-modal-content" 
            style={{ 
              textAlign: 'center', 
              maxWidth: '460px', 
              padding: '2rem 1.6rem', 
              borderRadius: '28px'
            }}
          >
            <button className="detail-close-icon-btn" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={() => setRandomGame(null)} disabled={isShuffling}>
              ✕
            </button>

            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-blue)', letterSpacing: '1px' }}>
              {isShuffling ? '🎴 命運牌堆洗牌中...' : '✨ 命中注定就是它！'}
            </span>

            <div className={`card-reveal-scene ${isShuffling ? 'shuffle-shake' : ''}`} style={{ margin: '1.2rem auto' }}>
              {isShuffling || !isRevealed ? (
                <div className="card-mystery-back">
                  <span>🔮</span>
                  <strong style={{ fontSize: '0.95rem', color: '#CBD5E1', letterSpacing: '2px' }}>DESTINY</strong>
                </div>
              ) : (
                <div className="card-reveal-box">
                  <div className="card-reveal-img-box">
                    {randomGame.imageUrl ? (
                      <img src={randomGame.imageUrl} alt={randomGame.name} />
                    ) : (
                      <span style={{ fontSize: '3.8rem' }}>{randomGame.emoji || '🎲'}</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.3rem', margin: '6px 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{randomGame.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 8px 0', width: '100%' }}>{randomGame.englishName}</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap', width: '100%' }}>
                    <span>👥 {randomGame.minPlayers}–{randomGame.maxPlayers}人</span>
                    <span>⏱️ {randomGame.time}分</span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>🧠 {Number(randomGame.complexity || 2.00).toFixed(2)}</span>
                  </div>
                </div>
              )}
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
                  padding: '10px 22px',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
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
                  padding: '10px 22px',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
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

      {/* ==================== 💎 詳細資料 Modal ==================== */}
      {viewDetailGame && (
        <div className="modal-overlay">
          <div className="detail-modal-content">
            {/* 🎯 頂部固定導航列：與右邊緣維持充足安全距離 */}
            <div className="detail-nav-header">
              <div className="detail-nav-left">
                <button
                  type="button"
                  onClick={() => { triggerHaptic('light'); setDetailTab('info'); }}
                  className={`detail-tab-btn ${detailTab === 'info' ? 'active-info' : ''}`}
                >
                  📖 遊戲介紹
                </button>
                <button
                  type="button"
                  onClick={() => { triggerHaptic('light'); setDetailTab('cheatSheet'); }}
                  className={`detail-tab-btn ${detailTab === 'cheatSheet' ? 'active-cheat' : ''}`}
                >
                  ⚡ 快速規則 / 提示卡
                </button>
              </div>

              <div className="detail-nav-right">
                {isAdmin && (
                  <>
                    <button 
                      type="button" 
                      className="detail-admin-btn"
                      onClick={() => handleOpenEditModal(viewDetailGame)}
                      style={{ background: 'var(--accent-blue)' }}
                    >
                      ✏️ 編輯
                    </button>
                    <button 
                      type="button" 
                      className="detail-admin-btn"
                      onClick={() => handleDeleteGame(viewDetailGame.id, viewDetailGame.name)}
                      style={{ background: '#EF4444' }}
                    >
                      🗑️ 刪除
                    </button>
                  </>
                )}
                <button 
                  type="button" 
                  className="detail-close-icon-btn" 
                  onClick={() => setViewDetailGame(null)}
                  title="關閉"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 🎯 獨立內部滾動容器 */}
            <div className="detail-body-scrollable">
              {detailTab === 'info' ? (
                <>
                  {/* 🌟 帶發光展台效果的圖片容器 */}
                  {viewDetailGame.imageUrl && (
                    <div className="detail-img-container">
                      <img 
                        src={viewDetailGame.imageUrl} 
                        alt={viewDetailGame.name} 
                        className="detail-modal-img"
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{viewDetailGame.emoji} {viewDetailGame.name}</h2>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, viewDetailGame.id)}
                      style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                      title={favorites.includes(viewDetailGame.id) ? "取消最愛" : "加入最愛"}
                    >
                      {favorites.includes(viewDetailGame.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <p className="detail-english">{viewDetailGame.englishName}</p>
                  
                  {/* 🌟 完美工整的 3 排 x 2 欄 雙欄數據卡 */}
                  <div className="detail-info-card">
                    {/* 第 1 排：基本人數 vs 最佳人數 */}
                    <div className="detail-info-item">
                      👥 <strong>人數：</strong>{viewDetailGame.minPlayers}–{viewDetailGame.maxPlayers}人
                    </div>
                    <div className="detail-info-item" style={{ color: '#D97706' }}>
                      👑 <strong>最佳人數：</strong>{viewDetailGame.bestPlayers || '未設定'}人
                    </div>

                    {/* 第 2 排：遊戲時間 vs 遊戲類型 */}
                    <div className="detail-info-item">
                      ⏱️ <strong>遊戲時間：</strong>{viewDetailGame.time} 分鐘
                    </div>
                    <div className="detail-info-item">
                      🏷️ <strong>遊戲類型：</strong>{viewDetailGame.category || '未分類'}
                    </div>

                    {/* 第 3 排：BGG 評分 vs 燒腦程度（左右呼應，完美齊平） */}
                    <div className="detail-info-item">
                      <a
                        href={viewDetailGame.bggUrl || `https://boardgamegeek.com/geeksearch.php?action=search&q=${encodeURIComponent(viewDetailGame.englishName || viewDetailGame.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bgg-link-badge-smooth"
                        title={viewDetailGame.bggUrl ? "前往 BoardGameGeek 專屬頁面" : "在 BoardGameGeek 搜尋此桌遊"}
                      >
                        ⭐ <strong>BGG 評分：</strong>
                        <span>{Number(viewDetailGame.rating || 0).toFixed(2)} 分</span>
                        <span className="bgg-external-icon">↗</span>
                      </a>
                    </div>
                    <div className="detail-info-item" style={{ color: 'var(--accent-blue)' }}>
                      🧠 <strong>燒腦指數：</strong>{Number(viewDetailGame.complexity || 2.00).toFixed(2)} / 5
                    </div>
                  </div>

                  {/* 🃏 橫條單列牌套膠囊槽 */}
                  {viewDetailGame.sleeveSize && (
                    <div className="sleeve-bar-row">
                      <span className="sleeve-bar-label">
                        🃏 牌套規格：
                      </span>
                      <div className="sleeve-bar-chips">
                        {viewDetailGame.sleeveSize.includes('免用牌套') ? (
                          <span className="sleeve-pill-chip free">
                            ✨ 免用牌套
                          </span>
                        ) : (
                          viewDetailGame.sleeveSize.split(',').map((sleeve, idx) => {
                            const text = sleeve.trim()
                            const countMatch = text.match(/\((.*?)\)/)
                            const sizeOnly = text.replace(/\s*\(.*?\)/, '').trim()
                            return (
                              <span key={idx} className="sleeve-pill-chip">
                                <span>{sizeOnly}</span>
                                {countMatch && (
                                  <span className="sleeve-pill-count">{countMatch[1]}</span>
                                )}
                              </span>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* 🎬 精緻型 YouTube 橫幅按鈕 */}
                  {viewDetailGame.videoUrl && (
                    <a 
                      href={viewDetailGame.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="video-banner-btn"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🎬</span>
                        <span>觀看教學影片</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>前往 YouTube ↗</span>
                    </a>
                  )}

                  {viewDetailGame.isExpansion && viewDetailGame.parentId && (
                    <div style={{ margin: '14px 0', padding: '12px 16px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
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
                            padding: '6px 14px',
                            borderRadius: '10px',
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

                  {viewDetailGame.isSequel && (
                    <div style={{ margin: '14px 0', padding: '12px 16px', background: 'rgba(14, 165, 233, 0.08)', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
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
                            padding: '6px 14px',
                            borderRadius: '10px',
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
                    <div className="detail-tags-row">
                      {viewDetailGame.tags.map(t => (
                        <span key={t} className="detail-tag-pill">#{t}</span>
                      ))}
                    </div>
                  )}

                  <p style={{ lineHeight: '1.7', margin: '16px 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>{viewDetailGame.description || '暫無詳細描述。'}</p>

                  {games.filter(g => g.parentId === viewDetailGame.id).length > 0 && (
                    <div className="expansion-list" style={{ marginTop: '18px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>🧩 關聯作品 / 擴充包：</h4>
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
                              padding: '7px 14px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
                            }}
                          >
                            {exp.isSequel ? '✨' : '🧩'} {exp.name} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mobile-admin-bar">
                      <button 
                        type="button" 
                        className="mobile-admin-btn"
                        onClick={() => handleOpenEditModal(viewDetailGame)}
                        style={{ background: 'var(--accent-blue)' }}
                      >
                        ✏️ 編輯桌遊
                      </button>
                      <button 
                        type="button" 
                        className="mobile-admin-btn"
                        onClick={() => handleDeleteGame(viewDetailGame.id, viewDetailGame.name)}
                        style={{ background: '#EF4444' }}
                      >
                        🗑️ 刪除桌遊
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '6px 0' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#10B981', fontSize: '1.1rem' }}>⚡ {viewDetailGame.name} 快速提示卡</h3>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px dashed #10B981',
                    borderRadius: '14px',
                    padding: '18px',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.8',
                    fontSize: '0.95rem'
                  }}>
                    {viewDetailGame.cheatSheet ? viewDetailGame.cheatSheet : '📌 目前尚未建立這款遊戲的快速規則提示，站長可透過「編輯桌遊」隨時補上開局重點！'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 新增/編輯 Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
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

              <div className="form-group">
                <label>📷 封面圖片網址 (Image URL)</label>
                <input 
                  type="url" 
                  placeholder="https://example.com/image.jpg" 
                  value={formData.imageUrl} 
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label>或 上傳本機圖片 (自動壓縮不裁切)</label>
                <input type="file" accept="image/*" onChange={handleCroppedImageUpload} />
              </div>

              {formData.imageUrl && (
                <div style={{
                  padding: '10px',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  margin: '8px 0',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    封面預覽
                  </span>
                  <img 
                    src={formData.imageUrl} 
                    alt="預覽" 
                    style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} 
                  />
                </div>
              )}

              <div className="form-group">
                <label>🏷️ 標籤 (以逗號分隔，例如: 新手推薦, 快節奏)</label>
                <input type="text" placeholder="例如: 派對, 爆笑, 雙人首選" value={formData.tagsInput} onChange={(e) => setFormData({...formData, tagsInput: e.target.value})} />
              </div>

              <div className="form-group">
                <label>🌐 BGG 專屬頁面網址 (可留空，未填寫時會自動搜尋)</label>
                <input type="url" placeholder="https://boardgamegeek.com/boardgame/..." value={formData.bggUrl} onChange={(e) => setFormData({...formData, bggUrl: e.target.value})} />
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