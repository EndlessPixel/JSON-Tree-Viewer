/* ========= 单选逻辑 ========= */
    const radios = document.querySelectorAll('input[name="source"]');
    const panels = {
        file : document.getElementById('panel-file'),
    url  : document.getElementById('panel-url'),
    text : document.getElementById('panel-text')
};
radios.forEach(r => r.addEventListener('change', () => {
        Object.values(panels).forEach(p => p.classList.remove('active'));
    panels[r.value] && panels[r.value].classList.add('active');
}));

/* ========= 工具函数 ========= */
const $ = id => document.getElementById(id);
    function showError(msg){
        $('error').textContent = msg;
    $('error').style.display = 'block'; 
}
    function clearError(){
        $('error').style.display = 'none'; 
}
    function showLoading(){
        $('loading').style.display = 'block';
    clearError(); 
}
    function hideLoading(){
        $('loading').style.display = 'none'; 
}

    /* ========= 导入逻辑 ========= */
    async function handleImport(){
  const source = [...radios].find(r => r.checked).value;
    let json = null;
    clearError();
    if(source === 'file'){
    const file = $('fileInput').files[0];
    if(!file){showError('请选择 JSON 文件'); return; }
    showLoading();
    try{
        json = JSON.parse(await file.text());
    }catch(e){
        showError('文件解析错误: ' + e.message);
    }finally{
        hideLoading();
    }
  }else if(source === 'url'){
    const url = $('urlInput').value.trim();
    if(!url){showError('请输入有效的 URL'); return; }
    if(!url.startsWith('http')){showError('URL 必须以 http:// 或 https:// 开头'); return; }
    showLoading();
    try{
      const res = await fetch(url);
    if(!res.ok) throw new Error(`请求失败: ${res.status} ${res.statusText}`);
    json = await res.json();
    }catch(err){
        showError('URL 拉取失败: ' + err.message);
    }finally{
        hideLoading();
    }
  }else if(source === 'text'){
    const txt = $('jsonInput').value.trim();
    if(!txt){showError('请输入 JSON 文本'); return; }
    showLoading();
    try{
        json = JSON.parse(txt);
    }catch(e){
        showError('JSON 解析错误: ' + e.message);
    }finally{
        hideLoading();
    }
  }
    if(json) {
        displayTree(json);
  }
}

    /* ========= 渲染树形结构 ========= */
    function displayTree(data) {
  const treeView = $('treeView');
    treeView.innerHTML = '';
    if (!data || typeof data !== 'object') {
        treeView.innerHTML = '<div class="tree-node">无效的 JSON 数据</div>';
    $('output').style.display = 'block';
    return;
  }

    // 创建根节点
    const rootNode = document.createElement('div');
    rootNode.className = 'tree-node';

    // 根据数据类型创建根节点内容
    let rootType = Array.isArray(data) ? 'array' : 'object';
    let rootSummary = rootType === 'array' ? `[共 ${data.length} 项]` : `[共 ${Object.keys(data).length} 属性]`;
    const rootContent = document.createElement('div');
    rootContent.className = 'tree-node-content';
    rootContent.innerHTML = `
    <span class="toggle" onclick="toggleNode(this)">−</span>
    <span class="tree-value">${rootSummary}</span>
    <span class="tree-type type-${rootType}">${rootType}</span>
    <span class="tree-path">(根节点)</span>
    `;
    rootNode.appendChild(rootContent);

    // 添加子节点容器
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    rootNode.appendChild(childrenContainer);

    // 递归构建子节点
    buildTree(data, childrenContainer, '', true);
    treeView.appendChild(rootNode);
    $('output').style.display = 'block';

    // 默认展开第一级
    rootNode.classList.add('expanded');
}

    function buildTree(obj, container, parentPath = '', isRoot = false) {
  if (!obj || typeof obj !== 'object') return;
    const entries = Array.isArray(obj) ? 
    obj.map((item, index) => [index, item]) :
    Object.entries(obj);
  entries.forEach(([key, value]) => {
    const node = document.createElement('div');
    node.className = 'tree-node';
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const isArrayItem = Array.isArray(obj);
    const displayKey = isArrayItem ? `[${key}]` : key;
    let type, displayValue, hasChildren;
    if (value === null) {
        type = 'null';
    displayValue = 'null';
    hasChildren = false;
    } else if (Array.isArray(value)) {
        type = 'array';
    displayValue = `[共 ${value.length} 项]`;
      hasChildren = value.length > 0;
    } else if (typeof value === 'object') {
        type = 'object';
    displayValue = `[共 ${Object.keys(value).length} 属性]`;
      hasChildren = Object.keys(value).length > 0;
    } else {
        type = typeof value;
    displayValue = type === 'string' ? `"${value}"` : value;
    hasChildren = false;
    }
    const nodeContent = document.createElement('div');
    nodeContent.className = 'tree-node-content';

    // 对于可折叠节点添加切换按钮
    const toggleBtn = hasChildren ?
    `<span class="toggle" onclick="toggleNode(this)">−</span>` :
    '<span style="display:inline-block;width:18px"></span>';
    nodeContent.innerHTML = `
    ${toggleBtn}
    <span class="tree-key">${displayKey}:<span class="tree-value type-${type}">${displayValue}</span></span>
    <span class="tree-type type-${type}">${type}</span>
    <button class="copy-btn" onclick="copyPath('${currentPath}')">复制⿻</button>`;
    node.appendChild(nodeContent);

    // 添加子节点容器
    if (hasChildren) {
      const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    node.appendChild(childrenContainer);

    // 递归构建子节点
    buildTree(value, childrenContainer, currentPath);
    node.classList.add('expanded');
    }
    container.appendChild(node);
  });
}

    // 复制到剪贴板
    function copyPath(path) {
        navigator.clipboard.writeText(path)
            .then(() => alert('已复制：' + path))
            .catch(() => alert('复制失败，请手动选择'));
}

// 即时搜索高亮
$('searchBox').addEventListener('input', e=>{
  const kw = e.target.value.trim().toLowerCase();
  document.querySelectorAll('.tree-node-content').forEach(n=>{
    const txt = n.textContent.toLowerCase();
    n.style.background = kw && txt.includes(kw) ? '#fff9c4' : '';
  });
});

    /* ========= 节点折叠/展开 ========= */
    function toggleNode(toggleElement) {
  const node = toggleElement.closest('.tree-node');
    if (!node) return;
    node.classList.toggle('expanded');
    toggleElement.textContent = node.classList.contains('expanded') ? '−' : '+';
}

// 页面加载时默认解析示例
window.addEventListener('DOMContentLoaded', () => {
  // 解析示例JSON
  const sampleData = JSON.parse($('jsonInput').value);
    displayTree(sampleData);
});
window.addEventListener('DOMContentLoaded', ()=>{
  const params = new URLSearchParams(location.search);
    const autoUrl = params.get('url');
    if(autoUrl){
        $('urlInput').value = autoUrl;
    radios[1].click();
    handleImport();
  }
});