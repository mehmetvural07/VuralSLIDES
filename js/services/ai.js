const AI = {
  endpoint: 'https://g4f.space/api/groq/chat/completions',
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  maxTokens: 2048,

  async init() {
    if (window.electronAPI) {
      const cfg = await window.electronAPI.getConfig()
      const aiCfg = cfg.ai || {}
      this.endpoint = aiCfg.endpoint || this.endpoint
      this.model = aiCfg.model || this.model
      this.temperature = aiCfg.temperature ?? this.temperature
      this.maxTokens = aiCfg.maxTokens || this.maxTokens
    }
  },

  async _call(messages, options = {}) {
    const body = {
      model: options.model || this.model,
      messages,
      temperature: options.temperature ?? this.temperature,
      max_tokens: options.maxTokens || this.maxTokens,
    }
    const resp = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!resp.ok) throw new Error(`AI API error: ${resp.status}`)
    const data = await resp.json()
    return data.choices?.[0]?.message?.content || ''
  },

  async chat(messages) {
    const system = { role: 'system', content: 'Sen bir sunum asistanısın. Kullanıcının sunum hazırlamasına yardımcı ol. Kısa ve net cevaplar ver.' }
    return await this._call([system, ...messages])
  },

  async generateSlides(topic, count = 3, context = '') {
    const ctx = context ? `\n\nMevcut sunum:\n${context}` : ''
    const prompt = `"${topic}" konusu hakkında tam ${count} adet slayt oluştur. Her slayt: title (başlık), bullets (madde dizisi, en az 3 madde). Sadece geçerli JSON döndür, başka hiçbir şey yazma. Format: [{"title":"...","bullets":["...","...","..."]}]${ctx}`
    const text = await this._call([
      { role: 'system', content: 'JSON dizisi döndüren bir slayt üreticisin.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.5 })
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    try {
      const data = JSON.parse(cleaned)
      return Array.isArray(data) ? data : []
    } catch {
      throw new Error('AI yanıtı JSON olarak çözülemedi: ' + cleaned.slice(0, 200))
    }
  },

  async improveText(text, instruction) {
    const prompt = `${instruction}\n\nMetin: "${text}"\n\nSadece düzenlenmiş metni döndür, açıklama ekleme.`
    const msgs = [
      { role: 'system', content: 'Metin düzenleme asistanısın. Verilen metni istenen şekilde düzenleyip sadece sonucu döndürürsün.' },
      { role: 'user', content: prompt },
    ]
    return await this._call(msgs, { temperature: 0.3 })
  },

  async improveTextWithContext(text, instruction, slideContext) {
    const ctx = slideContext ? `\n\nSlayt içeriği:\n${slideContext}` : ''
    const prompt = `${instruction}\n\nMetin: "${text}"${ctx}\n\nSadece düzenlenmiş metni döndür.`
    return await this._call([
      { role: 'system', content: 'Metin düzenleme asistanısın.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.3 })
  }
}

window.AI = AI
