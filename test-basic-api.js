/**
 * 基础API测试脚本
 */

const http = require('http')

function testAPI(port = 3002) {
  console.log(`🧪 Testing API on port ${port}...`)
  
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/pipeline/status',
    method: 'GET',
    timeout: 5000
  }
  
  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`)
    console.log(`Headers:`, res.headers)
    
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data)
        console.log('✅ API Response:', jsonData)
      } catch (error) {
        console.log('📄 Raw Response:', data)
      }
    })
  })
  
  req.on('error', (error) => {
    console.error('❌ Request Error:', error.message)
  })
  
  req.on('timeout', () => {
    console.error('⏰ Request Timeout')
    req.destroy()
  })
  
  req.end()
}

// 测试不同端口
const ports = [3000, 3001, 3002]
ports.forEach(port => {
  setTimeout(() => testAPI(port), port - 3000) * 1000
})