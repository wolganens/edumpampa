const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const Tus = require('uppy/lib/plugins/Tus')
 
const uppy = Uppy({ autoProceed: false })
  .use(Dashboard, {
    trigger: '#select-files'
  })
  .use(Tus, {endpoint: 'https://master.tus.io/files/'})
  .run()
 
uppy.on('complete', (result) => {
  console.log(`Upload complete! We’ve uploaded these files: ${result.successful}`)
})
console.log(uppy)
window.uppy = uppy