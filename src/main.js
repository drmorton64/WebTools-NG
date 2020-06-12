import Vue from 'vue'
import VueRouter from "vue-router"
import Vuex from "vuex"
import App from './App.vue'
import router from './router'
import store from './store'
import {wtutils, wtconfig, dialog} from './wtutils'

//import dialog from 'electron'


/*Icons - Styling - Design Frameworks - Sidemenu*/
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
import VueSidebarMenu from 'vue-sidebar-menu'
import 'vue-sidebar-menu/dist/vue-sidebar-menu.css'
import '@fortawesome/fontawesome-free/css/all.css'

import i18n from './i18n'

Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(VueSidebarMenu)
Vue.use(Buefy);

// Logging start
// Remember to define log in all components where its used, as in below
const log = require('electron-log');
log.transports.file.level = 'verbose';
log.transports.console.level = 'verbose';
log.transports.file.fileName = wtutils.AppName;
console.log = log.log;
log.info('*********************************') 
log.info('Starting ' + wtutils.AppName + ' Version:' + wtutils.AppVersion);
// Logging ended

//wtutils.MoveToHome();

// Get saved language to use, and default to en
i18n.locale = wtconfig.get('general.language', 'en')

Vue.config.productionTip = false

// App Menu Bar
log.info('Starting to build App Menu')
const menuTemplate = require('./menubar.js')
const menu = require('electron').remote.Menu.buildFromTemplate(menuTemplate.default)
require('electron').remote.Menu.setApplicationMenu(menu)
log.info('App Menu builded')

console.log('Ged start dialog')
/* const {remote} = require('electron'),
dialog = remote.dialog,
WIN = remote.getCurrentWindow();

let options = {
 //Placeholder 1
 title: "ExportTools Output file",
 
 //Placeholder 2
 defaultPath : "/home/tm/Documents",
 
 //Placeholder 4
 buttonLabel : "Ok",
 
 //Placeholder 3
 filters :[
  {name: 'ExportTools', extensions: ['xlsx', 'csv']},
  {name: 'All Files', extensions: ['*']}
 ]
}        


let filename = dialog.showSaveDialogSync(WIN, options)

console.log('Selected fileName: ' + filename)
 */

console.log('FileName: ' +  dialog.SelectFile('Gummiged', '/home/tm'));

new Vue({
  render: h => h(App),
  router: router,
  i18n,
  store: store  
}).$mount('#app')
