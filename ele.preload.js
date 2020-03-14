
/*
window.MyIPCSend = ()=>{ 
    
    const {ipcRenderer} = require('electron');
    ipcRenderer.send("msg_render_to_main", "test");

}
*/

const {
    contextBridge,
    ipcRenderer
} = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            // whitelist channels
            const valid_channels = ["save_file_to_main","zoom"];
            if (valid_channels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        on: (channel, func) => {
            const valid_channels = ["open_file", "save_file","save_as","file_path","undo","redo","selectall","pdf_begin","pdf_end","showmarkdown","showhtml","changecss","mathnumbering","spellcheck"];
            if (valid_channels.includes(channel)) {
                console.log("catch: ", channel);
                
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);

//console.log("do preload.js");
