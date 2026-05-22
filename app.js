(function () {
  'use strict';

  var STORAGE_KEY = 'desire-indicator';

  var DEFAULT_SLIDERS = [
    {
      id: 'desire',
      name: '性欲',
      min: 0,
      max: 100,
      defaultValue: 50,
      value: 50,
      ranges: [
        { from: 0, to: 30, label: '低' },
        { from: 31, to: 70, label: '中等' },
        { from: 71, to: 100, label: '高' }
      ]
    },
    {
      id: 'orientation',
      name: '性取向',
      min: 0,
      max: 100,
      defaultValue: 50,
      value: 50,
      ranges: [
        { from: 0, to: 30, label: '偏女性' },
        { from: 31, to: 70, label: '双向 / 不确定' },
        { from: 71, to: 100, label: '偏男性' }
      ]
    },
    {
      id: 'intimacy',
      name: '亲密需求',
      min: 0,
      max: 100,
      defaultValue: 50,
      value: 50,
      ranges: [
        { from: 0, to: 30, label: '低' },
        { from: 31, to: 70, label: '中等' },
        { from: 71, to: 100, label: '高' }
      ]
    }
  ];

  var DEFAULT_STATE = {
    themeMode: 'auto',
    sliders: JSON.parse(JSON.stringify(DEFAULT_SLIDERS)),
    llmConfig: {
      apiUrl: '',
      apiKey: '',
      model: ''
    }
  };

  var state = loadState();
  var editingSliderId = null;
  var confirmCallback = null;

  function uid() {
    return 'sl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.sliders)) {
          if (!parsed.llmConfig) {
            parsed.llmConfig = { apiUrl: '', apiKey: '', model: '' };
          }
          return parsed;
        }
      }
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  function getLabelForValue(slider, value) {
    var v = (value !== undefined) ? value : slider.value;
    for (var i = 0; i < slider.ranges.length; i++) {
      var r = slider.ranges[i];
      if (v >= r.from && v <= r.to) {
        return r.label;
      }
    }
    return null;
  }

  function applyTheme() {
    var mode = state.themeMode || 'auto';
    var isDark = false;
    if (mode === 'dark') {
      isDark = true;
    } else if (mode === 'auto') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  function updateSliderFill(input) {
    var slider = findSlider(input.dataset.id);
    if (!slider) return;
    var min = slider.min;
    var max = slider.max;
    var val = Number(input.value);
    var pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
    var style = getComputedStyle(document.documentElement);
    var accent = style.getPropertyValue('--accent').trim() || '#7c3aed';
    var pink = style.getPropertyValue('--pink').trim() || '#ec4899';
    var track = style.getPropertyValue('--slider-track').trim() || 'rgba(124,58,237,0.12)';
    input.style.background = 'linear-gradient(90deg, ' + accent + ' 0%, ' + pink + ' ' + pct + '%, ' + track + ' ' + pct + '%, ' + track + ' 100%)';
  }

  function findSlider(id) {
    for (var i = 0; i < state.sliders.length; i++) {
      if (state.sliders[i].id === id) return state.sliders[i];
    }
    return null;
  }

  function showView(viewId) {
    var views = document.querySelectorAll('.view');
    for (var i = 0; i < views.length; i++) {
      views[i].classList.remove('active');
    }
    var target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
      target.style.animation = 'none';
      target.offsetHeight;
      target.style.animation = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showToast(message) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove('visible');
    }, 2200);
  }

  function showConfirm(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmOverlay').style.display = '';
    confirmCallback = callback;
  }

  function hideConfirm() {
    document.getElementById('confirmOverlay').style.display = 'none';
    confirmCallback = null;
  }

  function renderDashboard() {
    var container = document.getElementById('slidersList');
    if (state.sliders.length === 0) {
      container.innerHTML = '<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>暂无滑块，请在设置中添加</p></div>';
      return;
    }

    var html = '';
    for (var i = 0; i < state.sliders.length; i++) {
      var s = state.sliders[i];
      var label = getLabelForValue(s);
      var labelClass = label ? 'slider-label' : 'slider-label undefined';
      var labelText = label || '未定义';
      html += '<div class="glass-card slider-card" data-id="' + s.id + '">';
      html += '<div class="slider-header"><h3>' + escapeHtml(s.name) + '</h3>';
      html += '<span class="slider-value-badge">' + s.value + '</span></div>';
      html += '<div class="slider-track-wrapper">';
      html += '<input type="range" class="custom-slider" min="' + s.min + '" max="' + s.max + '" value="' + s.value + '" data-id="' + s.id + '">';
      html += '</div>';
      html += '<div class="' + labelClass + '"><span class="label-dot"></span>' + escapeHtml(labelText) + '</div>';
      html += '</div>';
    }
    container.innerHTML = html;

    var inputs = container.querySelectorAll('.custom-slider');
    for (var j = 0; j < inputs.length; j++) {
      updateSliderFill(inputs[j]);
    }
  }

  function renderSettingsSliderList() {
    var container = document.getElementById('settingsSliderList');
    if (state.sliders.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无滑块</p></div>';
      return;
    }

    var html = '';
    for (var i = 0; i < state.sliders.length; i++) {
      var s = state.sliders[i];
      html += '<div class="slider-list-item" data-id="' + s.id + '">';
      html += '<div class="item-info"><span class="item-color"></span>';
      html += '<div><div class="item-name">' + escapeHtml(s.name) + '</div>';
      html += '<div class="item-range">' + s.min + ' ~ ' + s.max + ' · ' + s.ranges.length + ' 个区间</div></div></div>';
      html += '<div class="item-actions">';
      html += '<button class="btn-edit-item" data-id="' + s.id + '" title="编辑"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>';
      html += '<button class="btn-delete-item" data-id="' + s.id + '" title="删除"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
      html += '</div></div>';
    }
    container.innerHTML = html;
  }

  function renderThemeSwitcher() {
    var btns = document.querySelectorAll('.theme-option');
    for (var i = 0; i < btns.length; i++) {
      var t = btns[i].dataset.theme;
      if (t === state.themeMode) {
        btns[i].classList.add('active');
      } else {
        btns[i].classList.remove('active');
      }
    }
  }

  function renderLLMConfig() {
    var c = state.llmConfig || {};
    document.getElementById('llmApiUrl').value = c.apiUrl || '';
    document.getElementById('llmApiKey').value = c.apiKey || '';
    document.getElementById('llmModel').value = c.model || '';
  }

  function saveLLMConfig() {
    if (!state.llmConfig) {
      state.llmConfig = { apiUrl: '', apiKey: '', model: '' };
    }
    state.llmConfig.apiUrl = document.getElementById('llmApiUrl').value.trim();
    state.llmConfig.apiKey = document.getElementById('llmApiKey').value.trim();
    state.llmConfig.model = document.getElementById('llmModel').value.trim();
    saveState();
  }

  function openSliderModal(sliderId) {
    editingSliderId = sliderId;
    var slider = sliderId ? findSlider(sliderId) : null;
    var isNew = !slider;

    document.getElementById('modalTitle').textContent = isNew ? '添加滑块' : '编辑滑块';
    document.getElementById('sliderName').value = isNew ? '' : slider.name;
    document.getElementById('sliderMin').value = isNew ? 0 : slider.min;
    document.getElementById('sliderMax').value = isNew ? 100 : slider.max;
    document.getElementById('sliderDefault').value = isNew ? 50 : slider.defaultValue;

    renderRanges(isNew ? [] : JSON.parse(JSON.stringify(slider.ranges)));
    document.getElementById('sliderModal').style.display = '';
  }

  function closeSliderModal() {
    document.getElementById('sliderModal').style.display = 'none';
    editingSliderId = null;
  }

  function renderRanges(ranges) {
    var container = document.getElementById('rangesContainer');
    if (!ranges || ranges.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:12px"><p style="font-size:0.82rem">暂无区间规则</p></div>';
      container._ranges = [];
      return;
    }
    container._ranges = ranges;
    var html = '';
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      html += '<div class="range-item" data-index="' + i + '">';
      html += '<input type="number" class="form-input range-from" value="' + r.from + '" placeholder="起始" data-index="' + i + '">';
      html += '<input type="number" class="form-input range-to" value="' + r.to + '" placeholder="结束" data-index="' + i + '">';
      html += '<input type="text" class="form-input range-label" value="' + escapeHtml(r.label) + '" placeholder="标签" data-index="' + i + '">';
      html += '<button class="btn-remove-range" data-index="' + i + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function collectRangesFromDOM() {
    var container = document.getElementById('rangesContainer');
    var ranges = container._ranges || [];
    var items = container.querySelectorAll('.range-item');
    var result = [];
    for (var i = 0; i < items.length; i++) {
      var fromInput = items[i].querySelector('.range-from');
      var toInput = items[i].querySelector('.range-to');
      var labelInput = items[i].querySelector('.range-label');
      var from = Number(fromInput.value);
      var to = Number(toInput.value);
      var label = labelInput.value.trim();
      if (isNaN(from) || isNaN(to) || !label) continue;
      result.push({ from: from, to: to, label: label });
    }
    return result;
  }

  function validateSliderForm() {
    var name = document.getElementById('sliderName').value.trim();
    var min = Number(document.getElementById('sliderMin').value);
    var max = Number(document.getElementById('sliderMax').value);
    var defaultVal = Number(document.getElementById('sliderDefault').value);
    var ranges = collectRangesFromDOM();

    if (!name) { showToast('请输入滑块名称'); return null; }
    if (isNaN(min) || isNaN(max)) { showToast('最小值和最大值必须为数字'); return null; }
    if (min >= max) { showToast('最小值必须小于最大值'); return null; }
    if (isNaN(defaultVal)) { showToast('默认值必须为数字'); return null; }
    if (defaultVal < min || defaultVal > max) { showToast('默认值应在最小值和最大值之间'); return null; }

    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      if (r.from > r.to) { showToast('区间起始值不能大于结束值'); return null; }
      if (r.from < min || r.to > max) { showToast('区间应在最小值和最大值范围内'); return null; }
    }

    for (var a = 0; a < ranges.length; a++) {
      for (var b = a + 1; b < ranges.length; b++) {
        if (ranges[a].from <= ranges[b].to && ranges[b].from <= ranges[a].to) {
          showToast('区间 ' + ranges[a].from + '-' + ranges[a].to + ' 与 ' + ranges[b].from + '-' + ranges[b].to + ' 存在重叠');
          return null;
        }
      }
    }

    return { name: name, min: min, max: max, defaultValue: defaultVal, ranges: ranges };
  }

  function saveSliderFromModal() {
    var data = validateSliderForm();
    if (!data) return;

    if (editingSliderId) {
      var slider = findSlider(editingSliderId);
      if (slider) {
        slider.name = data.name;
        slider.min = data.min;
        slider.max = data.max;
        slider.defaultValue = data.defaultValue;
        slider.ranges = data.ranges;
        if (slider.value < data.min) slider.value = data.min;
        if (slider.value > data.max) slider.value = data.max;
      }
    } else {
      var newSlider = {
        id: uid(),
        name: data.name,
        min: data.min,
        max: data.max,
        defaultValue: data.defaultValue,
        value: data.defaultValue,
        ranges: data.ranges
      };
      state.sliders.push(newSlider);
    }

    saveState();
    closeSliderModal();
    renderDashboard();
    renderSettingsSliderList();
  }

  function deleteSlider(id) {
    var slider = findSlider(id);
    if (!slider) return;
    showConfirm('删除滑块', '确定要删除「' + slider.name + '」吗？此操作不可撤销。', function () {
      state.sliders = state.sliders.filter(function (s) { return s.id !== id; });
      saveState();
      renderDashboard();
      renderSettingsSliderList();
    });
  }

  function buildSimpleConclusion() {
    var parts = [];
    for (var i = 0; i < state.sliders.length; i++) {
      var s = state.sliders[i];
      var label = getLabelForValue(s);
      if (label) {
        parts.push(s.name + label);
      } else {
        parts.push(s.name + '未定义');
      }
    }
    return '当前状态：' + parts.join('，');
  }

  function buildLLMPrompt() {
    var details = [];
    for (var i = 0; i < state.sliders.length; i++) {
      var s = state.sliders[i];
      var label = getLabelForValue(s) || '未定义';
      var pct = s.max === s.min ? 0 : Math.round(((s.value - s.min) / (s.max - s.min)) * 100);
      details.push('- ' + s.name + '：当前值 ' + s.value + '（' + s.min + '~' + s.max + ' 范围内处于 ' + pct + '% 位置），区间标签「' + label + '」');
    }

    return '你是一个毒舌但有趣的心理状态分析师。用户正在使用「性欲指示器」记录自己的多维状态，以下是各滑块的当前数据：\n\n'
      + details.join('\n')
      + '\n\n请根据以上数据，用1~2句话给出一个简短结论。要求：\n'
      + '1. 先客观概括当前状态的核心特征\n'
      + '2. 然后给出一句辛辣、毒舌、让人脸红不好意思的简评——就像一个很熟的朋友在旁边坏笑着吐槽你\n'
      + '3. 语气要幽默犀利，但不要低俗，要让人又羞又想笑\n'
      + '4. 直接输出结论，不要加引号、标题或任何前缀\n'
      + '5. 总字数控制在50字以内';
  }

  function isLLMConfigured() {
    var c = state.llmConfig || {};
    return !!(c.apiUrl && c.apiKey && c.model);
  }

  function callLLM(prompt, callback) {
    var c = state.llmConfig;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', c.apiUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + c.apiKey);
    xhr.timeout = 30000;

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          var text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
          text = text.trim();
          if (text) {
            callback(null, text);
          } else {
            callback('LLM 返回内容为空');
          }
        } catch (e) {
          callback('LLM 响应解析失败');
        }
      } else {
        callback('LLM 请求失败（HTTP ' + xhr.status + '）');
      }
    };

    xhr.onerror = function () {
      callback('网络错误，请检查 API 地址');
    };

    xhr.ontimeout = function () {
      callback('请求超时，请稍后重试');
    };

    var body = JSON.stringify({
      model: c.model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 200
    });

    xhr.send(body);
    return xhr;
  }

  var _currentLLMRequest = null;

  function generateConclusion() {
    if (state.sliders.length === 0) {
      showToast('请先添加滑块');
      return;
    }

    if (_currentLLMRequest) {
      _currentLLMRequest.abort();
      _currentLLMRequest = null;
    }

    var area = document.getElementById('conclusionArea');
    var textEl = document.getElementById('conclusionText');
    var btn = document.getElementById('generateBtn');

    if (!isLLMConfigured()) {
      textEl.textContent = buildSimpleConclusion();
      area.style.display = '';
      area.style.animation = 'none';
      area.offsetHeight;
      area.style.animation = '';
      area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    btn.classList.add('loading');
    btn.disabled = true;
    textEl.textContent = 'AI 正在生成辛辣评语…';
    area.style.display = '';
    area.style.animation = 'none';
    area.offsetHeight;
    area.style.animation = '';

    var prompt = buildLLMPrompt();

    _currentLLMRequest = callLLM(prompt, function (err, result) {
      _currentLLMRequest = null;
      btn.classList.remove('loading');
      btn.disabled = false;

      if (err) {
        textEl.textContent = buildSimpleConclusion();
        showToast(err);
      } else {
        textEl.textContent = result;
      }

      area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function copyConclusion() {
    var text = document.getElementById('conclusionText').textContent;
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('已复制');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('已复制');
    } catch (e) {
      showToast('复制失败');
    }
    document.body.removeChild(ta);
  }

  function exportConfig() {
    var data = {
      themeMode: state.themeMode,
      sliders: state.sliders.map(function (s) {
        return {
          id: s.id,
          name: s.name,
          min: s.min,
          max: s.max,
          defaultValue: s.defaultValue,
          value: s.value,
          ranges: s.ranges
        };
      }),
      llmConfig: {
        apiUrl: (state.llmConfig && state.llmConfig.apiUrl) || '',
        apiKey: '',
        model: (state.llmConfig && state.llmConfig.model) || ''
      }
    };
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'desire-indicator-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('配置已导出');
  }

  function importConfig() {
    document.getElementById('importFile').click();
  }

  function handleImportFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!data || !Array.isArray(data.sliders)) {
          showToast('配置格式无效');
          return;
        }
        for (var i = 0; i < data.sliders.length; i++) {
          var s = data.sliders[i];
          if (!s.name || typeof s.min !== 'number' || typeof s.max !== 'number') {
            showToast('配置格式无效：滑块数据不完整');
            return;
          }
          if (!Array.isArray(s.ranges)) {
            showToast('配置格式无效：缺少区间规则');
            return;
          }
        }
        state.themeMode = data.themeMode || 'auto';
        state.sliders = data.sliders;
        if (data.llmConfig) {
          state.llmConfig = data.llmConfig;
        } else if (!state.llmConfig) {
          state.llmConfig = { apiUrl: '', apiKey: '', model: '' };
        }
        saveState();
        applyTheme();
        renderThemeSwitcher();
        renderDashboard();
        renderSettingsSliderList();
        renderLLMConfig();
        showToast('配置已导入');
      } catch (err) {
        showToast('导入失败：JSON 解析错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function resetConfig() {
    showConfirm('重置配置', '确定要重置所有配置吗？这将清除所有自定义设置，恢复为默认配置。', function () {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      saveState();
      applyTheme();
      renderThemeSwitcher();
      renderDashboard();
      renderSettingsSliderList();
      renderLLMConfig();
      document.getElementById('conclusionArea').style.display = 'none';
      showToast('已重置为默认配置');
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function handleSliderInput(e) {
    var input = e.target;
    if (!input.classList.contains('custom-slider')) return;
    var id = input.dataset.id;
    var slider = findSlider(id);
    if (!slider) return;
    slider.value = Number(input.value);
    saveState();

    var card = input.closest('.slider-card');
    if (card) {
      var badge = card.querySelector('.slider-value-badge');
      if (badge) badge.textContent = slider.value;
      var labelEl = card.querySelector('.slider-label');
      if (labelEl) {
        var label = getLabelForValue(slider);
        var dot = labelEl.querySelector('.label-dot');
        if (label) {
          labelEl.className = 'slider-label';
          labelEl.innerHTML = '<span class="label-dot"></span>' + escapeHtml(label);
        } else {
          labelEl.className = 'slider-label undefined';
          labelEl.innerHTML = '<span class="label-dot"></span>未定义';
        }
      }
    }

    updateSliderFill(input);
  }

  function init() {
    applyTheme();
    renderDashboard();
    renderThemeSwitcher();
    renderLLMConfig();

    document.getElementById('goSettings').addEventListener('click', function () {
      renderSettingsSliderList();
      showView('settings');
    });

    document.getElementById('goDashboard').addEventListener('click', function () {
      renderDashboard();
      showView('dashboard');
    });

    document.getElementById('generateBtn').addEventListener('click', generateConclusion);
    document.getElementById('copyBtn').addEventListener('click', copyConclusion);

    document.getElementById('slidersList').addEventListener('input', handleSliderInput);

    document.getElementById('themeSwitcher').addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-option');
      if (!btn) return;
      state.themeMode = btn.dataset.theme;
      saveState();
      applyTheme();
      renderThemeSwitcher();
      var inputs = document.querySelectorAll('.custom-slider');
      for (var i = 0; i < inputs.length; i++) {
        updateSliderFill(inputs[i]);
      }
    });

    document.getElementById('llmApiUrl').addEventListener('change', saveLLMConfig);
    document.getElementById('llmApiKey').addEventListener('change', saveLLMConfig);
    document.getElementById('llmModel').addEventListener('change', saveLLMConfig);

    document.getElementById('addSliderBtn').addEventListener('click', function () {
      openSliderModal(null);
    });

    document.getElementById('settingsSliderList').addEventListener('click', function (e) {
      var editBtn = e.target.closest('.btn-edit-item');
      var deleteBtn = e.target.closest('.btn-delete-item');
      if (editBtn) {
        openSliderModal(editBtn.dataset.id);
      } else if (deleteBtn) {
        deleteSlider(deleteBtn.dataset.id);
      }
    });

    document.getElementById('modalClose').addEventListener('click', closeSliderModal);
    document.getElementById('modalCancel').addEventListener('click', closeSliderModal);
    document.getElementById('modalSave').addEventListener('click', saveSliderFromModal);

    document.getElementById('sliderModal').addEventListener('click', function (e) {
      if (e.target === this) closeSliderModal();
    });

    document.getElementById('addRangeBtn').addEventListener('click', function () {
      var container = document.getElementById('rangesContainer');
      var ranges = container._ranges || [];
      var min = Number(document.getElementById('sliderMin').value) || 0;
      var max = Number(document.getElementById('sliderMax').value) || 100;
      var newFrom = ranges.length > 0 ? ranges[ranges.length - 1].to + 1 : min;
      if (newFrom > max) newFrom = max;
      ranges.push({ from: newFrom, to: max, label: '' });
      renderRanges(ranges);
    });

    document.getElementById('rangesContainer').addEventListener('click', function (e) {
      var removeBtn = e.target.closest('.btn-remove-range');
      if (!removeBtn) return;
      var idx = Number(removeBtn.dataset.index);
      var container = document.getElementById('rangesContainer');
      var ranges = container._ranges || [];
      ranges.splice(idx, 1);
      renderRanges(ranges);
    });

    document.getElementById('rangesContainer').addEventListener('input', function (e) {
      var fromInput = e.target.closest('.range-from');
      var toInput = e.target.closest('.range-to');
      var labelInput = e.target.closest('.range-label');
      if (!fromInput && !toInput && !labelInput) return;
      var container = document.getElementById('rangesContainer');
      var idx = Number(e.target.dataset.index);
      if (isNaN(idx) || !container._ranges || !container._ranges[idx]) return;
      if (fromInput) container._ranges[idx].from = Number(fromInput.value);
      if (toInput) container._ranges[idx].to = Number(toInput.value);
      if (labelInput) container._ranges[idx].label = labelInput.value;
    });

    document.getElementById('exportBtn').addEventListener('click', exportConfig);
    document.getElementById('importBtn').addEventListener('click', importConfig);
    document.getElementById('importFile').addEventListener('change', handleImportFile);
    document.getElementById('resetBtn').addEventListener('click', resetConfig);

    document.getElementById('confirmCancel').addEventListener('click', hideConfirm);
    document.getElementById('confirmOk').addEventListener('click', function () {
      if (confirmCallback) confirmCallback();
      hideConfirm();
    });

    document.getElementById('confirmOverlay').addEventListener('click', function (e) {
      if (e.target === this) hideConfirm();
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (state.themeMode === 'auto') {
        applyTheme();
        var inputs = document.querySelectorAll('.custom-slider');
        for (var i = 0; i < inputs.length; i++) {
          updateSliderFill(inputs[i]);
        }
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var sliderModal = document.getElementById('sliderModal');
        var confirmOverlay = document.getElementById('confirmOverlay');
        if (confirmOverlay.style.display !== 'none') {
          hideConfirm();
        } else if (sliderModal.style.display !== 'none') {
          closeSliderModal();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
