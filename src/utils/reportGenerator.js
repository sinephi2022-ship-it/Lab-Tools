export class ReportGenerator {
  constructor(project, elements, connections) {
    this.project = project
    this.elements = elements
    this.connections = connections
  }

  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.project.name} - 实验报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .report-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .report-header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #2196F3;
            padding-bottom: 20px;
        }
        .report-title {
            font-size: 28px;
            font-weight: 600;
            color: #2196F3;
            margin-bottom: 10px;
        }
        .report-meta {
            color: #666;
            font-size: 14px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            border-left: 4px solid #4CAF50;
            padding-left: 15px;
        }
        .element-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 3px solid #ddd;
        }
        .element-type {
            font-weight: 600;
            color: #2196F3;
            text-transform: uppercase;
            font-size: 12px;
            margin-bottom: 5px;
        }
        .element-content {
            white-space: pre-wrap;
        }
        .protocol-step {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        .step-checkbox {
            width: 16px;
            height: 16px;
            border: 2px solid #4CAF50;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4CAF50;
            font-size: 12px;
        }
        .step-checkbox.checked {
            background: #4CAF50;
            color: white;
        }
        .connections-diagram {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            color: #666;
            font-style: italic;
        }
        .report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { background: white; }
            .report-container { box-shadow: none; padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        ${this.generateHeader()}
        ${this.generateOverview()}
        ${this.generateElementsSection()}
        ${this.generateConnectionsSection()}
        ${this.generateFooter()}
    </div>
</body>
</html>`
    
    return html
  }

  generateHeader() {
    const now = new Date().toLocaleString('zh-CN')
    return `
        <div class="report-header">
            <h1 class="report-title">${this.project.name}</h1>
            <div class="report-meta">
                <p>生成时间: ${now}</p>
                <p>项目类型: ${this.project.isPublic ? '公开项目' : '私有项目'}</p>
                <p>房主: ${this.project.owner}</p>
                <p>参与成员: ${this.project.members.join(', ')}</p>
            </div>
        </div>`
  }

  generateOverview() {
    const elementStats = this.getElementStats()
    return `
        <div class="section">
            <h2 class="section-title">项目概览</h2>
            <div class="element-item">
                <div class="element-type">统计信息</div>
                <div class="element-content">
                    便签: ${elementStats.notes} 个<br>
                    计时器: ${elementStats.timers} 个<br>
                    协议: ${elementStats.protocols} 个<br>
                    文本: ${elementStats.texts} 个<br>
                    文件: ${elementStats.files} 个<br>
                    连接线: ${this.connections.length} 条
                </div>
            </div>
        </div>`
  }

  generateElementsSection() {
    let elementsHTML = '<div class="section"><h2 class="section-title">实验元素详情</h2>'
    
    const elementsByType = this.groupElementsByType()
    
    Object.entries(elementsByType).forEach(([type, elements]) => {
      if (elements.length > 0) {
        elementsHTML += this.generateElementsByType(type, elements)
      }
    })
    
    elementsHTML += '</div>'
    return elementsHTML
  }

  generateElementsByType(type, elements) {
    const typeNames = {
      note: '便签',
      timer: '计时器',
      protocol: '实验协议',
      text: '文本',
      file: '文件'
    }
    
    let html = `<h3 style="margin: 20px 0 10px 0; color: #666;">${typeNames[type] || type}</h3>`
    
    elements.forEach(element => {
      html += this.generateElementItem(element)
    })
    
    return html
  }

  generateElementItem(element) {
    let content = ''
    
    switch (element.type) {
      case 'note':
        content = `<div class="element-content">${element.content || '空便签'}</div>`
        break
      case 'timer':
        const duration = element.duration ? `${Math.floor(element.duration / 60000)}分${Math.floor((element.duration % 60000) / 1000)}秒` : '未设置'
        content = `<div class="element-content">设定时长: ${duration}</div>`
        break
      case 'protocol':
        content = this.generateProtocolContent(element)
        break
      case 'text':
        content = `<div class="element-content">${element.content || '空文本'}</div>`
        break
      case 'file':
        content = `<div class="element-content">文件名: ${element.fileName || element.content || '未知文件'}</div>`
        break
      default:
        content = `<div class="element-content">${element.content || ''}</div>`
    }
    
    return `
        <div class="element-item">
            <div class="element-type">${element.type}</div>
            ${content}
        </div>`
  }

  generateProtocolContent(element) {
    if (!element.content) return '<div class="element-content">空协议</div>'
    
    const steps = element.content.split('\n').filter(line => line.trim())
    let html = '<div class="element-content">'
    
    steps.forEach((step, index) => {
      const isDone = element.steps && element.steps[index] && element.steps[index].done
      html += `
        <div class="protocol-step">
          <div class="step-checkbox ${isDone ? 'checked' : ''}">
            ${isDone ? '✓' : ''}
          </div>
          <span>${step}</span>
        </div>`
    })
    
    html += '</div>'
    return html
  }

  generateConnectionsSection() {
    if (this.connections.length === 0) {
      return `
        <div class="section">
            <h2 class="section-title">连接关系</h2>
            <div class="connections-diagram">
                此项目暂无连接关系
            </div>
        </div>`
    }
    
    let html = '<div class="section"><h2 class="section-title">连接关系</h2>'
    
    this.connections.forEach(connection => {
      const fromElement = this.elements.find(el => el.id === connection.from)
      const toElement = this.elements.find(el => el.id === connection.to)
      
      if (fromElement && toElement) {
        html += `
          <div class="element-item">
            <div class="element-type">连接</div>
            <div class="element-content">
              ${this.getElementDescription(fromElement)} → ${this.getElementDescription(toElement)}
            </div>
          </div>`
      }
    })
    
    html += '</div>'
    return html
  }

  getElementDescription(element) {
    const typeNames = {
      note: '便签',
      timer: '计时器',
      protocol: '协议',
      text: '文本',
      file: '文件'
    }
    
    const preview = element.content ? 
      (element.content.length > 20 ? element.content.substring(0, 20) + '...' : element.content) :
      '未命名'
    
    return `${typeNames[element.type] || element.type}: ${preview}`
  }

  generateFooter() {
    return `
        <div class="report-footer">
            <p>本报告由 LabMate Pro 自动生成</p>
            <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>`
  }

  getElementStats() {
    return {
      notes: this.elements.filter(el => el.type === 'note').length,
      timers: this.elements.filter(el => el.type === 'timer').length,
      protocols: this.elements.filter(el => el.type === 'protocol').length,
      texts: this.elements.filter(el => el.type === 'text').length,
      files: this.elements.filter(el => el.type === 'file').length
    }
  }

  groupElementsByType() {
    const grouped = {}
    
    this.elements.forEach(element => {
      if (!grouped[element.type]) {
        grouped[element.type] = []
      }
      grouped[element.type].push(element)
    })
    
    return grouped
  }

  downloadReport() {
    const html = this.generateHTMLReport()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${this.project.name}_实验报告_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  generateMarkdownReport() {
    let markdown = `# ${this.project.name} - 实验报告\n\n`
    markdown += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`
    markdown += `**项目类型**: ${this.project.isPublic ? '公开项目' : '私有项目'}\n\n`
    markdown += `**房主**: ${this.project.owner}\n\n`
    markdown += `**参与成员**: ${this.project.members.join(', ')}\n\n`
    
    markdown += `## 项目概览\n\n`
    const stats = this.getElementStats()
    markdown += `- 便签: ${stats.notes} 个\n`
    markdown += `- 计时器: ${stats.timers} 个\n`
    markdown += `- 协议: ${stats.protocols} 个\n`
    markdown += `- 文本: ${stats.texts} 个\n`
    markdown += `- 文件: ${stats.files} 个\n`
    markdown += `- 连接线: ${this.connections.length} 条\n\n`
    
    markdown += `## 实验元素详情\n\n`
    const elementsByType = this.groupElementsByType()
    
    Object.entries(elementsByType).forEach(([type, elements]) => {
      if (elements.length > 0) {
        markdown += `### ${this.getTypeDisplayName(type)}\n\n`
        elements.forEach(element => {
          markdown += `- ${this.getElementDescription(element)}\n`
        })
        markdown += '\n'
      }
    })
    
    if (this.connections.length > 0) {
      markdown += `## 连接关系\n\n`
      this.connections.forEach(connection => {
        const fromElement = this.elements.find(el => el.id === connection.from)
        const toElement = this.elements.find(el => el.id === connection.to)
        
        if (fromElement && toElement) {
          markdown += `- ${this.getElementDescription(fromElement)} → ${this.getElementDescription(toElement)}\n`
        }
      })
      markdown += '\n'
    }
    
    markdown += `---\n\n`
    markdown += `*本报告由 LabMate Pro 自动生成*\n`
    markdown += `*生成时间: ${new Date().toLocaleString('zh-CN')}*\n`
    
    return markdown
  }

  getTypeDisplayName(type) {
    const typeNames = {
      note: '便签',
      timer: '计时器',
      protocol: '实验协议',
      text: '文本',
      file: '文件'
    }
    return typeNames[type] || type
  }

  downloadMarkdownReport() {
    const markdown = this.generateMarkdownReport()
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${this.project.name}_实验报告_${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function generateReport(project, elements, connections, format = 'html') {
  const generator = new ReportGenerator(project, elements, connections)
  
  if (format === 'markdown') {
    generator.downloadMarkdownReport()
  } else {
    generator.downloadReport()
  }
}